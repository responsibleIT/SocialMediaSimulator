import Node from "./Node.js";

export default class Person extends Node {
    constructor(id, label, x, y, z, user) {
        super(id, label, x, y, z, 10);
        this.friends = new Map(); // Contains { friend: score } pairs
        this.items = new Map(); // Contains { item: score } pairs
        this.infoLinks = new Map(); // Contains { infoLink: score } pairs
        this.socialScore = this.getRandomNumber(); // Decides how social the agent is
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

        const socialMediaPosts = Array.from(nodes.values()).filter(
            (node) => node.label === "Social Media Post"
        );
        const randomPost =
            socialMediaPosts[Math.floor(Math.random() * socialMediaPosts.length)];

        if (!this.items.has(randomPost.id)) {
            if (this.friends.size > 0) {
                const friendsThatReadPost = Array.from(randomPost.readers.keys()).filter(
                    (reader) => this.friends.has(reader)
                );
                if (friendsThatReadPost.length > 0) {
                    friendScores = friendsThatReadPost.map((friend) =>
                        randomPost.readers.get(friend).score
                    );
                }
            }

            if (this.infoLinks.size > 0) {
                const infoLinksThatReadPost = Array.from(randomPost.readers.keys()).filter(
                    (reader) => this.infoLinks.has(reader)
                );
                if (infoLinksThatReadPost.length > 0) {
                    infoLinkScores = infoLinksThatReadPost.map((infoLink) =>
                        randomPost.readers.get(infoLink).score
                    );
                }
            }

            if (friendScores.length > 0 || infoLinkScores.length > 0) {
                myScore =
                    (friendScores.reduce((a, b) => a + b, 0) +
                        infoLinkScores.reduce((a, b) => a + b, 0)) /
                    (friendScores.length + infoLinkScores.length);
            }

            myScore = this.calculateScore(myScore, randomPost);

            this.items.set(randomPost.id, { post: randomPost, score: myScore });
            randomPost.readers.set(this.id, { id: this.id, score: myScore });

            links.set(`${this.id}-${randomPost.id}`, {
                fromId: this.id,
                toId: randomPost.id,
                type: "item-link",
                score: myScore,
            });
        }
    }

    calculateScore(myScore, post) {
        const dx = post.x - this.x;
        const dy = post.y - this.y;
        const dz = post.z - this.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        myScore = myScore - distance / this.acceptanceDisctance;
        return myScore > 0 ? 1 : myScore < 0 ? -1 : 0;
    }

    addFriend(node, links, score = this.defaultRelationshipScore) {
        // Check if the friend relationship already exists
        if (this.friends.has(node.id)) {
            return; // Friend already exists, no need to add
        }
    
        // Add the friend to this person's friends map
        this.friends.set(node.id, { score });
    
        // Add this person to the friend's friends map
        node.friends.set(this.id, { score });
    
        // Add the relationship to the links map (no Edge instance)
        links.set(`${this.id}-${node.id}`, {
            fromId: this.id,
            toId: node.id,
            type: "friend-link",
            score,
        });
    }

    removeFriend(node, links) {
        if (this.friends.has(node.id)) {
            // Remove the friend from the current person's friends map
            this.friends.delete(node.id);
    
            // Remove the current person from the friend's friends map
            if (node.friends) {
                node.friends.delete(this.id);
            }
    
            // Remove the friend-link from the links map
            links.delete(`${this.id}-${node.id}`);
            links.delete(`${node.id}-${this.id}`);
    
            console.log(`Friend removed: ${node.id}`);
        }
    }
    
    // Function for adding a friend through content
    addFriendThroughContent(links, nodes) {
        // Get an array of all posts I have read and liked
        const positivePosts = Array.from(this.items.values()).filter((post) => {
            return post.score > 0;
        });
    
        positivePosts.forEach((post) => {
            if (Math.random() < this.socialScore) {
                const postNode = post.post;
    
                if (postNode.readers && postNode.readers.values) {
                    const peopleThatReadPost = Array.from(postNode.readers.values()).filter((reader) => {
                        const personId = reader.id;
                        return (
                            reader.score > 0 &&
                            personId !== this.id &&
                            !this.friends.has(personId)
                        );
                    });
    
                    if (peopleThatReadPost.length > 0) {
                        const randomReader = peopleThatReadPost[Math.floor(Math.random() * peopleThatReadPost.length)];
                        const randomPerson = nodes.get(randomReader.id);
                        if (randomPerson) {
                            this.addFriend(randomPerson, links);
                        }
                    }
                }
            }
        });
    }

