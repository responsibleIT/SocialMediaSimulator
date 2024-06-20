import Node from "./Node.js";
import Edge from "./Edge.js";

export default class Person extends Node {
    constructor(id, label, x, y, user) {
        super(id, label, x, y, 10);
        this.friends = new Map(); //Contains {friend: score} pairs
        this.items = new Map(); //Contains {item: score} pairs
        this.infoLinks = new Map(); //Contains {infoLink: score} pairs
        this.socialScore = this.getRandomNumber(); //Decides how social the agent is
        this.profileImage = user.image;
        this.userName = user.username;
        this.growFactor = 1.5;
    }

    // change these values to let the network behave differently
    acceptanceDisctance = 300;
    defaultScore = 1;
    stepDistance = 5;
    addInfoLinkThreshold = 3;
    removeFriendLinkThreshold = -2;
    removeInfoLinkThreshold = -5;
    defaultRelationshipScore = 1;

    // Function for choosing a random social media post to read
    readSocialMediaPost(nodes, links) {
        let friendScores = [];
        let infoLinkScores = [];
        let myScore = this.defaultScore;

        //Pick a random node from the nodes map that has label of Social Media Post
        const socialMediaPosts = Array.from(nodes.values()).filter((node) => node.label === "Social Media Post");
        const randomPost = socialMediaPosts[Math.floor(Math.random() * socialMediaPosts.length)];

        const exists = this.items.get(randomPost.id);
        if (!exists) {
            if (this.friends.size != 0) {
                //Get the friends who have also read the post by checking the readers map of the post and see if it contains my friends
                const friendsThatReadPost = Array.from(randomPost.readers.keys()).filter((reader) => this.friends.has(reader));
                //From my friends who have read the post, get the scores they have with the post
                if (friendsThatReadPost.length > 0) {
                    friendScores = friendsThatReadPost.map((friend) => {
                        const reader = randomPost.readers.get(friend);
                        return reader.score;
                    });
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
            // Calculate the score of the post for me based on the scores of my friends and infolinks and also the distance to the post.
            if (friendScores.length > 0 || infoLinkScores.length > 0) {
                // The score will be -1, 0 or 1 based on the average of the scores
                myScore = (friendScores.reduce((a, b) => a + b, 0) + infoLinkScores.reduce((a, b) => a + b, 0)) / (friendScores.length + infoLinkScores.length);
            }

            myScore = this.calculateScore(myScore, randomPost);

            this.items.set(randomPost.id, { post: randomPost, score: myScore });
            randomPost.readers.set(this.id, { person: this, score: myScore });

            const link = new Edge(this, randomPost, "item-link");
            links.set(this.id + "-" + randomPost.id, link);

            if (myScore < 0) {
                link.element.classList.add("disliked-link");
            } else {
                link.element.classList.add("liked-link");
            }
        }
    }

    //Function for forwarding a social media post to friends
    forwardSocialMediaPost(links) {
        // Get a random post from my items
        const myPosts = Array.from(this.items.keys());
        const randomPost = myPosts[Math.floor(Math.random() * myPosts.length)];

        // Check what my score is with the post
        const postObject = this.items.get(randomPost);

        //If the score is positive, forward the post to all my friends.
        if (postObject.score > 0) {
            //With a percentage chance equal to my social score, forward the post to my friends

            if (Math.random() < this.socialScore) {
                this.friends.forEach((friend) => {
                    if (friend.person) {
                        friend.person.receiveSocialMediaPost(this, postObject.post, friend.score, links);
                    } else {
                        console.error("friend.person doesnt exist");
                        friend.receiveSocialMediaPost(this, postObject.post, 0, links);
                    }
                });
            }
        }
    }

    //Function for receiving forwarded social media posts
    receiveSocialMediaPost(sender, post, relationshipScore, links) {
        let relationship = "friend";
        this.infoLinks.forEach((person) => {
            if (person.person === sender) {
                relationship = "infoLink";
            }
        });

        if (this.items.has(post.id)) {
            return;
        }

        //Check if the post is similar to posts I have read before by retrieving the x and y coordinates of the post and comparing them with the coordinates of my items
        let similarityThreshold = 150;
        const amountSimilarPosts = Array.from(this.items.values()).filter((item) => {
            item = item.post;

            const similarPostsArray = Math.abs(item.x - post.x) < similarityThreshold && Math.abs(item.y - post.y) < similarityThreshold;
            // TODO FIX: similarPostsArray returns false
            return similarPostsArray.length;
        });
        let isSimilar = amountSimilarPosts > this.items.size / 2 ? true : false; // amountSimilarPosts = []

        //Calculate a score for the post based on the relationship score and the similarity
        let postScore = relationshipScore + (isSimilar ? 1 : -1);

        if (relationship === "friend") {
            this.items.set(post.id, { post: post, score: postScore });
            const link = new Edge(this, post, "item-link");
            links.set(this.id + "-" + post.id, link);
            post.readers.set(this.id, { person: this, score: postScore });
        } else if (relationship === "infoLink") {
            const link = this.infoLinks.has(sender.id);

            if (link === true) {
                this.addInfoLink(this, sender, links, relationshipScore);
            }

            const myScore = 1;
            const score = this.calculateScore(myScore, post);

            this.items.set(post.id, { post: post, score: score });
            post.readers.set(this.id, { person: this, score: score });

            const link2 = new Edge(this, post, "item-link");
            links.set(this.id + "-" + post.id, link2);
        }

        //if the postScore was negative, reduce the score between me and the sender by 1
        if (postScore < 0) {
            if (relationship === "friend") {
                this.friends.set(sender.id, { person: sender, score: relationshipScore - 1 });
            } else if (relationship === "infoLink") {
                this.infoLinks.set(sender.id, { person: sender, score: relationshipScore - 1 });
            }
        } else {
            //if the postScore was positive, increase the score between me and the sender by 1
            if (relationship === "friend") {
                this.friends.set(sender.id, { person: sender, score: relationshipScore + 1 });
            } else if (relationship === "infoLink") {
                this.infoLinks.set(sender.id, { person: sender, score: relationshipScore + 1 });
            }
        }
    }

    calculateScore(myScore, post) {
        //Calculate the distance from me to the post
        const distance = Math.sqrt(Math.pow(this.x - post.x, 2) + Math.pow(this.y - post.y, 2));

        //Adjust the score based on the distance
        myScore = myScore - distance / this.acceptanceDisctance;
        //Change the score to -1, 0 or 1
        myScore = myScore > 0 ? 1 : myScore < 0 ? -1 : 0;

        return myScore;
    }

    //Function for managing relationships with friends and infolinks
    manageRelationships(links) {
        this.friends.forEach((friend) => {
            //Check if there are any friends that have a score of -... or lower and remove them
            if (friend.score <= this.removeFriendLinkThreshold) {
                this.removeFriend(friend.person, links);
            }
            //Check if there are any friends that have a score of ... or higher. If so, add person as infoLink
            if (friend.score >= this.addInfoLinkThreshold) {
                //  check if someone already is an infolink
                const link = this.infoLinks.has(friend.person.id);
                if (!link) {
                    this.addInfoLink(this, friend.person, links);
                }
            }
        });

        //Check if there are any infolinks that have a score of -... or lower and remove them
        this.infoLinks.forEach((link) => {
            if (link.score <= this.removeInfoLinkThreshold) {
                this.removeInfoLink(this, friend, links);
            }
        });
    }

    //Function for adding friends through content
    addFriendThroughContent(links) {
        //Get an array of all posts I have read and liked
        const positivePosts = Array.from(this.items.values()).filter((post) => {
            if (post.score > 0) {
                return post;
            }
        });
        //For each post, flip a coin. If heads, add a random person that also liked the post as a friend
        positivePosts.forEach((post) => {
            if (Math.random() < this.socialScore) {
                // change this back to 0.5?
                post = post.post;
                //Get all people who have read the post and liked it
                const peopleThatReadPost = Array.from(post.readers.values()).filter((reader) => {
                    reader = reader.person;
                    const foundReader = post.readers.get(reader.id);
                    if (foundReader.score > 0 && reader.id !== this.id && !this.friends.has(reader.id)) {
                        return reader;
                    }
                });
                if (peopleThatReadPost.length > 0) {
                    //Pick a random person from the list and add them as a friend
                    const randomPerson = peopleThatReadPost[Math.floor(Math.random() * peopleThatReadPost.length)];
                    this.addFriend(randomPerson.person, links);
                }
            }
        });
    }

    //Function for moving the agent to a new position
    moveNode(links) {
        //Get all friends and infolinks with a score higher than 0
        const positiveFriends = Array.from(this.friends.values()).filter((friend) => {
            const foundFriend = this.friends.get(friend.person.id);
            if (foundFriend.score > 0) {
                return foundFriend;
            }
        });
        const positiveInfoLinks = Array.from(this.infoLinks.values()).filter((infoLink) => {
            const foundInfoLink = this.infoLinks.get(infoLink.person.id);
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
            averageX += friend.person.x;
            averageY += friend.person.y;
        });
        positiveInfoLinks.forEach((infoLink) => {
            infoLink = infoLink.person;

            averageX += infoLink.x;
            averageY += infoLink.y;
        });
        positiveItems.forEach((item) => {
            averageX += item.post.x;
            averageY += item.post.y;
        });
        averageX = averageX / (positiveFriends.length + positiveInfoLinks.length + positiveItems.length + 1);
        averageY = averageY / (positiveFriends.length + positiveInfoLinks.length + positiveItems.length + 1);

        //Move the agent towards the average position
        let dx = averageX - this.x;
        let dy = averageY - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.x += (dx / distance) * this.stepDistance;
            this.y += (dy / distance) * this.stepDistance;
            this.element.style.left = this.x + "px";
            this.element.style.top = this.y + "px";
            this.moveLinks(links);
        }
    }

    moveLinks(links) {
        this.friends.forEach((friend) => {
            this.findLink(friend, links);
        });
        this.infoLinks.forEach((link) => {
            this.findLink(link, links);
        });
        this.items.forEach((item) => {
            this.findLink(item, links);
        });
    }

    findLink(node, links) {
        if (node.person) {
            node = node.person;
        } else if (node.post) {
            node = node.post;
        }
        let link;
        link = links.get(`${this.id}-${node.id}`);
        if (!link) {
            link = links.get(`${node.id}-${this.id}`);
        }
        link.calcAngle();
    }

    /**
     * Function for performing all behaviors of the agent in one step
     * @param {Object} node - ...
     */
    step(nodes, links) {
        this.readSocialMediaPost(nodes, links);
        this.forwardSocialMediaPost(links);
        this.manageRelationships(links);
        this.addFriendThroughContent(links);
        this.moveNode(links);
    }

    //Function that spawns 'forward' buttons under each read social media post by the currently selected person node
    spawnForwardButtons(links, filteredEdges) {
        this.removeForwardButtons();
        //Get the node ids of every social media post that the selected person node has read
        if (this.friends.size > 0) {
            this.items.forEach((item) => {
                let svgIcon = document.createElement("img");
                svgIcon.src = "./images/share.svg";
                svgIcon.alt = "Forward";
                let itemNodeData = item.post;
                let score = item.score;
                if ((score > 0 && !filteredEdges.includes("liked-link")) || (score < 0 && !filteredEdges.includes("disliked-link"))) {
                    let forwardButton = document.createElement("button");
                    forwardButton.classList.add("forwardButton");
                    forwardButton.appendChild(svgIcon);
                    forwardButton.style.position = "absolute";
                    forwardButton.style.left = itemNodeData.x + "px";
                    forwardButton.style.top =
                        itemNodeData.y -
                        itemNodeData.radius -
                        ((itemNodeData.popularity - itemNodeData.increasedPopularity) * itemNodeData.growFactor) / 2 +
                        "px";
                    forwardButton.addEventListener("click", () => {
                        this.friends.forEach((friend) => {
                            if (friend.person) {
                                friend = friend.person;
                            }
                            this.addItemLink(itemNodeData, friend, links);
                            this.addInfoLink(friend, this, links);
                        });
                    });
                    canvasContainer.appendChild(forwardButton);
                }
            });
        }
    }

    //Function to remove all forward buttons from the canvas
    removeForwardButtons() {
        let forwardButtons = document.querySelectorAll(".forwardButton");
        forwardButtons.forEach((button) => {
            button.remove();
        });
    }

    //Function for adding a friend link between the currently selected node and the node with the given id
    addFriend(node, links, score = this.defaultRelationshipScore) {
        const friend = this.friends.has(node.id);
        if (friend === false) {
            let toBeFriend = node;
            this.friends.set(node.id, { person: node, score: score });
            toBeFriend.friends.set(this.id, { person: this, score: score });

            const link = new Edge(this, node, "friend-link");
            links.set(this.id + "-" + toBeFriend.id, link);
        }
    }

    removeFriend(node, links) {
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
        node.friends.delete(this.id);

        links.delete(linkKey1);
        links.delete(linkKey2);
    }

    //Function for adding an item link between the currently selected node and the node with the given id
    addItemLink(item, from, links, score = 1) {
        from.items.set(item.id, { post: item, score });
        item.readers.set(from.id, { person: from, score });

        const link = new Edge(from, item, "item-link");
        links.set(from.id + "-" + item.id, link);
        if (score > 0) {
            link.element.classList.add("liked-link");
        } else {
            link.element.classList.add("disliked-link");
        }
    }

    //Function for removing an item link between the currently selected node and the node with the given id
    removeItemLink(item, links) {
        this.items.delete(item.id);
        item.readers.delete(this.id);

        links.get(this.id + "-" + item.id).element.remove();
        links.delete(this.id + "-" + item.id);
    }

    //Function for adding an info link between the currently selected node and the node with the given id
    addInfoLink(from, to, links, score = 0) {
        let friendLink = links.get(`${from.id}-${to.id}`);
        if (!friendLink) {
            friendLink = links.get(`${to.id}-${from.id}`);
        }
        if (friendLink) {
            if (friendLink.type === "friend-link") {
                friendLink.type = "info-link";
                friendLink.element.classList.remove("friend-link");
                friendLink.element.classList.add("info-link");
                from.infoLinks.set(to.id, { person: to, score: score });
            }
        } else {
            console.debug("friendLink is not found", friendLink, "from, to", from, to, "links", links);
        }
    }

    //Function for removing an info link between the currently selected node and the node with the given id
    removeInfoLink(from, to, links) {
        const link = links.get(from.id + "-" + to.id)
        if(link){
            link.element.remove();
            links.delete(`${from.id}-${to.id}`);
        }
    }

    getRandomNumber() {
        // Define the possible values
        const values = [0.2, 0.4, 0.6, 0.8];
        // Generate a random index from 0 to 4
        const randomIndex = Math.floor(Math.random() * values.length);
        // Return the value at the random index
        return values[randomIndex];
    }
}
