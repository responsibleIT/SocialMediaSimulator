// Function to add a label to the node in the body of the page absolutely positioned on the exact position of the node on the screen
// Add node label was the div above the drawn node
function addNodeLabel(mousePos, nodeId, label, image, username) {
    let nodeLabel = document.createElement("div");
    nodeLabel.className = "node";
    nodeLabel.style.position = "absolute";
    const foundNodeData = nodes.get(nodeId);

    let radius, classList;

    switch (label) {
        case "Person":
            radius = standardPersonRadius; // TODO when redrawing, get the current radius
            classList = "personNode";
            // console.log(foundNodeData);
            nodeLabel.style.backgroundImage = `url(${image})`;
            break;
        case "Social Media Post":
            radius = standardPostRadius; // TODO when redrawing, get the current radius
            classList = "postNode";
            break;
        default:
            break;
    }

    nodeLabel.classList.add(classList);
    nodeLabel.style.width = radius * 2 + "px";
    nodeLabel.style.left = mousePos.x + "px";
    nodeLabel.style.top = mousePos.y + "px";

    canvasContainer.appendChild(nodeLabel);

    // Link node ID to nodeLabel in the map
    nodeLabelMap.set(nodeId, nodeLabel);

    nodeLabel.addEventListener("mouseover", function () {
        hoveredNode = nodeId;
        console.log("Data:", nodes.get(nodeId));
        if (nodes.get(nodeId).label === "Person") {
            showNodeDataContainer(nodeId, nodes.get(nodeId));
        }
    });

    nodeLabel.addEventListener("mouseout", function () {
        hoveredNode = null;
        nodeDataContainer.style.display = "none";
    });

    nodeLabel.addEventListener("click", function () {
        console.log("Clicked on node label");
        //Check whether the node is a person node or a social media post node
        switch (selectedNode) {
            case null:
                selectNode(nodeId);
                showSelectedNodeOptions();
                generalOptions.classList.add("hide");
                break;
            case nodeId:
                deselectNode(nodeId);
                selectedNodeOptions.classList.add("hide");
                generalOptions.classList.remove("hide");
                break;
            default:
                let type = nodes.get(hoveredNode).label === "Person" ? "friend" : "item";
                linkHandler(nodeId, type);
        }
    });
    canvas.addEventListener("click", () => {
        if (selectedNode === nodeId) {
            deselectNode(nodeId);
            selectedNodeOptions.classList.add("hide");
            generalOptions.classList.remove("hide");
        }
    });

    return nodeLabel;
}

function resizeNodes(nodes) {
    nodes.forEach((node, id) => {
        if (node.label === "Person") {
            node.popularity = calculatePersonPopularity(node.friends?.length || 0, checkInfoLinkRefs(id).length || 0);
        } else if (node.label === "Social Media Post") {
            node.popularity = calculatePostPopularity(node.readers?.length || 0);
        }
        node.nodeLabelRef.style.width = (node.radius + node.popularity + Number(node.increasedPopularity)) * 2 + "px";
    });
}

