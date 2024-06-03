import Node from './Node.js';
import Edge from './Edge.js';

export default class Person extends Node {
    constructor(id, label, x, y, user) {
        super(id, label, x, y, 10);
        this.friends = new Map(); //Contains {friend: score} pairs
        this.items = new Map(); //Contains {item: score} pairs
        this.infoLinks = new Map(); //Contains {infoLink: score} pairs
        this.socialScore = 0.5; //Decides how social the agent is
        this.profileImage = user.image;
        this.userName = user.username;
    }

    //Function for choosing a random social media post to read
    readSocialMediaPost(nodes, links) {
        console.log("readSocialMediaPost function");
        //Pick a random node from the nodes map that has label of Social Media Post
        const socialMediaPosts = Array.from(nodes.values()).filter((node) => node.label === "Social Media Post");
        const randomPost = socialMediaPosts[Math.floor(Math.random() * socialMediaPosts.length)];

        //Get the friends who have also read the post by checking the readers map of the post and see if it contains my friends
        // const friendsThatReadPost = randomPost.readers.filter((reader) => this.friends.has(reader));
        const friendsThatReadPost = Array.from(randomPost.readers.keys()).filter((reader) => this.friends.has(reader));
        //From my friends who have read the post, get the scores they have with the post
        const friendScores = friendsThatReadPost.map((friend) => randomPost.readers.get(friend));

        //Get the infolinks who have also read the post by checking the readers map of the post and see if it contains my infolinks
        // const infoLinksThatReadPost = randomPost.readers.filter((reader) => this.infoLinks.has(reader));
        console.log("randomPost.readers", randomPost.readers, "this.friends", this.friends);
        const infoLinksThatReadPost = Array.from(randomPost.readers.keys()).filter((reader) => this.infoLinks.has(reader));
        //From my infolinks who have read the post, get the scores they have with the post
        const infoLinkScores = infoLinksThatReadPost.map((infoLink) => randomPost.readers.get(infoLink));

        console.log("infoLinksThatReadPost", infoLinksThatReadPost, "friendsThatReadPost", friendsThatReadPost); // TODO empty arrays
        console.log("friendScores", friendScores, "infoLinkScores", infoLinkScores); // TODO empty arrays

        //Calculate the score of the post for me based on the scores of my friends and infolinks and also the distance to the post.
        //The score will be -1, 0 or 1 based on the average of the scores
        let myScore = (friendScores.reduce((a, b) => a + b, 0) + infoLinkScores.reduce((a, b) => a + b, 0)) / (friendScores.length + infoLinkScores.length);
        // TODO gives not a number

        //Calculate the distance from me to the post
        const distance = Math.sqrt(Math.pow(this.x - randomPost.x, 2) + Math.pow(this.y - randomPost.y, 2));
        //Adjust the score based on the distance
        console.log("myScore", myScore, "-", distance, "/", 100);
        myScore = myScore - distance / 100;
        //Change the score to -1, 0 or 1
        myScore = myScore > 0 ? 1 : myScore < 0 ? -1 : 0;
        console.log("MY SCORE", myScore);
        //Add the post to my items with the calculated score
        randomPost.score = myScore;
        console.log(randomPost.score);
        this.score = myScore;
        this.items.set(randomPost.id, randomPost); // add the my score
        // this.items.set(randomPost, myScore); This adds the randomPost as a key and the score as the value of that key

        //Add myself to the readers of the post
        randomPost.readers.set(this.id, this);
        console.log("POST", randomPost, "READER", this);

        const link = new Edge(this, randomPost, "item-link");
        links.set(this.id + "-" + randomPost.id, link);
        link.drawLink();

        return myScore;
    }

    //Function for forwarding a social media post to friends
    forwardSocialMediaPost() {
        console.log("forwardSocialMediaPost function");
        //Get a random post from my items
        const myPosts = Array.from(this.items.keys());
        const randomPost = myPosts[Math.floor(Math.random() * myPosts.length)];
        console.log("RANDOMPOST", randomPost, "MYPOSTS", myPosts);
        //Check what my score is with the post
        console.log(this.items);
        const myScore = this.items.get(randomPost);
        // myScore.id
        console.log("myScore", myScore); // get the score of the post

        // TODO myScore is een node, wat is hier de bedoeling?
        //If the score is positive, forward the post to all my friends.
        if (myScore.score > 0) {
            console.log("myScore > 0", myScore.score);
            //With a percentage chance equal to my social score, forward the post to my friends
            if (Math.random() < this.socialScore) {
                this.friends.forEach((friend) => {
                    friend.receiveSocialMediaPost(this, randomPost, "friend");
                });
            }
        } else {
            console.log("myScore < 0", myScore);
        }
    }

