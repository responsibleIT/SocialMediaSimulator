//Function for redrawing the canvas
// function redrawCanvas() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

//     links.forEach((link) => {
//         let from = nodes.get(link.from);
//         let to = nodes.get(link.to);
//         drawLink(from, to, link.type, link.thickness); // Redraw each link
//     });
// }
//Function for checking who has an info link with a given node
function checkInfoLinkRefs(nodeId) {
    let refs = [];
    //Get all person nodes
    let personNodes = new Map([...nodes].filter(([id, node]) => node.label === "Person"));
    //Loop over all nodes in the map and check if the given node has an info link with them
    personNodes.forEach((node, id) => {
        if (node.infolinks.includes(nodeId)) {
            refs.push(id);
        }
    });
    return refs;
}

//Function for drawing a link between two nodes
function drawLink(from, to, type) {
    console.log("type", type);
    let linkStripe = document.createElement("div");
    linkStripe.className = "linkStripe";
    linkStripe.style.position = "absolute";
    linkStripe.style.height = "1px";

    let Ydifference = from.y - to.y;
    let Xdifference = from.x - to.x;

    let linkLength = Math.sqrt(Math.pow(Ydifference, 2) + Math.pow(Xdifference, 2));
    let linkAngle = Math.atan2(Ydifference, Xdifference) + Math.PI;

    console.log(linkAngle);

    linkStripe.style.width = linkLength + "px";
    linkStripe.style.transform = "translateY(-50%) rotate(" + linkAngle + "rad)";

    linkStripe.style.left = from.x + "px";
    linkStripe.style.top = from.y + "px";

    if (type === "itemlink") {
        linkStripe.classList.add("link-item");
    } else if (type === "friend") {
        linkStripe.classList.add("link-friend");
    } else if (type === "infolink") {
        linkStripe.classList.add("link-info");
    }

    canvasContainer.appendChild(linkStripe);

    return linkStripe;
}

//Function for adding an info link between the currently selected node and the node with the given id
function addInfoLink(from, to) {
    let fromData = nodes.get(from);
    let toData = nodes.get(to);

    fromData.infolinks.push(to);

    const linkElement = drawLink(fromData, toData, "infolink", 4);
    addLink(from, to, "infolink", linkElement);

    resizeNodes(nodes);
}

//Function for removing an info link between the currently selected node and the node with the given id
function removeInfoLink(from, to) {
    links.get(from + "-" + to).linkElement.remove();
    links.delete(`${from}-${to}`);
    resizeNodes(nodes);
    // redrawCanvas();
}

//Function for adding a friend link between the currently selected node and the node with the given id
function addFriend(from, to) {
    let currentlySelected = nodes.get(from);
    let toBeFriend = nodes.get(to);

    currentlySelected.friends.push(to);
    toBeFriend.friends.push(from);

    const linkElement = drawLink(currentlySelected, toBeFriend, "friend", 4);
    addLink(from, to, "friend", linkElement);
    resizeNodes(nodes);
}

//Function for adding an item link between the currently selected node and the node with the given id
function addItemLink(person, item) {
    let currentlySelectedPerson = nodes.get(person);
    let currentEyedItem = nodes.get(item);

    currentlySelectedPerson.items.push(item);
    currentEyedItem.readers.push(person);

    const linkElement = drawLink(currentlySelectedPerson, currentEyedItem, "itemlink", 4);
    addLink(person, item, "itemlink", linkElement);

    resizeNodes(nodes);
}

//Function for removing an item link between the currently selected node and the node with the given id
function removeItemLink(personId, itemId) {
    let personIdData = nodes.get(personId);
    let itemIdData = nodes.get(itemId);

    personIdData.items = personIdData.items.filter((id) => id !== itemId);
    itemIdData.readers = itemIdData.readers.filter((id) => id !== personId);

    links.get(personId + "-" + itemId).linkElement.remove();
    links.delete(personId + "-" + itemId);
    resizeNodes(nodes);
    //redrawCanvas(); // Redraws the links
}

