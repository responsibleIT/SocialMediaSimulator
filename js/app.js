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
const standardPersonRadius = 8;
const standardPostRadius = 5;

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
    canvas.width = canvasContainer.clientWidth;
    canvas.height = canvasContainer.clientHeight;
    canvasSize = { width: canvasContainer.clientWidth, height: canvasContainer.clientHeight };
}

// Initial resize to set canvas size
resizeCanvas();

// Add event listener for window resize
window.addEventListener("resize", resizeCanvas);
