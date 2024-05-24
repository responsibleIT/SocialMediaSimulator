import Node from './Node.js';
import Edge from './Edge.js';

export default class Person extends Node {
    constructor(id, label, x, y, user) {
        super(id, label, x, y, 8);
        this.friends = new Map(); //Contains {friend: score} pairs
        this.items = new Map(); //Contains {item: score} pairs
        this.infoLinks = new Map(); //Contains {infoLink: score} pairs
        this.socialScore = 0.5; //Decides how social the agent is
        this.profileImage = user.image;
        this.userName = user.username;
    }

    //Function for choosing a random social media post to read
    readSocialMediaPost() {
        //Pick a random node from the nodes map that has label of Social Media Post
        const socialMediaPosts = Array.from(nodes.values()).filter((node) => node.label === "Social Media Post");
        const randomPost = socialMediaPosts[Math.floor(Math.random() * socialMediaPosts.length)];

        //Get the friends who have also read the post by checking the readers map of the post and see if it contains my friends
        const friendsThatReadPost = randomPost.readers.filter((reader) => this.friends.has(reader));
        //From my friends who have read the post, get the scores they have with the post
        const friendScores = friendsThatReadPost.map((friend) => randomPost.readers.get(friend));

        //Get the infolinks who have also read the post by checking the readers map of the post and see if it contains my infolinks
        const infoLinksThatReadPost = randomPost.readers.filter((reader) => this.infoLinks.has(reader));
        //From my infolinks who have read the post, get the scores they have with the post
        const infoLinkScores = infoLinksThatReadPost.map((infoLink) => randomPost.readers.get(infoLink));

        //Calculate the score of the post for me based on the scores of my friends and infolinks and also the distance to the post.
        //The score will be -1, 0 or 1 based on the average of the scores
        const myScore = (friendScores.reduce((a, b) => a + b, 0) + infoLinkScores.reduce((a, b) => a + b, 0)) / (friendScores.length + infoLinkScores.length);
        //Calculate the distance from me to the post
        const distance = Math.sqrt(Math.pow(this.x - randomPost.x, 2) + Math.pow(this.y - randomPost.y, 2));
        //Adjust the score based on the distance
        myScore = myScore - distance / 100;
        //Change the score to -1, 0 or 1
        myScore = myScore > 0 ? 1 : myScore < 0 ? -1 : 0;

        //Add the post to my items with the calculated score
        this.items.set(randomPost, myScore);

        //Add myself to the readers of the post
        randomPost.readers.set(this, myScore);

        return myScore;
    }

    //Function for forwarding a social media post to friends
    forwardSocialMediaPost() {
        //Get a random post from my items
        const myPosts = Array.from(this.items.keys());
        const randomPost = myPosts[Math.floor(Math.random() * myPosts.length)];

        //Check what my score is with the post
        const myScore = this.items.get(randomPost);

        //If the score is positive, forward the post to all my friends.
        if (myScore > 0) {
            //With a percentage chance equal to my social score, forward the post to my friends
            if (Math.random() < this.socialScore) {
                this.friends.forEach((friend) => {
                    friend.receiveSocialMediaPost(this, randomPost, "friend");
                });
            }
        }
    }