    manageRelationships(links, nodes) {
        this.friends.forEach((friend, friendId) => {
            if (friend.score <= this.removeFriendLinkThreshold) {
                const friendNode = nodes.get(friendId);
                if (friendNode) {
                    this.removeFriend(friendNode, links);
                }
            }

            if (friend.score >= this.addInfoLinkThreshold) {
                const friendNode = nodes.get(friendId);
                if (friendNode && !this.infoLinks.has(friendId)) {
                    this.addInfoLink(this, friendNode, links, friend.score);
                }
            }
        });

        this.infoLinks.forEach((infoLink, infoLinkId) => {
            if (infoLink.score <= this.removeInfoLinkThreshold) {
                const infoNode = nodes.get(infoLinkId);
                if (infoNode) {
                    this.removeInfoLink(this, infoNode, links);
                }
            }
        });
    }

    // Function for moving the node
    moveNode(nodes) {
        // Get all friends and infoLinks with a positive score
        const positiveFriends = Array.from(this.friends.values()).filter(
            (friend) => friend.score > 0
        );
        const positiveInfoLinks = Array.from(this.infoLinks.values()).filter(
            (infoLink) => infoLink.score > 0
        );
        const positiveItems = Array.from(this.items.values()).filter(
            (item) => item.score > 0
        );
        console.log(`Before move: (${this.x}, ${this.y}, ${this.z})`);
        // console.log("Friends:", this.friends);
        // console.log("InfoLinks:", this.infoLinks);
        // console.log("Items:", this.items);

        // Calculate the average position of all friends, infoLinks, and items
        let averageX = this.x;
        let averageY = this.y;
        let averageZ = this.z;
    
        positiveFriends.forEach((friend) => {
            const friendNode = nodes.get(friend.id);
            if (!friendNode) {
                console.warn(`Friend node not found for ID: ${this.id}`);
            }
            if (friendNode) {
                averageX += friendNode.x;
                averageY += friendNode.y;
                averageZ += friendNode.z;
            }
        });
    
        positiveInfoLinks.forEach((infoLink) => {
            const infoNode = nodes.get(infoLink.id);
            if (!infoNode) {
                console.warn(`InfoLink node not found for ID: ${this.id}`);
            }
            if (infoNode) {
                averageX += infoNode.x;
                averageY += infoNode.y;
                averageZ += infoNode.z;
            }
        });
    
        positiveItems.forEach((item) => {
            const itemNode = item.post;
            if (!itemNode) {
                console.warn(`Item node not found for post ID: ${item.post?.id}`);
            }
            if (itemNode) {
                averageX += itemNode.x;
                averageY += itemNode.y;
                averageZ += itemNode.z;
            }
        });
    
        averageX = averageX / (positiveFriends.length + positiveInfoLinks.length + positiveItems.length + 1);
        averageY = averageY / (positiveFriends.length + positiveInfoLinks.length + positiveItems.length + 1);
        averageZ = averageZ / (positiveFriends.length + positiveInfoLinks.length + positiveItems.length + 1);

        console.log(`Moving towards: (${averageX}, ${averageY}, ${averageZ})`);
    
        // Move the agent towards the average position
        const dx = averageX - this.x;
        const dy = averageY - this.y;
        const dz = averageZ - this.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
        if (distance > 0) {
            this.x += (dx / distance) * this.stepDistance;
            this.y += (dy / distance) * this.stepDistance;
            this.z += (dz / distance) * this.stepDistance;
    
            // Update visual representation
            if (typeof document !== "undefined" && this.element) {
                this.element.style.left = `${this.x}px`;
                this.element.style.top = `${this.y}px`;
            }
            console.log(`After move: (${this.x}, ${this.y}, ${this.z})`);
        }
    }    

    step(nodes, links) {
        this.readSocialMediaPost(nodes, links);
        this.manageRelationships(links, nodes);
        this.addFriendThroughContent(links, nodes);
        this.moveNode(nodes);
    }

    getRandomNumber() {
        const values = [0.2, 0.4, 0.6, 0.8];
        const randomIndex = Math.floor(Math.random() * values.length);
        return values[randomIndex];
    }
}
