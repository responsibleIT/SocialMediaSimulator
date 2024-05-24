import Person from './Person.js';
import Post from './Post.js';
import Edge from './Edge.js';
import Cursor from "./cursor.js";
import fetchUsers from './api.js';

const cursor = new Cursor();

// const socket = new WebSocket('ws://localhost:8765');
const canvas = document.getElementById("nodeCanvas");
const canvasContainer = document.getElementById("canvasContainer");
const ctx = canvas.getContext("2d"); // Only used now for the links
let canvasSize = { width: canvas.width, height: canvas.height };

const nodeDataContainer = document.getElementById("nodeDataContainer");
nodeDataContainer.style.display = "none";
const gridRange = { min: -1, max: 1 };
// const addPersonCheckbox = document.getElementById("addPersonCheckbox");
// const addSocialMediaPostCheckbox = document.getElementById("addSocialMediaPostCheckbox");
const selectedNodeOptions = document.getElementById("selectedNodeOptions");
const generalOptions = document.getElementById("generalOptions");
const standardPersonRadius = 10;
const standardPostRadius = 5;

const randomPeopleButton = document.getElementById("addRandomPeopleButton");
const randomContentButton = document.getElementById("addRandomContentButton");
const deleteNodeButton = document.getElementById("deleteNode");
const calcClosenessCentrality = document.getElementById("calcClosenessCentrality");
const increasedPopularityInput = document.getElementById("nodePopularity");
const calcGroupsButton = document.getElementById("calcGroups");

//Global map of nodes
let nodes = new Map();

//Global map of links
let links = new Map();

//Global map of node labels
// let nodeLabelMap = new Map();

//Variable to keep track of which node is selected
let selectedNode = null;

// Variable to keep track of which node is hovered
let hoveredNode = null;

//Node colours in rgba format (blue, red) with 100% opacity
const labelColors = {
    Person: "blue",
    "Social Media Post": "red",
};

// function for counter inputs
const countInputs = document.querySelectorAll(".counter-input");

countInputs.forEach(input => {
    const increaseButton = input.children[2];
    const decreaseButton = input.children[0];
    const countInput = input.children[1];
    let count = Number(countInput.value);
    const minValue = countInput.min ? Number(countInput.min) : false;
    const maxValue = countInput.max ? Number(countInput.max) : false;

    increaseButton.addEventListener("click", () => {
        count = Number(countInput.value);
        if(count < maxValue) {
            countInput.value = count + 1;
        }
    });

    decreaseButton.addEventListener("click", () => {
        count = Number(countInput.value);
        if(count > minValue) {
            countInput.value = count - 1;
        }
    });

});

// api picture and data

randomPeopleButton.addEventListener("click", async () => {
    // drawRandomPersonNodes();
    const count = document.getElementById("people-count").value;

    let userData = await fetchUsers(count);
    console.log(userData);

    drawRandom("Person", count, userData);

    // change image
    // const image = document.getElementById(`image`);
    // image.src = userData.image;
});
randomContentButton.addEventListener("click", () => {
    // drawRandomSocialMediaPostNodes();
    drawRandom("Social Media Post", null, null);
});
deleteNodeButton.addEventListener("click", () => {
    // deleteNode();
});
canvas.addEventListener("click", (event) => {
    //spawnNode(event);
});
calcClosenessCentrality.addEventListener("click", () => {
    calculateAdjustedClosenessCentrality();
});

increasedPopularityInput.addEventListener("change", () => {
    let selectedNodeData = nodes.get(selectedNode);
    selectedNodeData.increasedPopularity = increasedPopularityInput.value;
    resizeNodes(nodes);
});

calcGroupsButton.addEventListener("click", () => {
    findAllConnectedComponents();
});

