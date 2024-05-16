//Function for redrawing the canvas
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    links.forEach((link) => {
        let from = nodes.get(link.from);
        let to = nodes.get(link.to);
        drawLink(from, to, link.type, link.thickness); // Redraw each link
    });
}
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
function drawLink(from, to, type, thickness) {
    console.log("type", type);
    let linkStripe = document.createElement("div");
    linkStripe.style.position = "absolute";
    linkStripe.style.left = 5 + "px";
    linkStripe.style.top = 5 + "px";
    linkStripe.style.width = "30px";
    linkStripe.style.height = "5px";

    if (type === "itemlink") {
        linkStripe.style.backgroundColor = "green";
    } else if (type === "friend") {
        linkStripe.style.backgroundColor = "black";
    }

    canvasContainer.appendChild(linkStripe);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = linkColors[type];
    ctx.lineWidth = thickness;
    ctx.stroke();
}

//Function for adding an info link between the currently selected node and the node with the given id
function addInfoLink(from, to) {
    let fromData = nodes.get(from);
    let toData = nodes.get(to);

    fromData.infolinks.push(to);

    addLink(from, to, "infolink");
    drawLink(fromData, toData, "infolink", 4);
}

//Function for removing an info link between the currently selected node and the node with the given id
function removeInfoLink(from, to) {
    links.delete(from + "-" + to);
    redrawCanvas();
}

//Function for adding a friend link between the currently selected node and the node with the given id
function addFriend(from, to) {
    let currentlySelected = nodes.get(from);
    let toBeFriend = nodes.get(to);

    currentlySelected.friends.push(to);
    toBeFriend.friends.push(from);

    addLink(from, to, "friend");
    drawLink(currentlySelected, toBeFriend, "friend", 4);
}

//Function for adding an item link between the currently selected node and the node with the given id
function addItemLink(person, item) {
    let currentlySelectedPerson = nodes.get(person);
    let currentEyedItem = nodes.get(item);

    currentlySelectedPerson.items.push(item);
    currentEyedItem.readers.push(person);

    addLink(person, item, "itemlink");
    drawLink(currentlySelectedPerson, currentEyedItem, "itemlink", 4);
}

//Function for removing an item link between the currently selected node and the node with the given id
function removeItemLink(personId, itemId) {
    let personIdData = nodes.get(personId);
    let itemIdData = nodes.get(itemId);

    personIdData.items = personIdData.items.filter((itemId) => itemId !== personId);
    itemIdData.readers = itemIdData.readers.filter((readerId) => readerId !== personId);

    links.delete(personId + "-" + itemId);
    redrawCanvas(); // Redraws the links
}

//Function for removing a friend link between the currently selected node and the node with the given id
function removeFriend(personId, friendId) {
    let personIdData = nodes.get(personId);
    let friendIdData = nodes.get(friendId);

    personIdData.friends = personIdData.friends.filter((friendId) => friendId !== friendId);
    friendIdData.friends = friendIdData.friends.filter((friendId) => friendId !== personId);

    links.delete(personId + "-" + friendId);
    redrawCanvas(); // Redraws the links
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

//Function for calculating the shortest paths between all nodes
function bfsShortestPath(graph, startNode) {
    let distances = {};
    let queue = [startNode];
    graph.forEach((_, node) => (distances[node] = Infinity)); // Initialize distances
    distances[startNode] = 0;

    while (queue.length > 0) {
        let currentNode = queue.shift();
        let currentDistance = distances[currentNode];
        let neighbors = graph.get(currentNode).friends; // Assuming 'friends' is the adjacency list
        console.log(neighbors);
        neighbors.forEach((neighbor) => {
            if (distances[neighbor] === Infinity) {
                // Node has not been visited
                queue.push(neighbor);
                distances[neighbor] = currentDistance + 1;
            }
        });
    }
    return distances;
}

//Function for adding link to the global map of links
//Each link object has the following properties:
//from: id of the node where the link originates
//to: id of the node where the link ends
//type: type of the link (friend, itemlink, infolink)
function addLink(from, to, type) {
    links.set(from + "-" + to, {
        from: from,
        to: to,
        type: type,
        thickness: 4,
    });
}

//Function for selecting a node and highlight it and its data
function selectNode(selectedNodeId) {
    nodes.forEach((node, id) => {
        node.opacity = id === selectedNodeId ? 1 : 0.2; // Selected node is fully opaque, others are more transparent
    });

    //Increase the thickness of the links of the selected node
    links.forEach((link) => {
        if (link.from === selectedNodeId || link.to === selectedNodeId) {
            link.thickness = 4;
        }
    });
    selectedNode = selectedNodeId;
    if (nodes.get(selectedNodeId).label === "Person") {
        spawnForwardButtons();
    }
    redrawCanvas(); // Redraws the links
}

//Function for deselecting a node and remove the highlight
function deselectNode() {
    nodes.forEach((node, id) => {
        node.opacity = 1; // Reset opacity of all nodes to fully opaque
    });

    links.forEach((link) => {
        link.thickness = 1;
    });

    let selectedNodeData = nodes.get(selectedNode);
    selectedNodeData.increasedPopularity = selectedNodeOptions.children[5].children[0].value;
    selectedNode = null;
    removeForwardButtons();
    redrawCanvas(); // Redraws the links
}

//Function that spawns 'forward' buttons under each read social media post by the currently selected person node
function spawnForwardButtons() {
    let selectedNodeData = nodes.get(selectedNode);
    //Get the node ids of every social media post that the selected person node has read
    selectedNodeData.items.forEach((itemId) => {
        let itemNodeData = nodes.get(itemId);
        let forwardButton = document.createElement("button");
        forwardButton.classList.add("forwardButton");
        forwardButton.innerHTML = "Forward";
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