    //Function for receiving forwarded social media posts
    receiveSocialMediaPost(sender, post, relationship) {
        let relationshipScore = 0;

        //Check if I have already read the post
        if (this.items.has(post)) {
            return;
        }

        if (relationship === "friend") {
            //Check the relationship score between me and the sender
            relationshipScore = this.friends.get(sender);
        } else if (relationship === "infoLink") {
            //Check the relationship score between me and the sender
            relationshipScore = this.infoLinks.get(sender);
        }

        //Check if the post is similar to posts I have read before by retrieving the x and y coordinates of the post and comparing them with the coordinates of my items
        let similarityThreshold = 10;
        const amountSimilarPosts = Array.from(this.items.keys()).filter(
            (item) => Math.abs(item.x - post.x) < similarityThreshold && Math.abs(item.y - post.y) < similarityThreshold
        ).length;
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
                this.friends.set(sender, relationshipScore - 1);
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
        this.friends.forEach((score, friend) => {
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
        //Get an array of all posts I have read and liked
        const positivePosts = Array.from(this.items.keys()).filter((post) => this.items.get(post) > 0);

        //For each post, flip a coin. If heads, add a random person that also liked the post as a friend
        positivePosts.forEach((post) => {
            if (Math.random() > 0.5) {
                //Get all people who have read the post and liked it
                const peopleThatReadPost = Array.from(post.readers.keys()).filter(
                    (reader) => post.readers.get(reader) > 0 && reader !== this && !this.friends.has(reader)
                );
                //Pick a random person from the list and add them as a friend
                const randomPerson = peopleThatReadPost[Math.floor(Math.random() * peopleThatReadPost.length)];
                this.friends.set(randomPerson, 0);
                randomPerson.friends.set(this, 0);
            }
        });
    }

    //Function that spawns 'forward' buttons under each read social media post by the currently selected person node
    spawnForwardButtons() {
        let selectedNodeData = this;
        //Get the node ids of every social media post that the selected person node has read
        selectedNodeData.items.forEach((itemId) => {
            let svgIcon = document.createElement("img");
            svgIcon.src = "../images/sns_icons_Send.svg";
            svgIcon.alt = "Forward";
            let itemNodeData = nodes.get(itemId);
            let forwardButton = document.createElement("button");
            forwardButton.classList.add("forwardButton");
            forwardButton.appendChild(svgIcon);
            forwardButton.style.position = "absolute";
            forwardButton.style.left = itemNodeData.x + "px";
            forwardButton.style.top = itemNodeData.y + "px";
            forwardButton.addEventListener("click", function () {
                selectedNodeData.friends.forEach((friendId) => {
                    addItemLink(friendId, itemId);
                    addInfoLink(friendId, selectedNode);
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
    addFriend(node) {
        let currentlySelected = this;
        let toBeFriend = node;

        currentlySelected.friends.set(node.id, node);
        toBeFriend.friends.set(this.id, this);

        const link = new Edge(this, node, "friend");
        link.drawLink();
        // const linkElement = drawLink(currentlySelected, toBeFriend, "friend", 4);
        // addLink(from, to, "friend", linkElement);
        // resizeNodes(nodes);
    }

    removeFriend(node) {
        let personIdData = this;
        let friendIdData = node;

        let linkKey1 = personId + "-" + friendId;
        let linkKey2 = friendId + "-" + personId;

        let linkElement1 = links.get(linkKey1);
        let linkElement2 = links.get(linkKey2);

        if (linkElement1 !== undefined && linkElement1.linkElement !== undefined) {
            linkElement1.linkElement.remove();
        } else if (linkElement2 !== undefined && linkElement2.linkElement !== undefined) {
            linkElement2.linkElement.remove();
        } else {
            return;
        }

        personIdData.friends = personIdData.friends.filter((id) => id !== friendId);
        friendIdData.friends = friendIdData.friends.filter((id) => id !== personId);

        links.delete(linkKey1);
        links.delete(linkKey2);
        //redrawCanvas(); // Redraws the links
        resizeNodes(nodes);
    }

    //Function for adding an item link between the currently selected node and the node with the given id
    addItemLink(item, itemId) {
        console.log("addItemLink", this, item);
        let currentlySelectedPerson = this;
        let currentEyedItem = item;
        currentlySelectedPerson.items.set(itemId, item);
        currentEyedItem.readers.set(this.id, this);

        const link = new Edge(this, item, "itemlink");
        link.drawLink();
    }

    //Function for removing an item link between the currently selected node and the node with the given id
    removeItemLink(item, itemId) {
        console.log("removeItemLink");
        const personId = this.id;

        let personIdData = this;
        let itemIdData = item;


		personIdData.items.delete(itemId);
		itemIdData.readers.delete(personId)
        // personIdData.items = personIdData.items.filter((id) => id !== itemId);
        // itemIdData.readers = itemIdData.readers.filter((id) => id !== personId);

        links.get(personId + "-" + itemId).linkElement.remove();
        links.delete(personId + "-" + itemId);
        resizeNodes(nodes);
        //redrawCanvas(); // Redraws the links
    }

    //Function for adding an info link between the currently selected node and the node with the given id
    addInfoLink(from, to) {
        console.log("addInfoLink");
        let fromData = nodes.get(from);
        let toData = nodes.get(to);

        fromData.infolinks.push(to);

        const linkElement = drawLink(fromData, toData, "infolink", 4);
        addLink(from, to, "infolink", linkElement);

        resizeNodes(nodes);
    }

    //Function for removing an info link between the currently selected node and the node with the given id
    removeInfoLink(from, to) {
        console.log("removeInfoLink");
        links.get(from + "-" + to).linkElement.remove();
        links.delete(`${from}-${to}`);
        resizeNodes(nodes);
        // redrawCanvas();
    }
}