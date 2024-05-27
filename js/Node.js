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
            node.removeItemLink(this, links);
        } else {
            node.addItemLink(this, node, links);
        }
    }

    // setEventListeners(hoveredNode, selectedNode, links, nodes) {
    //     this.element.addEventListener("mouseover", function () {
    //         hoveredNode = this.id;
    //         // console.log("Data:", nodes.get(this.id));
    //         if (this.label === "Person") {
    //             this.showNodeDataContainer();
    //         }
    //     });

    //     this.element.addEventListener("mouseout", function () {
    //         hoveredNode = null;
    //         nodeDataContainer.style.display = "none";
    //     });

    //     this.element.addEventListener("click", function () {
    //         //Check whether the node is a person node or a social media post node
    //         switch (selectedNode) {
    //             case null:
    //                 this.selectNode();
    //                 this.showSelectedNodeOptions();
    //                 generalOptions.classList.add("hide");
    //                 break;
    //             case this:
    //                 this.deselectNode(selectedNode, this.id);
    //                 selectedNodeOptions.classList.add("hide");
    //                 generalOptions.classList.remove("hide");
    //                 break;
    //             default:
    //                 const type = this.label === "Person" ? "friend" : "item";
    //                 this.linkHandler(this, links);
    //                 resizeNodes(nodes);
    //         }
    //     });

    //     nodeCanvas.addEventListener("click", () => {
    //         if (selectedNode === this.id) {
    //             this.deselectNode();
    //             selectedNodeOptions.classList.add("hide");
    //             generalOptions.classList.remove("hide");
    //         }
    //     });
    // }

    // showNodeDataContainer() {
    //     nodeDataContainer.children[0].innerHTML = "NodeId:" + this.id;
    //     nodeDataContainer.style.display = "grid";
    //     //Move the nodeDataContainer to the position of the node label
    //     nodeDataContainer.style.left = this.x + 10 + "px";
    //     nodeDataContainer.style.top = this.y + 10 + "px";
    // }

    // //Function for selecting a node and highlight it and its data
    // selectNode() {
    //     this.element.classList.add("selected");

    //     if (this.label === "Person") {
    //         this.showPreLink();
    //     }

    //     selectedNode = selectedNodeId;
    //     if (nodes.get(this.id).label === "Person") {
    //         this.spawnForwardButtons(links);
    //     }
    // }

    // //Function for deselecting a node and remove the highlight
    // deselectNode(selectedNode) {
    //     console.log("DESELECT");

    //     this.element.classList.remove("selected");

    //     // Assuming that mouseMoveHandler is now a named function
    //     canvasContainer.removeEventListener("mousemove", mouseMoveHandler);
    //     canvasContainer.removeEventListener("scroll", scrollMoveHandler);
    //     if (linkStripe) {
    //         linkStripe.remove();
    //     }

    //     selectedNodeOptions.classList.add("hide");
    //     // let selectedNodeData = nodes.get(selectedNode);
    //     // const div = document.querySelector("#selectedNodeOptions > div");
    //     // selectedNodeData.increasedPopularity = div.querySelector("label input").value;

    //     selectedNode = null;
    //     this.removeForwardButtons();
    //     //redrawCanvas(); // Redraws the links
    // }

    // showPreLink() {
    //     linkStripe = document.createElement("div");
    //     linkStripe.classList.add("followLink", "linkStripe");
    //     let to;
    //     let currentScrollY = 0;
    //     let currentScrollX = 0;
    //     mouseMoveHandler = (e) => {
    //         let canvasRect = canvasContainer.getBoundingClientRect();

    //         to = {
    //             x: e.clientX - canvasRect.left + canvasContainer.scrollLeft,
    //             y: e.clientY - canvasRect.top + canvasContainer.scrollTop,
    //         };

    //         let Ydifference = this.y - to.y;
    //         let Xdifference = this.x - to.x;

    //         let linkLength = Math.sqrt(Math.pow(Ydifference, 2) + Math.pow(Xdifference, 2));
    //         let linkAngle = Math.atan2(Ydifference, Xdifference) + Math.PI;

    //         linkStripe.style.width = linkLength + "px";
    //         linkStripe.style.transform = "translateY(-50%) rotate(" + linkAngle + "rad)";
    //         linkStripe.style.left = this.x + "px";
    //         linkStripe.style.top = this.y + "px";
    //         // console.log("From: x:", from.x, "y:", from.y, "To x:", to.x, "y:", to.y, linkStripe);
    //     };

    //     scrollMoveHandler = () => {
    //         if (currentScrollY < canvasContainer.scrollTop) {
    //             console.log("to bottom");
    //         } else if (currentScrollY > canvasContainer.scrollTop) {
    //             console.log("to top");
    //         } else if (currentScrollX > canvasContainer.scrollLeft) {
    //             console.log("to right");
    //         } else if (currentScrollX < canvasContainer.scrollLeft) {
    //             console.log("to left");
    //         }
    //         let Ydifference = this.y - (to.y + canvasContainer.scrollTop);
    //         let Xdifference = this.x - (to.x + canvasContainer.scrollLeft);

    //         let linkLength = Math.sqrt(Math.pow(Ydifference, 2) + Math.pow(Xdifference, 2));
    //         let linkAngle = Math.atan2(Ydifference, Xdifference) + Math.PI;

    //         linkStripe.style.width = linkLength + "px";
    //         linkStripe.style.transform = "translateY(-50%) rotate(" + linkAngle + "rad)";
    //         linkStripe.style.left = this.x + "px";
    //         linkStripe.style.top = this.y + "px";
    //     };
    //     canvasContainer.addEventListener("mousemove", mouseMoveHandler);
    //     canvasContainer.addEventListener("scroll", scrollMoveHandler);

    //     linkStripe.addEventListener("click", () => {
    //         console.log("CLICK");
    //         canvasContainer.removeEventListener("mousemove", mouseMoveHandler);
    //         linkStripe.remove();
    //         this.deselectNode();
    //     });

    //     canvasContainer.appendChild(linkStripe);
    // }
}