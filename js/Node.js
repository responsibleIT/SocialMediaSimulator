export default class Node {
    constructor(id, label, x, y, radius) {
        this.id = id;
        this.label = label;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.element = null;
        this.popularity = 0;
        this.increasedPopularity = 0;
    }

    //Function for moving the agent to a new position
    moveNode() {
        //Get all friends and infolinks with a score higher than 0
        const positiveFriends = Array.from(this.friends.keys()).filter((friend) => this.friends.get(friend) > 0);
        const positiveInfoLinks = Array.from(this.infoLinks.keys()).filter((infoLink) => this.infoLinks.get(infoLink) > 0);

        //Get all items with a score higher than 0
        const positiveItems = Array.from(this.items.keys()).filter((item) => this.items.get(item) > 0);

        //Calculate the average position of all friends, infolinks and items
        let averageX = this.x;
        let averageY = this.y;
        positiveFriends.forEach((friend) => {
            averageX += friend.x;
            averageY += friend.y;
        });
        positiveInfoLinks.forEach((infoLink) => {
            averageX += infoLink.x;
            averageY += infoLink.y;
        });
        positiveItems.forEach((item) => {
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
            this.x += dx / distance;
            this.y += dy / distance;
        }
    }

    // Function to add a label to the node in the body of the page absolutely positioned on the exact position of the node on the screen
    // Add node label was the div above the drawn node
    draw() {
        const nodeElement = document.createElement("div");
        nodeElement.className = "node";   

        switch (this.label) {
            case "Person":
                nodeElement.classList.add("personNode");

                if (this.profileImage) {
                    nodeElement.style.backgroundImage = `url(${this.profileImage})`;
                }

                break;
            case "Social Media Post":
                nodeElement.classList.add("postNode");
                break;
            default:
                break;
        }

        nodeElement.style.width = this.radius * 2 + "px";
        nodeElement.style.left = this.x + "px";
        nodeElement.style.top = this.y + "px";

        canvasContainer.appendChild(nodeElement);

        this.element = nodeElement;
        return nodeElement;
    }

    //Function for handling link actions
    linkHandler(node, links) {
        if (this.label === "Person") {
            this.friendsHandler(node, links);
        } else if (this.label === "Social Media Post") {
            this.itemHandler(node, links);
        }
    }

    //Function for handling friend actions
    friendsHandler(node, links) {
        if (this.friends.get(node.id)) {
            this.removeFriend(node, links);
        } else {
            this.addFriend(node, links);
        }
    }

    //Function for handling item actions
    itemHandler(node, links) {
        if (node.items.get(this.id)) {
            node.removeItemLink(this, links);
            node.removeForwardButtons();
            node.spawnForwardButtons(links);
        } else {
            node.addItemLink(this, node, links);
            node.spawnForwardButtons(links);
        }
    }
}