//Function to spawn a node on the canvas given the position of the cursor
async function spawnNode(evt) {
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

//Function for adding person node to the global map of nodes
//Each node object has the following properties:
//id: unique identifier
//label: label of the node
//x: x-coordinate of the node
//y: y-coordinate of the node
//friends: list of node ids that are friends with this node
//items: list of item ids that this node has liked
//nodeLabelRef: reference to the node label div element
function addPersonNode(
    id,
    label,
    x,
    y,
    friends,
    items,
    infolinks,
    nodeLabelRef,
    personRadius = standardPersonRadius,
    popularity = 0,
    increasedPopularity = 0,
    image,
    username
) {
    nodes.set(id, {
        label: label,
        x: x,
        y: y,
        friends: friends,
        items: items,
        infolinks: infolinks,
        nodeLabelRef: nodeLabelRef,
        radius: personRadius,
        popularity: popularity,
        increasedPopularity: increasedPopularity,
        opacity: 1, // Default opacity is 1 (fully opaque)
        image: image,
        username: username,
    });
}

//Function for adding item node to the global map of nodes
//Each node object has the following properties:
//id: unique identifier
//label: label of the node
//x: x-coordinate of the node
//y: y-coordinate of the node
//readers: list of node ids that are friends with this node
//nodeLabelRef: reference to the node label div element
function addItemNode(id, label, x, y, readers, nodeLabelRef, postRadius = standardPostRadius, popularity = 0, increasedPopularity = 0) {
    nodes.set(id, {
        label: label,
        x: x,
        y: y,
        readers: readers,
        nodeLabelRef: nodeLabelRef,
        radius: postRadius,
        popularity: popularity,
        increasedPopularity: increasedPopularity,
        opacity: 1, // Default opacity is 1 (fully opaque)
    });
}

// Add random node based on the given label
function drawRandom(label, count, userData) {
    if (count === null && userData === null) {
        for (var i = 0; i < 10; i++) {
            var x = Math.random() * canvasSize.width;
            var y = Math.random() * canvasSize.height;
            let nodeLabelRef = addNodeLabel({ x, y }, nodes.size, label);

            addItemNode(nodes.size, label, x, y, [], nodeLabelRef);
        }
    } else {
        for (var i = 0; i < count; i++) {
            var x = Math.random() * canvasSize.width;
            var y = Math.random() * canvasSize.height;
            const image = userData[i].image;
            const username = userData[i].username;
            let nodeLabelRef = addNodeLabel({ x, y }, nodes.size, label, image, username);

            if (label === "Person") {
                addPersonNode(
                    nodes.size,
                    label,
                    x,
                    y,
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
            } else if (label === "Social Media Post") {
                addItemNode(nodes.size, label, x, y, [], nodeLabelRef);
            }
        }
    }
}

//Function to get the position of the cursor on the canvas
// This is needed to place the nodes based on where you click
function getMousePosOnCanvas(canvas, evt) {
    var rect = canvas.getBoundingClientRect(), // abs. size of element
        scaleX = canvas.width / rect.width, // relationship bitmap vs. element for x
        scaleY = canvas.height / rect.height; // relationship bitmap vs. element for y

    return {
        x: (evt.clientX - rect.left) * scaleX, // scale mouse coordinates after they have
        y: (evt.clientY - rect.top) * scaleY, // been adjusted to be relative to element
    };
}

//Showdata function to display the nodeDataContainer with therein the node data when hovering over it

function showNodeDataContainer(nodeId, noteData) {
    nodeDataContainer.children[0].innerHTML = "NodeId:" + nodeId;

    nodeDataContainer.style.display = "grid";
    //Move the nodeDataContainer to the position of the node label
    nodeDataContainer.style.left = noteData.x + 10 + "px";
    nodeDataContainer.style.top = noteData.y + 10 + "px";
}

//Function for showing the selectedNodeOptions container with the right data when a node is selected
// TODO can be written differently
function showSelectedNodeOptions() {
    let selectedNodeData = nodes.get(selectedNode);
    const div = document.querySelector("#selectedNodeOptions > div");
    const image = document.getElementById("selectedNodeImage");

    image.src = selectedNodeData.image;
    div.querySelector("p:nth-of-type(1) span").innerHTML = selectedNodeData.label;
    div.querySelector("p:nth-of-type(2) span").innerHTML = selectedNodeData.username;

    div.querySelector("p:nth-of-type(3) span").innerHTML = "No friends";
    div.querySelector("p:nth-of-type(4) span").innerHTML = Number(selectedNodeData.popularity) + Number(selectedNodeData.increasedPopularity);
    div.querySelector("label input").value = selectedNodeData.increasedPopularity;

    selectedNodeOptions.classList.remove("hide");
}