//Function for calculating social media post popularity based on the number of readers
function calculatePostPopularity(numOfReaders) {
    return numOfReaders * 1.5;
}
//Function for calculating popularity based on the number of friends and info links
function calculatePersonPopularity(numOfFriends, numOfInfoRefs) {
    return numOfInfoRefs > 0 ? numOfFriends * 1.5 + numOfInfoRefs * 2 : numOfFriends * 1.5;
}

// Function to set canvas size to window size
function resizeCanvas() {
    if (canvasSize.width < canvasContainer.clientWidth || canvasSize.height < canvasContainer.height) {
        canvas.width = canvasContainer.clientWidth;
        canvas.height = canvasContainer.clientHeight;
        canvasSize = { width: canvasContainer.clientWidth, height: canvasContainer.clientHeight };
    }
}

// Initial resize to set canvas size
resizeCanvas();

// Add event listener for window resize
window.addEventListener("resize", resizeCanvas);

function findAllConnectedComponents() {
    let visited = new Set();
    let components = [];
    // Filter to include only 'Person' nodes that have at least one friend
    let graph = new Map([...nodes].filter(([id, node]) => node.label === "Person" && node.friends && node.friends.length > 0));

    // Helper function to perform BFS and find all nodes connected to 'startNode'
    function bfs(startNode) {
        let queue = [startNode];
        let component = [];
        visited.add(startNode);
        component.push(startNode);

        while (queue.length > 0) {
            let currentNode = queue.shift();
            let neighbors = graph.get(currentNode).friends || [];

            neighbors.forEach((neighbor) => {
                if (!visited.has(neighbor) && graph.has(neighbor)) {
                    // Ensure neighbor is also a 'Person' with friends
                    visited.add(neighbor);
                    queue.push(neighbor);
                    component.push(neighbor);
                }
            });
        }
        return component;
    }

    // Main loop to initiate BFS from each unvisited node that has friends
    graph.forEach((_, node) => {
        if (!visited.has(node)) {
            let component = bfs(node);
            if (component.length > 1) {
                // Only consider components with more than one node
                components.push(component);
            }
        }
    });

    console.log("Total number of connected components:", components.length);
    console.log("Connected components:", components);
}

function resizeNodes(nodes) {
    console.log("RESIZE NODES", nodes);
    nodes.forEach((node, id) => {
        if (node.label === "Person") {
            node.popularity = calculatePersonPopularity(node.friends?.length || 0, checkInfoLinkRefs(id).length || 0);
            // console.log("PERSON POPU", node.popularity);
        } else if (node.label === "Social Media Post") {
            node.popularity = calculatePostPopularity(node.readers?.length || 0);
        }
        // console.log(node);
        node.element.style.width = (node.radius + node.popularity + Number(node.increasedPopularity)) * 2 + "px";
    });
}

