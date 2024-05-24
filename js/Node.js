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
    addNodeLabel(mousePos, nodeId, label, image, username) {
        let nodeLabel = document.createElement("div");
        nodeLabel.className = "node";
        nodeLabel.style.position = "absolute";
        const foundNodeData = this;

        let classList;

        switch (label) {
            case "Person":
                classList = "personNode";
                // console.log(foundNodeData);
                nodeLabel.style.backgroundImage = `url(${image})`;
                break;
            case "Social Media Post":
                classList = "postNode";
                break;
            default:
                break;
        }

        nodeLabel.classList.add(classList);
        nodeLabel.style.width = this.radius * 2 + "px";
        nodeLabel.style.left = mousePos.x + "px";
        nodeLabel.style.top = mousePos.y + "px";

        canvasContainer.appendChild(nodeLabel);

        this.element = nodeLabel;
        return nodeLabel;
    }

    //Function to spawn a node on the canvas given the position of the cursor
    async spawnNode(evt) {
        // console.log(addPersonCheckbox, addSocialMediaPostCheckbox.checked); // Hoe kan ie m vinden
        let label = addPersonCheckbox.checked ? "Person" : addSocialMediaPostCheckbox.checked ? "Social Media Post" : "";

        if (label === "") {
            return;
        }

        let nodeLabelRef;
        let nodeId = nodes.size;
        var mousePos = getMousePosOnCanvas(canvas, evt);
        console.log(label);
        switch (label) {
            case "Person":
                // drawNode(mousePos.x, mousePos.y, label);
                let userData = await fetchUsers(1);
                const image = userData[0].image;
                const username = userData[0].username;

                nodeLabelRef = addNodeLabel(mousePos, nodeId, label, image, username); // Pass node ID to label function

                nodeId = nodes.size;
                addPersonNode(
                    nodeId,
                    label,
                    mousePos.x,
                    mousePos.y,
                    [],
                    [],
                    [],
                    nodeLabelRef,
                    (personRadius = standardPersonRadius),
                    (popularity = 0),
                    (increasedPopularity = 0),
                    image,
                    username
                );
                break;
            case "Social Media Post":
                var mousePos = getMousePosOnCanvas(canvas, evt);
                // drawNode(mousePos.x, mousePos.y, label);
                nodeLabelRef = addNodeLabel(mousePos, nodeId, label); // Pass node ID to label function
                nodeId = nodes.size;
                addItemNode(nodeId, label, mousePos.x, mousePos.y, [], nodeLabelRef);
                break;
            default:
                break;
        }
    }

    //Function for handling link actions
    linkHandler(node, links) {
		console.log("linkhandler");
        if (this.label === "Person") {
            this.friendsHandler(node, links);
        } else if (this.label === "Social Media Post") {
            this.itemHandler(node, links);
        }
    }

    //Function for handling friend actions
    friendsHandler(node, links) {
        console.log("friends handler");
        console.log(this.friends, node.id);
        if (this.friends.get(node.id)) {
            console.log("REMOVE");
            this.removeFriend(node, links);
        } else {
            console.log(links);
            this.addFriend(node, links);
        }
    }

    //Function for handling item actions
    itemHandler(node, links) {
        console.log("items handler");
        console.log(this, node.items);
        if (node.items.get(this.id)) {
            console.log("REMOVE");
            node.removeItemLink(this, node, links);
        } else {
            node.addItemLink(this, node, links);
        }
    }
}