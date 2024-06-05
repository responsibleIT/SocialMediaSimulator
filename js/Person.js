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
        let friendScores = [];
        let infoLinkScores = [];
        let myScore = 0;

        //Pick a random node from the nodes map that has label of Social Media Post
        const socialMediaPosts = Array.from(nodes.values()).filter((node) => node.label === "Social Media Post");
        const randomPost = socialMediaPosts[Math.floor(Math.random() * socialMediaPosts.length)];

        const exists = this.items.get(randomPost.id);
        if (!exists) {
            // console.log("already read");
            if (this.friends.size != 0) {
                //Get the friends who have also read the post by checking the readers map of the post and see if it contains my friends
                const friendsThatReadPost = Array.from(randomPost.readers.keys()).filter((reader) => this.friends.has(reader));
                //From my friends who have read the post, get the scores they have with the post
                if (friendsThatReadPost.length > 0) {
                    friendScores = friendsThatReadPost.map((friend) => {
                        const reader = randomPost.readers.get(friend);
                        return reader.score;
                    }); // Gets the node that has this id, not the score
                }
            }

            if (this.infoLinks.size != 0) {
                //Get the infolinks who have also read the post by checking the readers map of the post and see if it contains my infolinks
                const infoLinksThatReadPost = Array.from(randomPost.readers.keys()).filter((reader) => this.infoLinks.has(reader)); // Is id
                //From my infolinks who have read the post, get the scores they have with the post
                infoLinkScores = infoLinksThatReadPost.map((infoLink) => {
                    const reader = randomPost.readers.get(infoLink);
                    return reader.score;
                }); // Gets the node that has this id, not the score
            }
            //Calculate the score of the post for me based on the scores of my friends and infolinks and also the distance to the post.
            //The score will be -1, 0 or 1 based on the average of the scores
            if (friendScores.length > 0 || infoLinkScores.length > 0) {
                myScore = (friendScores.reduce((a, b) => a + b, 0) + infoLinkScores.reduce((a, b) => a + b, 0)) / (friendScores.length + infoLinkScores.length);
            }
            //Calculate the distance from me to the post
            const distance = Math.sqrt(Math.pow(this.x - randomPost.x, 2) + Math.pow(this.y - randomPost.y, 2));
            //Adjust the score based on the distance
            myScore = myScore - distance / 130;
            //Change the score to -1, 0 or 1
            myScore = myScore > 0 ? 1 : myScore < 0 ? -1 : 0;
            //Add the post to my items with the calculated score

            this.items.set(randomPost.id, { post: randomPost, score: myScore }); // add the my score
            // This adds the randomPost as a key and the score as the value of that key

            //Add myself to the readers of the post
            randomPost.readers.set(this.id, { person: this, score: myScore });

            const link = new Edge(this, randomPost, "item-link");
            links.set(this.id + "-" + randomPost.id, link);
            link.drawLink();
        }
    }

    //Function for forwarding a social media post to friends
    forwardSocialMediaPost() {
        //Get a random post from my items
        const myPosts = Array.from(this.items.keys()); // myPosts = array with id's
        const randomPost = myPosts[Math.floor(Math.random() * myPosts.length)];

        //Check what my score is with the post
        const postObject = this.items.get(randomPost);

        //If the score is positive, forward the post to all my friends.
        if (postObject.score > 0) {
            //With a percentage chance equal to my social score, forward the post to my friends
            if (Math.random() < this.socialScore) {
                this.friends.forEach((friend) => {
                    if (friend.person) {
                        friend.person.receiveSocialMediaPost(this, postObject.post, "friend");
                    } else {
                        console.error("friend.person doesnt exist");
                        friend.receiveSocialMediaPost(this, postObject.post, "friend");
                    }
                });
            }
        }
    }

    //Function for receiving forwarded social media posts
    receiveSocialMediaPost(sender, post, relationship) {
        let relationshipScore = 0;

        //Check if I have already read the post
        if (this.items.has(post.id)) {
            return;
        }

        if (relationship === "friend") {
            //Check the relationship score between me and the sender
            const friend = this.friends.get(sender.id); // TODO add score when adding friend
            relationshipScore = friend.score;
        } else if (relationship === "infoLink") {
            //Check the relationship score between me and the sender
            const sender = this.infoLinks.get(sender.id); // TODO add score when adding infolink
            relationshipScore = sender.score;
        }

        //Check if the post is similar to posts I have read before by retrieving the x and y coordinates of the post and comparing them with the coordinates of my items
        let similarityThreshold = 150;
        const amountSimilarPosts = Array.from(this.items.keys()).filter(
            (item) => Math.abs(item.post.x - post.x) < similarityThreshold && Math.abs(item.post.y - post.y) < similarityThreshold
        ).length;
        let isSimilar = amountSimilarPosts > this.items.size / 2 ? true : false;

        //Calculate a score for the post based on the relationship score and the similarity
        let postScore = relationshipScore + (isSimilar ? 1 : -1);

        //Add the post to my items with the calculated score
        // this.items.set(post, postScore); // TODO
        this.items.set(post.id, { post: post, score: postScore });
        // TODO linkje tekenen

        //Add myself to the readers of the post
        post.readers.set(this.id, { person: this, score: postScore });

        //if the postScore was negative, reduce the score between me and the sender by 1
        if (postScore < 0) {
            console.log("DECREASE FRIEND RELATIONSHIP", this, sender, "relationship:", relationship);
            if (relationship === "friend") {
                this.friends.set(sender.id, { person: sender, score: relationshipScore - 1 });
            } else if (relationship === "infoLink") {
                // this.addInfoLink(sender, this, links);
                this.infoLinks.set(sender.id, { person: sender, score: relationshipScore - 1 });
            }
        } else {
            console.log("IMPROVE FRIEND RELATIONSHIP", this, sender, "relationship:", relationship);
            //if the postScore was positive, increase the score between me and the sender by 1
            if (relationship === "friend") {
                this.friends.set(sender.id, { person: sender, score: relationshipScore + 1 });
            } else if (relationship === "infoLink") {
                this.infoLinks.set(sender.id, { person: sender, score: relationshipScore + 1 });
            }
        }
    }

    //Function for managing relationships with friends and infolinks
    manageRelationships() {
        this.friends.forEach((aFriend) => {
            let score;
            let friend;
            if (!aFriend.person) {
                score = aFriend.score;
                friend = aFriend.person;
            } else {
                score = 3;
                friend = aFriend;
            }

            //Check if there are any friends that have a score of -3 or lower and remove them
            if (score <= -3) {
                friend.friends.delete(this);
                this.friends.delete(friend.id);
                // TODO delete edge
            }
            //Check if there are any friends that have a score of 3 or higher. If so, add person as infoLink
            if (score >= 3) {
                this.infoLinks.set(friend.id, { person: friend, score: 0 }); // 0 is default
                // TODO add info edge
            }
        });

        //Check if there are any infolinks that have a score of -5 or lower and remove them
        this.infoLinks.forEach((link) => {
            // link.person, link.scrore
            if (link.score <= -5) {
                // infoLink.infoLinks.delete(this);
                this.infoLinks.delete(link);
            }
        });
    }

    //Function for adding friends through content
    addFriendThroughContent() {
        //Get an array of all posts I have read and liked
        const positivePosts = Array.from(this.items.keys()).filter((post) => {
            // console.log(this.items.get(post) > 0);
            if (post.score > 0) {
                return post;
            }
        });
        //For each post, flip a coin. If heads, add a random person that also liked the post as a friend
        positivePosts.forEach((post) => {
            if (Math.random() > 0.5) {
                //Get all people who have read the post and liked it
                const peopleThatReadPost = Array.from(post.readers.values()).filter((reader) => {
                    const foundReader = post.readers.get(reader.id);
                    if (foundReader.score > 0 && reader !== this.id && !this.friends.has(reader)) {
                        return reader;
                    }
                });
                //Pick a random person from the list and add them as a friend
                const randomPerson = peopleThatReadPost[Math.floor(Math.random() * peopleThatReadPost.length)];
                this.friends.set(randomPerson.id, { person: randomPerson, score: 0 });
                randomPerson.friends.set(this.id, { person: this, score: 0 });
            }
        });
    }

    // get(friend.id) en movenode moet naar person
    //Function for moving the agent to a new position
    moveNode() {
        //Get all friends and infolinks with a score higher than 0
        // console.log("this friends:", this.friends);
        const positiveFriends = Array.from(this.friends.values()).filter((friend) => {
            console.log(this.friends, friend, friend); // friend is id
            const foundFriend = this.friends.get(friend.person.id);
            console.log("foundFriend", foundFriend);
            if (foundFriend.score > 0) {
                return foundFriend;
            }
        });
        const positiveInfoLinks = Array.from(this.infoLinks.values()).filter((infoLink) => {
            const foundInfoLink = this.infoLinks.get(infoLink.person.id);
            console.log("foundInfoLink", foundInfoLink);
            if (foundInfoLink.score > 0) {
                return foundInfoLink;
            }
        });
        //Get all items with a score higher than 0
        const positiveItems = Array.from(this.items.values()).filter((item) => {
            const foundItem = this.items.get(item.post.id);
            if (foundItem.score > 0) {
                return foundItem;
            }
        });

        //Calculate the average position of all friends, infolinks and items
        let averageX = this.x;
        let averageY = this.y;

        positiveFriends.forEach((friend) => {
            if (friend.person) {
                friend = friend.person;
            }
            averageX += friend.x;
            averageY += friend.y;
        });
        positiveInfoLinks.forEach((infoLink) => {
            console.log(infoLink); // TODO this infolink had a object in person
            if (infoLink.person && !infoLink.person.person) {
                infoLink = infoLink.person;
            } else if (infoLink.person.person && !infoLink.person.person.person) {
                infoLink = infoLink.person.person;
            } else if (infoLink.person.person.person) {
                infoLink = infoLink.person.person.person;
            }
            averageX += infoLink.x;
            averageY += infoLink.y;
        });
        positiveItems.forEach((item) => {
            if (item.post) {
                item = item.post;
            }
            averageX += item.x;
            averageY += item.y;
        });
        averageX = averageX / (positiveFriends.length + positiveInfoLinks.length + positiveItems.length + 1);
        averageY = averageY / (positiveFriends.length + positiveInfoLinks.length + positiveItems.length + 1);

        //Move the agent towards the average position
        let dx = averageX - this.x;
        let dy = averageY - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            console.log("this x and y", this.x, this.y);
            // TODO modify the 5
            this.x += (dx / distance) * 5;
            this.y += (dy / distance) * 5;
            this.element.style.left = this.x + "px";
            this.element.style.top = this.y + "px";
            console.log("this x and y after adding distance", this.x, this.y);
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
        this.removeForwardButtons();
        //Get the node ids of every social media post that the selected person node has read
        this.items.forEach((item) => {
            let svgIcon = document.createElement("img");
            svgIcon.src = "./images/sns_icons_Send.svg";
            svgIcon.alt = "Forward";
            // console.log(item);
            let itemNodeData;
            if (item.post) {
                itemNodeData = item.post;
            } else {
                itemNodeData = item;
            }
            let forwardButton = document.createElement("button");
            forwardButton.classList.add("forwardButton");
            forwardButton.appendChild(svgIcon);
            forwardButton.style.position = "absolute";
            forwardButton.style.left = itemNodeData.x + "px";
            forwardButton.style.top = itemNodeData.y - itemNodeData.radius - itemNodeData.popularity + "px";
            forwardButton.addEventListener("click", () => {
                // const friendsArray = this.friends;
                this.friends.forEach((friend) => {
                    if (friend.person) {
                        friend = friend.person;
                    }
                    this.addItemLink(itemNodeData, friend, links);
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
        console.log("friend", node);
        this.friends.set(node.id, { person: node, score: 0 });
        toBeFriend.friends.set(this.id, { person: this, score: 0 });

        const link = new Edge(this, node, "friend-link");
        links.set(this.id + "-" + toBeFriend.id, link);
        // link.drawLink();
    }

    removeFriend(node, links) {
        console.log("remove friend", node);
        if (node.person) {
            node = node.person;
        }
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
        console.log(currentlySelectedPerson);
        currentlySelectedPerson.items.set(item.id, { post: item, score: 1 });
        currentEyedItem.readers.set(from.id, { person: from, score: 1 });

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
        from.infoLinks.set(to.id, { person: to, score: 0 });

        const link = new Edge(from, to, "info-link");
        links.set(from.id + "-" + to.id, link);
    }

    //Function for removing an info link between the currently selected node and the node with the given id
    removeInfoLink(from, to, links) {
        links.get(from + "-" + to).element.remove();
        links.delete(`${from}-${to}`);
    }
}