    //Function for receiving forwarded social media posts
    receiveSocialMediaPost(sender, post, relationship) {
        console.log("receiveSocialMediaPost function");
        let relationshipScore = 0;

        //Check if I have already read the post
        if (this.items.has(post.id)) {
            return;
        }

        if (relationship === "friend") {
            //Check the relationship score between me and the sender
            relationshipScore = this.friends.get(sender.id);
        } else if (relationship === "infoLink") {
            //Check the relationship score between me and the sender
            relationshipScore = this.infoLinks.get(sender.id);
        }

        //Check if the post is similar to posts I have read before by retrieving the x and y coordinates of the post and comparing them with the coordinates of my items
        let similarityThreshold = 10;
        const amountSimilarPosts = Array.from(this.items.keys()).filter(
            (item) => Math.abs(item.x - post.x) < similarityThreshold && Math.abs(item.y - post.y) < similarityThreshold
        ).length;
        console.log("amountSimilarPosts", amountSimilarPosts);
        let isSimilar = amountSimilarPosts > this.items.size / 2 ? true : false;

        //Calculate a score for the post based on the relationship score and the similarity
        let postScore = relationshipScore + (isSimilar ? 1 : -1);

        //Add the post to my items with the calculated score
        this.items.set(post, postScore);

        //Add myself to the readers of the post
        post.readers.set(this, postScore);

        //if the postScore was negative, reduce the score between me and the sender by 1
        if (postScore < 0) {
            if (relationship === "friend") {
                this.friends.set(sender, relationshipScore - 1); // TODO relationshipScore zit niet in de friends map
            } else if (relationship === "infoLink") {
                this.infoLinks.set(sender, relationshipScore - 1);
            }
        } else {
            //if the postScore was positive, increase the score between me and the sender by 1
            if (relationship === "friend") {
                this.friends.set(sender, relationshipScore + 1);
            } else if (relationship === "infoLink") {
                this.infoLinks.set(sender, relationshipScore + 1);
            }
        }
    }

    //Function for managing relationships with friends and infolinks
    manageRelationships() {
        console.log("manageRelationships function");
        this.friends.forEach((score, friend) => {
            console.log("Score:", score, friend);
            // TODO score is node

            //Check if there are any friends that have a score of -3 or lower and remove them
            if (score <= -3) {
                friend.friends.delete(this);
                this.friends.delete(friend);
            }
            //Check if there are any friends that have a score of 3 or higher. If so, add person as infoLink
            if (score >= 3) {
                this.infoLinks.set(friend, 0);
            }
        });

        //Check if there are any infolinks that have a score of -5 or lower and remove them
        this.infoLinks.forEach((score, infoLink) => {
            if (score <= -5) {
                infoLink.infoLinks.delete(this);
                this.infoLinks.delete(infoLink);
            }
        });
    }

    //Function for adding friends through content
    addFriendThroughContent() {
        console.log("add friend function");
        //Get an array of all posts I have read and liked
        const positivePosts = Array.from(this.items.keys()).filter((post) => this.items.get(post) > 0);
        console.log("positivePosts", positivePosts);
        //For each post, flip a coin. If heads, add a random person that also liked the post as a friend
        positivePosts.forEach((post) => {
            if (Math.random() > 0.5) {
                console.log("Math.random() > 0.5", post);
                //Get all people who have read the post and liked it
                const peopleThatReadPost = Array.from(post.readers.keys()).filter(
                    (reader) => post.readers.get(reader) > 0 && reader !== this && !this.friends.has(reader)
                );
                //Pick a random person from the list and add them as a friend
                const randomPerson = peopleThatReadPost[Math.floor(Math.random() * peopleThatReadPost.length)];
                this.friends.set(randomPerson, 0);
                randomPerson.friends.set(this, 0);
                console.log("ADDED FRIEND", randomPerson, " TO ", this);
            }
        });
    }