//Function for removing a friend link between the currently selected node and the node with the given id
function removeFriend(personId, friendId) {
    let personIdData = nodes.get(personId);
    let friendIdData = nodes.get(friendId);

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

//Function for handling link actions
function linkHandler(id, type) {
    if (type === "friend") {
        friendsHandler(id);
    } else if (type === "item") {
        itemHandler(id);
    }
}

//Function for handling friend actions
function friendsHandler(id) {
    if (nodes.get(selectedNode).friends.includes(id)) {
        removeFriend(selectedNode, id);
    } else {
        addFriend(selectedNode, id);
    }
}

//Function for handling item actions
function itemHandler(id) {
    if (nodes.get(selectedNode).items.includes(id)) {
        removeItemLink(selectedNode, id);
    } else {
        addItemLink(selectedNode, id);
    }
}

//Function for adding link to the global map of links
//Each link object has the following properties:
//from: id of the node where the link originates
//to: id of the node where the link ends
//type: type of the link (friend, itemlink, infolink)
function addLink(from, to, type, linkElement) {
    links.set(from + "-" + to, {
        from: from,
        to: to,
        type: type,
        linkElement: linkElement
    });
}

//Function for selecting a node and highlight it and its data
function selectNode(selectedNodeId) {
    nodes.forEach((node, id) => {
        if (selectedNodeId !== id) {
            // node.nodeLabelRef.style.opacity = 0.5;
            node.nodeLabelRef.classList.add("noFocus");
        } else {
            node.nodeLabelRef.classList.add("focus");
        }
    });
    const node = nodes.get(selectedNodeId);
    if (node.label === "Person") {
        showPreLink(node);
    }

    // //Increase the thickness of the links of the selected node
    // links.forEach((link) => {
    //     if (link.from === selectedNodeId || link.to === selectedNodeId) {
    //         link.thickness = 4;
    //     }
    // });
    selectedNode = selectedNodeId;
    if (nodes.get(selectedNodeId).label === "Person") {
        spawnForwardButtons();
    }
    //redrawCanvas(); // Redraws the links
}
let linkStripe;
let mouseMoveHandler;
let scrollMoveHandler;

function showPreLink(from) {
    linkStripe = document.createElement("div");
    linkStripe.classList.add("followLink", "linkStripe");
    let to;
    let currentScrollY = 0;
    let currentScrollX = 0;
    mouseMoveHandler = (e) => {
        let canvasRect = canvasContainer.getBoundingClientRect();

        to = {
            x: e.clientX - canvasRect.left + canvasContainer.scrollLeft,
            y: e.clientY - canvasRect.top + canvasContainer.scrollTop,
        };

        let Ydifference = from.y - to.y;
        let Xdifference = from.x - to.x;

        let linkLength = Math.sqrt(Math.pow(Ydifference, 2) + Math.pow(Xdifference, 2));
        let linkAngle = Math.atan2(Ydifference, Xdifference) + Math.PI;

        linkStripe.style.width = linkLength + "px";
        linkStripe.style.transform = "translateY(-50%) rotate(" + linkAngle + "rad)";
        linkStripe.style.left = from.x + "px";
        linkStripe.style.top = from.y + "px";
        // console.log("From: x:", from.x, "y:", from.y, "To x:", to.x, "y:", to.y, linkStripe);
    };

    scrollMoveHandler = () => {
        if (currentScrollY < canvasContainer.scrollTop) {
            console.log("to bottom");
        } else if (currentScrollY > canvasContainer.scrollTop) {
            console.log("to top");
        } else if (currentScrollX > canvasContainer.scrollLeft) {
            console.log("to right");
        } else if (currentScrollX < canvasContainer.scrollLeft) {
            console.log("to left");
        }
        let Ydifference = from.y - (to.y + canvasContainer.scrollTop);
        let Xdifference = from.x - (to.x + canvasContainer.scrollLeft);

        let linkLength = Math.sqrt(Math.pow(Ydifference, 2) + Math.pow(Xdifference, 2));
        let linkAngle = Math.atan2(Ydifference, Xdifference) + Math.PI;

        linkStripe.style.width = linkLength + "px";
        linkStripe.style.transform = "translateY(-50%) rotate(" + linkAngle + "rad)";
        linkStripe.style.left = from.x + "px";
        linkStripe.style.top = from.y + "px";

        // let Ydifference = 0;
        // let Xdifference = 0;
        // if (currentScrollY < canvasContainer.scrollTop) {
        //     console.log("to bottom");
        //     Ydifference = from.y - (to.y + canvasContainer.scrollTop);
        // } else if (currentScrollY > canvasContainer.scrollTop) {
        //     console.log("to top");
        //     Ydifference = from.y - (to.y - canvasContainer.scrollTop);
        // } else if (currentScrollX > canvasContainer.scrollLeft) {
        //     console.log("to left");
        //     Xdifference = from.x - (to.x - canvasContainer.scrollLeft);
        // } else if (currentScrollX < canvasContainer.scrollLeft) {
        //     console.log("to right");
        //     Xdifference = from.x - (to.x + canvasContainer.scrollLeft);
        // }
        // console.log(Ydifference, Xdifference);
        // currentScrollY = canvasContainer.scrollTop;
        // currentScrollX = canvasContainer.scrollLeft;
    };
    canvasContainer.addEventListener("mousemove", mouseMoveHandler);
    canvasContainer.addEventListener("scroll", scrollMoveHandler);

    linkStripe.addEventListener("click", () => {
        canvasContainer.removeEventListener("mousemove", mouseMoveHandler);
        linkStripe.remove();
        deselectNode();
    });

    canvasContainer.appendChild(linkStripe);
}

//Function for deselecting a node and remove the highlight
function deselectNode() {
    nodes.forEach((node, id) => {
        if (selectedNode !== id) {
            node.nodeLabelRef.classList.remove("noFocus");
        } else {
            node.nodeLabelRef.classList.remove("focus");
        }
    });

    // Assuming that mouseMoveHandler is now a named function
    canvasContainer.removeEventListener("mousemove", mouseMoveHandler);
    canvasContainer.removeEventListener("scroll", scrollMoveHandler);
    if (linkStripe) {
        linkStripe.remove();
    }

    selectedNodeOptions.classList.add("hide");
    // let selectedNodeData = nodes.get(selectedNode);
    // const div = document.querySelector("#selectedNodeOptions > div");
    // selectedNodeData.increasedPopularity = div.querySelector("label input").value;

    selectedNode = null;
    removeForwardButtons();
    //redrawCanvas(); // Redraws the links
}

//Function that spawns 'forward' buttons under each read social media post by the currently selected person node
function spawnForwardButtons() {
    let selectedNodeData = nodes.get(selectedNode);
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
function removeForwardButtons() {
    let forwardButtons = document.querySelectorAll(".forwardButton");
    forwardButtons.forEach((button) => {
        button.remove();
    });
}