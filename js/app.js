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

// Function to calc the number of people the user wants to add
function updateCount(newCount) {
    const countInput = document.getElementById('people-count');
    countInput.value = newCount;
}

function increasePeople() {
    const countInput = document.getElementById('people-count');
    let count = parseInt(countInput.value);
    if (count < countInput.max) {
        count++;
        updateCount(count);
    }
}

function decreasePeople() {
    const countInput = document.getElementById('people-count');
    let count = parseInt(countInput.value);
    if (count > countInput.min) {
        count--;
        updateCount(count);
    }
}

// api picture and data




randomPeopleButton.addEventListener("click", async () => {
    // drawRandomPersonNodes();
    const count = document.getElementById('people-count').value;

    let userData = await fetchUsers(count);
    console.log(userData);

    drawRandom("Person", count, userData);

    // change image
    // const image = document.getElementById(`image`);
    // image.src = userData.image;




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