    // get(friend.id) en movenode moet naar person
    //Function for moving the agent to a new position
    moveNode() {
        // TODO krijgt nergens een friend of infolink toegewezen
        //Get all friends and infolinks with a score higher than 0
        // console.log(this.friends.get(friend), this.infoLinks.get(infoLink));
        const positiveFriends = Array.from(this.friends.keys()).filter((friend) => this.friends.get(friend.id) > 0);
        const positiveInfoLinks = Array.from(this.infoLinks.keys()).filter((infoLink) => this.infoLinks.get(infoLink.id) > 0);
        console.log("posFriends:", positiveFriends, "posInfolinks", positiveInfoLinks);
        //Get all items with a score higher than 0
        const positiveItems = Array.from(this.items.keys()).filter((item) => this.items.get(item.id) > 0);

        //Calculate the average position of all friends, infolinks and items
        let averageX = this.x;
        let averageY = this.y;

        console.log("PLACE", averageX, averageY, "THIS", this);
        positiveFriends.forEach((friend) => {
            averageX += friend.x;
            averageY += friend.y;
            console.log("FRIEND X + Y", friend.x, friend.y);
        });
        positiveInfoLinks.forEach((infoLink) => {
            averageX += infoLink.x;
            averageY += infoLink.y;
            console.log("infoLink X + Y", infoLink.x, infoLink.y);
        });
        positiveItems.forEach((item) => {
            averageX += item.x;
            averageY += item.y;
            console.log("item X + Y", item.x, item.y);
        });
        averageX = averageX / (positiveFriends.length + positiveInfoLinks.length + positiveItems.length + 1);
        averageY = averageY / (positiveFriends.length + positiveInfoLinks.length + positiveItems.length + 1);

        //Move the agent towards the average position
        let dx = averageX - this.x;
        let dy = averageY - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            console.log("DISTANCE", distance);
            this.x += dx / distance;
            this.y += dy / distance;
        }
    }

    /**
     * Function for performing all behaviors of the agent in one step
     * @param {Object} node - ...
     */
    step(nodes, links) {
        this.readSocialMediaPost(nodes, links);
        this.forwardSocialMediaPost();
        this.manageRelationships();
        this.addFriendThroughContent();
        this.moveNode();
    }

    //Function that spawns 'forward' buttons under each read social media post by the currently selected person node
    spawnForwardButtons(links) {
        //Get the node ids of every social media post that the selected person node has read
        this.items.forEach((item) => {
            let svgIcon = document.createElement("img");
            svgIcon.src = "../images/sns_icons_Send.svg";
            svgIcon.alt = "Forward";
            let itemNodeData = item;
            let forwardButton = document.createElement("button");
            forwardButton.classList.add("forwardButton");
            forwardButton.appendChild(svgIcon);
            forwardButton.style.position = "absolute";
            forwardButton.style.left = itemNodeData.x + "px";
            forwardButton.style.top = itemNodeData.y + "px";
            forwardButton.addEventListener("click", () => {
                // const friendsArray = this.friends;
                this.friends.forEach((friend) => {
                    this.addItemLink(item, friend, links);
                    this.addInfoLink(friend, this, links);
                });
            });
            canvasContainer.appendChild(forwardButton);
        });
    }

    //Function to remove all forward buttons from the canvas
    removeForwardButtons() {
        let forwardButtons = document.querySelectorAll(".forwardButton");
        forwardButtons.forEach((button) => {
            button.remove();
        });
    }

    //Function for adding a friend link between the currently selected node and the node with the given id
    addFriend(node, links) {
        let toBeFriend = node;

        this.friends.set(node.id, node);
        toBeFriend.friends.set(this.id, this);

        const link = new Edge(this, node, "friend-link");
        links.set(this.id + "-" + toBeFriend.id, link);
        // link.drawLink();
    }

    removeFriend(node, links) {
        let linkKey1 = this.id + "-" + node.id;
        let linkKey2 = node.id + "-" + this.id;

        let linkElement1 = links.get(linkKey1);
        let linkElement2 = links.get(linkKey2);

        if (linkElement1 !== undefined && linkElement1.element !== undefined) {
            linkElement1.element.remove();
        } else if (linkElement2 !== undefined && linkElement2.element !== undefined) {
            linkElement2.element.remove();
        } else {
            return;
        }

        this.friends.delete(node.id);
        //  = this.friends.filter((id) => id !== node.id);
        node.friends.delete(this.id);
        // = node.friends.filter((id) => id !== this.id);

        links.delete(linkKey1);
        links.delete(linkKey2);
        //redrawCanvas(); // Redraws the links
        // resizeNodes(nodes);
    }

    //Function for adding an item link between the currently selected node and the node with the given id
    addItemLink(item, from, links) {
        let currentlySelectedPerson = from;
        let currentEyedItem = item;
        currentlySelectedPerson.items.set(item.id, item);
        currentEyedItem.readers.set(from.id, from);

        const link = new Edge(from, item, "item-link");
        links.set(from.id + "-" + item.id, link);
    }

    //Function for removing an item link between the currently selected node and the node with the given id
    removeItemLink(item, links) {
        this.items.delete(item.id);
        item.readers.delete(this.id);

        links.get(this.id + "-" + item.id).element.remove();
        links.delete(this.id + "-" + item.id);
    }

    //Function for adding an info link between the currently selected node and the node with the given id
    addInfoLink(from, to, links) {
        from.infoLinks.set(to.id, to);

        const link = new Edge(from, to, "info-link");
        links.set(from.id + "-" + to.id, link);
    }

    //Function for removing an info link between the currently selected node and the node with the given id
    removeInfoLink(from, to, links) {
        links.get(from + "-" + to).element.remove();
        links.delete(`${from}-${to}`);
    }
}