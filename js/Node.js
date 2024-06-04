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
                if (this.image) {
                    nodeElement.style.backgroundImage = `url(${this.image})`;
                }
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