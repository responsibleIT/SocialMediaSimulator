// const socket = new WebSocket('ws://localhost:8765');
const canvas = document.getElementById("nodeCanvas");
const canvasContainer = document.getElementById("canvasContainer");
const ctx = canvas.getContext("2d"); // Only used now for the links
const canvasSize = { width: canvas.width, height: canvas.height };

const nodeDataContainer = document.getElementById("nodeDataContainer");
const gridRange = { min: -1, max: 1 };
// const addPersonCheckbox = document.getElementById("addPersonCheckbox");
// const addSocialMediaPostCheckbox = document.getElementById("addSocialMediaPostCheckbox");
const selectedNodeOptions = document.getElementById("selectedNodeOptions");
const generalOptions = document.getElementById("generalOptions");
const standardPersonRadius = 8;
const standardPostRadius = 4;

const randomPeopleButton = document.getElementById("addRandomPeopleButton");
const randomContentButton = document.getElementById("addRandomContentButton");
const deleteNodeButton = document.getElementById("deleteNode");
const calcClosenessCentrality = document.getElementById("calcClosenessCentrality");

//Global map of nodes
let nodes = new Map();

//Global map of links
let links = new Map();

//Global map of node labels
let nodeLabelMap = new Map();

//Variable to keep track of which node is selected
let selectedNode = null;

// Variable to keep track of which node is hovered
let hoveredNode = null;

//Link colours in rgba format (blue, red, green) with 20% opacity
const linkColors = {
    friend: "rgb(0, 255, 0)",
    itemlink: "rgb(254, 143, 0)",
    infolink: "rgb(0, 0, 255)",
};

//Node colours in rgba format (blue, red) with 100% opacity
const labelColors = {
    Person: "blue",
    "Social Media Post": "red",
};

randomPeopleButton.addEventListener("click", () => {
    // drawRandomPersonNodes();
    drawRandom("Person");
});
randomContentButton.addEventListener("click", () => {
    // drawRandomSocialMediaPostNodes();
    drawRandom("Social Media Post");
});
deleteNodeButton.addEventListener("click", () => {
    // deleteNode();
});
canvas.addEventListener("click", (event) => {
    spawnNode(event);
});
calcClosenessCentrality.addEventListener("click", () => {
    calculateAdjustedClosenessCentrality();
});

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
//Function for calculating social media post popularity based on the number of readers
function calculatePostPopularity(numOfReaders) {
    return numOfReaders * 1.5;
}
//Function for calculating popularity based on the number of friends and info links
function calculatePersonPopularity(numOfFriends, numOfInfoRefs) {
    return numOfInfoRefs > 0 ? numOfFriends * 1.5 + numOfInfoRefs * 2 : numOfFriends * 1.5;
}