function drawRandom(label, count, userData) {
    if (count === null && userData === null) {
        for (var i = 0; i < 10; i++) {
            var x = Math.random() * canvasSize.width;
            var y = Math.random() * canvasSize.height;
            const id = nodes.size;
            const node = new Post(id, "Social Media Post", x, y);

            node.addNodeLabel({ x, y }, id, label);
            nodes.set(id, node);

            node.element.addEventListener("mouseover", function () {
                hoveredNode = node.id;
                console.log("Data:", nodes.get(node.id));
                if (nodes.get(node.id).label === "Person") {
                    showNodeDataContainer(node.id, nodes.get(node.id));
                }
            });

            node.element.addEventListener("mouseout", function () {
                hoveredNode = null;
                nodeDataContainer.style.display = "none";
            });

            node.element.addEventListener("click", function () {
                //Check whether the node is a person node or a social media post node
                switch (selectedNode) {
                    case null:
                        selectNode(node.id);
                        showSelectedNodeOptions();
                        generalOptions.classList.add("hide");
                        break;
                    case node.id:
                        deselectNode(node.id);
                        selectedNodeOptions.classList.add("hide");
                        generalOptions.classList.remove("hide");
                        break;
                    default:
                        const type = nodes.get(hoveredNode).label === "Person" ? "friend" : "item";
                        const nodeHovered = nodes.get(hoveredNode);
                        const nodeSelected = nodes.get(selectedNode);
                        nodeHovered.linkHandler(nodeSelected, links);
                        console.log("LINK");
                        resizeNodes(nodes);
                }
            });
        }
    } else {
        for (var i = 0; i < count; i++) {
            let node;

            const x = Math.random() * canvasSize.width;
            const y = Math.random() * canvasSize.height;

            const image = userData[i].image;
            const username = userData[i].username;

            const id = nodes.size;

            if (label === "Person") {
                node = new Person(id, "Person", x, y, { image, username });
                nodes.set(nodes.size, node);
            }
            // else if (label === "Social Media Post") {
            //     addItemNode(id, label, x, y, [], nodeLabelRef);
            // }

            node.addNodeLabel({ x, y }, id, label, image, username);

            node.element.addEventListener("mouseover", function () {
                hoveredNode = node.id;
                console.log("Data:", nodes.get(node.id));
                if (nodes.get(node.id).label === "Person") {
                    showNodeDataContainer(node.id, nodes.get(node.id));
                }
            });

            node.element.addEventListener("mouseout", function () {
                hoveredNode = null;
                nodeDataContainer.style.display = "none";
            });

            node.element.addEventListener("click", function () {
                //Check whether the node is a person node or a social media post node
                switch (selectedNode) {
                    case null:
                        selectNode(node.id);
                        showSelectedNodeOptions();
                        generalOptions.classList.add("hide");
                        break;
                    case node.id:
                        deselectNode(node.id);
                        selectedNodeOptions.classList.add("hide");
                        generalOptions.classList.remove("hide");
                        break;
                    default:
                        const type = nodes.get(hoveredNode).label === "Person" ? "friend" : "item";
                        const nodeHovered = nodes.get(hoveredNode);
                        const nodeSelected = nodes.get(selectedNode);
                        nodeHovered.linkHandler(nodeSelected, links);
                        resizeNodes(nodes);
                }
            });
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

//Function for checking who has an info link with a given node
function checkInfoLinkRefs(nodeId) {
    let refs = [];
    //Get all person nodes
    let personNodes = new Map([...nodes].filter(([id, node]) => node.label === "Person"));
    //Loop over all nodes in the map and check if the given node has an info link with them
    personNodes.forEach((node, id) => {
        // console.log(node);
        if (node.infoLinks.get(nodeId)) {
            refs.push(id);
        }
    });
    return refs;
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
    };
    canvasContainer.addEventListener("mousemove", mouseMoveHandler);
    canvasContainer.addEventListener("scroll", scrollMoveHandler);

    linkStripe.addEventListener("click", () => {
        console.log("CLICK");
        canvasContainer.removeEventListener("mousemove", mouseMoveHandler);
        linkStripe.remove();
        deselectNode();
    });

    canvasContainer.appendChild(linkStripe);
}

//Function for selecting a node and highlight it and its data
function selectNode(selectedNodeId) {
    const node = nodes.get(selectedNodeId);

    node.element.classList.add("selected");

    if (node.label === "Person") {
        showPreLink(node);
    }

    selectedNode = selectedNodeId;
    if (nodes.get(selectedNodeId).label === "Person") {
        node.spawnForwardButtons(links);
    }
}

//Function for deselecting a node and remove the highlight
function deselectNode() {
    console.log("DESELECT");
    const node = nodes.get(selectedNode);

    node.element.classList.remove("selected");

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
    node.removeForwardButtons();
    //redrawCanvas(); // Redraws the links
}

//Function for performing all behaviors of the agent in one step
function step(node) {
    node.readSocialMediaPost();
    node.forwardSocialMediaPost();
    node.manageRelationships();
    node.addFriendThroughContent();
    node.moveAgent();
}