import Person from "./Person.js";
import Post from "./Post.js";
import Edge from "./Edge.js";
import Cursor from "./Cursor.js";
import UserData from "./UserData.js";
import FileHandler from "./FileHandler.js";
import WebData from "./WebData.js";
import Onboarding from "./Onboarding.js";


const cursor = new Cursor();
const userdata = new UserData();
const fileHandler = new FileHandler();
const webData = new WebData();
const onboarding = new Onboarding();


const canvas = document.getElementById("nodeCanvas");
const canvasContainer = document.getElementById("canvasContainer");
let canvasSize = { width: canvas.width, height: canvas.height };
const nodeDataContainer = document.getElementById("nodeDataContainer");
nodeDataContainer.style.display = "none";
const selectedNodeOptions = document.getElementById("selectedNodeOptions");
const generalOptions = document.getElementById("generalOptions");
const randomPeopleButton = document.getElementById("addRandomPeopleButton");
const randomContentButton = document.getElementById("addRandomContentButton");
// const calcClosenessCentrality = document.getElementById("calcClosenessCentrality");
const increasedPopularityInput = document.getElementById("nodePopularity");
const calcGroupsButton = document.getElementById("calcGroups");
const countInputs = document.querySelectorAll(".counter-input");
const legendListItems = document.querySelectorAll(".legend li");
const friendsUl = friends.querySelector("ul");
const feedUl = feed.querySelector("ul");
const likedUl = liked.querySelector("ul");
const calcSection = document.querySelector(".calculated");
let linkStripe;
let mouseMoveHandler;
let scrollMoveHandler;
let canvasRect;
let calcGroupsBool = true;

//Global map of nodes
let nodes = new Map();

//Global map of links
let links = new Map();

//Variable to keep track of which node is selected
let selectedNode = null;

// Variable to keep track of which node is hovered
let hoveredNode = null;

// variables for filtering edges
let filteredEdges = [];

// Initial resize to set canvas size
resizeCanvas();

///////////////////////////
///// Event listeners /////
///////////////////////////

legendListItems.forEach((li) => {
    li.addEventListener("click", () => {
        const span = li.querySelector("span");
        const allLinksOfThatKind = canvasContainer.querySelectorAll(`div.${span.classList[0]}`);

        if (filteredEdges.includes(span.classList[0])) {
            allLinksOfThatKind.forEach((span) => {
                span.style.display = "flex";
            });
            li.style.textDecoration = "none";
            const index = filteredEdges.indexOf(span.classList[0]);
            if (index > -1) {
                filteredEdges.splice(index, 1);
            }
        } else {
            filteredEdges.push(span.classList[0]);
            allLinksOfThatKind.forEach((span) => {
                span.style.display = "none";
            });
            li.style.textDecoration = "line-through";
        }
    });
});

// Liked is line through, remove forward buttons.
// Click again to remove the line through, show the forward buttons again.
// the class is liked-link

calcSection.addEventListener("click", () => {
    if (calcGroupsBool) {
        calcGroupsBool = false;
    } else {
        calcGroupsBool = true;
        findAllConnectedComponents();
    }
    document.querySelector(".pauseOrPlay").src = `images/pausedImage-${!calcGroupsBool}.svg`;
});

// function for counter inputs
countInputs.forEach((input) => {
    const increaseButton = input.children[2];
    const decreaseButton = input.children[0];
    const countInput = input.children[1];
    let count = Number(countInput.value);
    const minValue = countInput.min ? Number(countInput.min) : false;
    const maxValue = countInput.max ? Number(countInput.max) : false;

    increaseButton.addEventListener("click", () => {
        count = Number(countInput.value);
        if (count < maxValue) {
            countInput.value = count + 1;
            countInput.dispatchEvent(new Event("change"));
        }
    });

    decreaseButton.addEventListener("click", () => {
        count = Number(countInput.value);
        if (count > minValue) {
            countInput.value = count - 1;
            countInput.dispatchEvent(new Event("change"));
        }
    });
});

randomPeopleButton.addEventListener("click", async () => {
    const count = document.getElementById("people-count").value;
    let userData = await userdata.get(count);
    drawRandom("Person", count, userData);
});

randomContentButton.addEventListener("click", () => {
    const count = document.getElementById("post-count").value;
    const data = userdata.getPosts(count);
    drawRandom("Social Media Post", count, data);

    if (selectedNode !== null) {
        showMobile(selectedNode);
    }
});

// onboading post and people add function
next2.addEventListener("click", async () => {
    const peopleCount = document.getElementById("people-count-intro").value;
    const postCount = document.getElementById("post-count-intro").value;
    let userData = await userdata.get(peopleCount);
    const peopleData = userdata.getPosts(postCount);

    drawRandom("Person", peopleCount, userData);
    drawRandom("Social Media Post", postCount, peopleData);
});

canvas.addEventListener("click", async (event) => {
    spawnNode(event);
});

increasedPopularityInput.addEventListener("change", () => {
    selectedNode.increasedPopularity = increasedPopularityInput.value;
    resizeNodes(nodes);
    showMobile(selectedNode);
});

// calcGroupsButton.addEventListener("click", () => {
findAllConnectedComponents();
// });

stepButton.addEventListener("click", () => {
    nodes.forEach((node) => {
        if (node.label === "Person") {
            node.step(nodes, links);
            resizeNodes(nodes);
        }
    });
    calculateAdjustedClosenessCentrality();
    findAllConnectedComponents();
});

// Add event listener for window resize
window.addEventListener("resize", resizeCanvas);

///////////////////////////
//////// Functions ////////
///////////////////////////

function hasAnchorPos() {
    return window.matchMedia("(anchor-position: --blabla)").matches;
}

/**
 * Function to calculate the popularity of the post
 * @param {Number} numOfReaders - number of readers of the post
 */
function calculatePostPopularity(numOfReaders) {
    return numOfReaders * 1.5;
}

/**
 * Function for calculating popularity of the person based on the number of friends and info-links
 * @param {Number} numOfFriends - number of friends of the person
 * @param {Number} numOfInfoRefs - number of info-links of the person
 */
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

// ...
function findAllConnectedComponents() {
    if (!calcGroupsBool) {
        return;
    }
    let visited = new Set();
    let components = [];
    // Filter to include only 'Person' nodes that have at least one friend
    let graph = new Map(
        [...nodes].filter(([id, node]) => {
            if (node.label === "Person" && node.friends && node.friends.size > 0) {
                return node;
            }
            // return node.label === "Person" && node.friends && node.friends.size > 0;
        })
    );
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
                neighbor = neighbor.person;
                if (!visited.has(neighbor.id) && graph.has(neighbor.id)) {
                    // Ensure neighbor is also a 'Person' with friends
                    visited.add(neighbor.id);
                    queue.push(neighbor.id);
                    component.push(neighbor.id);
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

    calcGroups.textContent = components.length;
}

/**
 * ...
 * @param {map} nodes - ...
 */
function resizeNodes(nodes) {
    nodes.forEach((node, id) => {
        if (node.label === "Person") {
            node.popularity = calculatePersonPopularity(node.friends?.size || 0, checkInfoLinkRefs(id).size || 0);
        } else if (node.label === "Social Media Post") {
            node.popularity = calculatePostPopularity(node.readers?.size || 0);
        }

        node.element.style.width = node.radius * 2 + (node.popularity + Number(node.increasedPopularity)) * node.growFactor + "px";
    });
}

/**
 * ...
 * @param {String} label - ...
 * @param {Number} count - ...
 * @param {Array} userData - ...
 */
function drawRandom(label, count, userData) {
    for (var i = 0; i < count; i++) {
        let node;

        const id = nodes.size;
        const x = Math.random() * canvasSize.width;
        const y = Math.random() * canvasSize.height;

        switch (label) {
            case "Person":
                const image = userData[i].image;
                const username = userData[i].username;
                node = new Person(id, "Person", x, y, { image, username });
                break;
            case "Social Media Post":
                const postImage = userData[i].enclosure.url;
                const title = userData[i].title;
                node = new Post(id, "Social Media Post", x, y, { title, postImage });
                break;
            default:
                break;
        }

        nodes.set(id, node);
        node.draw();
        setEventListeners(node);
    }
}

/**
 * Function to spawn a node on the canvas given the position of the cursor
 * @param {Event} evt - ...
 */
async function spawnNode(evt) {
    let label = addPersonCheckbox.checked ? "Person" : addSocialMediaPostCheckbox.checked ? "Social Media Post" : "";

    if (label === "") {
        return;
    }

    let node;

    const id = nodes.size;
    const mousePos = getMousePosOnCanvas(canvasContainer, evt);
    let userData;
    switch (label) {
        case "Person":
            userData = await userdata.get(1);
            const image = userData[0].image;
            const username = userData[0].username;
            node = new Person(id, "Person", mousePos.x, mousePos.y, { image, username });
            break;
        case "Social Media Post":
            let postData = await userdata.getPosts(1);
            const postImage = postData[0].enclosure.url;
            const title = postData[0].title;
            node = new Post(id, "Social Media Post", mousePos.x, mousePos.y, { title, postImage });
            break;
        default:
            break;
    }

    nodes.set(id, node);
    node.draw();
    setEventListeners(node);
}

let hiddenImg;
/**
 * ...
 * @param {Map} nodes - ...
 */
function setEventListeners(node) {
    node.element.addEventListener("mouseover", function () {
        hoveredNode = node.id;
        if (node.label === "Person") {
            nodes.forEach((node) => {
                if (node.element.style.anchorName !== `--MIP${node.id}`) {
                    node.element.style.anchorName = "";
                }
            });
            if (node.element.style.anchorName === `--MIP${node.id}`) {
                const allMedals = canvasContainer.querySelectorAll(".mipMedal");
                allMedals.forEach((img) => {
                    if (img.style.positionAnchor === `--MIP${node.id}`) {
                        img.style.display = "none";
                        hiddenImg = img;
                    }
                });
            }
            node.element.style.anchorName = "--currentNode";
            showNodeDataContainer(node);
        }
    });

    node.element.addEventListener("mouseout", function () {
        hoveredNode = null;
        nodeDataContainer.style.display = "none";
        if (mostImportantPersons.length > 0 && mostImportantPersonsInText !== "Unknown") {
        }
        if (hiddenImg) {
            hiddenImg.style.display = "block";
            node.element.style.anchorName = `--MIP${node.id}`;
        }
    });

    node.element.addEventListener("click", function () {
        //Check whether the node is a person node or a social media post node
        switch (selectedNode) {
            case null:
                selectNode(node);
                showMobile(node);
                showNodeDataContainer(node);
                generalOptions.classList.add("hide");
                break;
            case node:
                deselectNode(node);
                selectedNodeOptions.classList.add("hide");
                generalOptions.classList.remove("hide");
                break;
            default:
                const nodeHovered = nodes.get(hoveredNode);
                if (nodeHovered.label === "Person") {
                    selectedNode.linkHandler(nodeHovered, links);
                } else {
                    nodeHovered.linkHandler(selectedNode, links);
                }

                resizeNodes(nodes);
                calculateAdjustedClosenessCentrality();
                findAllConnectedComponents();
                if (node.label === "Person") {
                    updateFriendList(selectedNode, node);
                } else {
                    updateLikedList(selectedNode);
                    updateFeedList(selectedNode);
                }

            // showMobile(selectedNode);
            // showNodeDataContainer(selectedNode);
        }
    });

    canvas.addEventListener("click", () => {
        if (selectedNode === node) {
            deselectNode(node);
            selectedNodeOptions.classList.add("hide");
            generalOptions.classList.remove("hide");
        }
    });
}

/**
 * Function to get the position of the cursor on the canvas, This is needed to place the nodes based on where you click
 * @param {Element} canvas - ...
 * @param {Event} evt - ...
 */
function getMousePosOnCanvas(canvas, e, scroll) {
    let canvasRect = canvas.getBoundingClientRect();
    if (scroll) {
        return {
            x: scroll.x + canvasContainer.scrollLeft,
            y: scroll.y + canvasContainer.scrollTop,
        };
    } else {
        return {
            x: e.clientX - canvasRect.left + canvasContainer.scrollLeft,
            y: e.clientY - canvasRect.top + canvasContainer.scrollTop,
        };
    }
}

/**
 * Showdata function to display the nodeDataContainer with therein the node data when hovering over it
 * @param {Number} nodeId - ...
 * @param {Object} noteData - ...
 */
function showNodeDataContainer(nodeData) {
    nodeDataContainer.children[0].textContent = nodeData.userName;
    nodeDataContainer.children[1].src = nodeData.profileImage;
    nodeDataContainer.children[2].children[0].textContent = nodeData.friends.size;
    nodeDataContainer.children[2].children[2].textContent = nodeData.popularity;
    nodeDataContainer.style.display = "grid";
    if (!hasAnchorPos()) {
        //Move the nodeDataContainer to the position of the node label
        nodeDataContainer.style.left = nodeData.x + 10 + "px";
        nodeDataContainer.style.top = nodeData.y + 10 + "px";
    }
}

function getNodesWithReaders(nodes) {
    const nodesWithReaders = [];
    nodes.forEach((node) => {
        if (node.readers) {
            nodesWithReaders.push(node);
        }
    });
    return nodesWithReaders;
}

//Function for showing the selectedNodeOptions container with the right data when a node is selected
function showMobile(nodeData) {
    const image = document.getElementById("selectedNodeImage");

    image.src = selectedNode.profileImage;
    selectedNodeUserName.textContent = selectedNode.userName;

    selectedNodeUserFriends.textContent = selectedNode.friends.size;
    totalPopularity.textContent = Number(selectedNode.popularity) + Number(selectedNode.increasedPopularity);

    increasedPopularityInput.value = nodeData.increasedPopularity;

    friendsUl.innerHTML = "";
    feedUl.innerHTML = "";
    likedUl.innerHTML = "";

    updateFriendList(nodeData);
    updateFeedList(nodeData);
    updateLikedList(nodeData);

    selectedNodeOptions.classList.remove("hide");
}

function updateFriendList(nodeData, node) {
    // friends
    if (nodeData.friends.size !== 0) {
        nodeData.friends.forEach((friend) => {
            if (friend.person) {
                friend = friend.person;
            }
            const friendNames = friendsUl.querySelectorAll("li p.friend");
            if (friendNames.length > 0) {
                let dontAddToList = false;
                friendNames.forEach((friendName) => {
                    if (node && friendName.textContent === node.userName) {
                        friendName.parentElement.remove(); // remove the li if the node that needs to be removed, is true aan de textcontent of the p
                    }
                    if (friendName.textContent === friend.userName) {
                        dontAddToList = true;
                    }
                });
                if (!dontAddToList) {
                    addPostToFriendList(friendsUl, friend, nodeData);
                }
            } else {
                friendsUl.innerHTML = "";
                addPostToFriendList(friendsUl, friend, nodeData);
            }
        });
    } else {
        friendsUl.innerHTML = "";
    }
}

function addPostToFriendList(friendsUl, friend, nodeData) {
    const clone = friendsTemplate.content.cloneNode(true);
    const img = clone.querySelector("img");
    const p = clone.querySelector("p");
    p.classList.add("friend");
    const unfriendButton = clone.querySelector(".unfriend-button");
    p.textContent = friend.userName;
    img.src = friend.profileImage;
    unfriendButton.addEventListener("click", () => {
        if (nodeData.person) {
            nodeData = nodeData.person;
        }
        nodeData.removeFriend(friend, links);
        unfriendButton.parentElement.remove();

        resizeNodes(nodes);
    });
    friendsUl.appendChild(clone);
}

function updateFeedList(nodeData) {
    const nodesWithReaderMaps = getNodesWithReaders(nodes);
    if (nodesWithReaderMaps.length !== 0) {
        nodesWithReaderMaps.forEach((item) => {
            const headings = feedUl.querySelectorAll(".post-heading");
            if (headings.length > 0) {
                let dontAddToList = false;
                headings.forEach((heading) => {
                    if (heading.textContent === item.title) {
                        const likeButton = heading.parentElement.querySelector(".like-button");
                        if (nodeData.items.has(item.id)) {
                            likeButton.classList.add("active");
                        } else {
                            likeButton.classList.remove("active");
                        }
                        dontAddToList = true;
                    }
                });
                if (!dontAddToList) {
                    addPostToFeedList(feedUl, item, nodeData);
                }
            } else {
                feedUl.innerHTML = "";
                addPostToFeedList(feedUl, item, nodeData);
            }
        });
    }
}

function addPostToFeedList(feedUl, item, nodeData) {
    const clone = feedTemplate.content.cloneNode(true);
    const img = clone.querySelector("img");
    img.src = item.image;
    const heading = clone.querySelector("h4");
    heading.textContent = item.title;

    const likeButton = clone.querySelector(".like-button");
    if (nodeData.items.has(item.id)) {
        likeButton.classList.add("active");
    } else {
        likeButton.classList.remove("active");
    }
    likeButton.addEventListener("click", (e) => {
        if (nodeData.items.has(item.id)) {
            nodeData.removeItemLink(item, links);
            e.target.classList.remove("active");
            updateLikedList(nodeData);
        } else {
            nodeData.addItemLink(item, nodeData, links);
            e.target.classList.add("active");
            updateLikedList(nodeData);
        }
    });

    feedUl.appendChild(clone);
}

function updateLikedList(nodeData) {
    // liked
    if (nodeData.items.size !== 0) {
        nodeData.items.forEach((item) => {
            const headings = likedUl.querySelectorAll(".post-heading");
            if (headings.length > 0) {
                let dontAddToList = false;
                headings.forEach((heading) => {
                    if (heading.textContent === item.post.title) {
                        dontAddToList = true;
                    }
                });
                if (!dontAddToList) {
                    addPostToLikedList(likedUl, item, nodeData);
                }
            } else {
                likedUl.innerHTML = "";
                addPostToLikedList(likedUl, item, nodeData);
            }
        });
    } else {
        likedUl.innerHTML = "<li><p>Like posts to see them here!</p></li>"; // TODO add default
    }
}

deleteButtonLikes.addEventListener("click", () => {
    const node = selectedNode;
    node.items.forEach((item) => {
        node.removeItemLink(item.post, links);
    });
    updateLikedList(node);
});

function addPostToLikedList(likedUl, item, nodeData) {
    const clone = feedTemplate.content.cloneNode(true);
    const img = clone.querySelector("img");
    img.src = item.post.image;
    const heading = clone.querySelector("h4");
    heading.textContent = item.post.title;

    const likeButton = clone.querySelector(".like-button");
    likeButton.classList.add("active");
    likeButton.addEventListener("click", () => {
        if (nodeData.items.has(item.post.id)) {
            nodeData.removeItemLink(item.post, links);
            // transparent
            likeButton.classList.remove("active");
            updateFeedList(nodeData);
            likeButton.parentElement.parentElement.remove();
        } else {
            nodeData.addItemLink(item.post, nodeData, links);
            likeButton.classList.add("active");
            updateFeedList(nodeData);
            likeButton.parentElement.parentElement.remove();
        }
    });

    likedUl.appendChild(clone);
}

/**
 * Function for checking who has an info link with a given node
 * @param {Number} nodeId - ...
 */
function checkInfoLinkRefs(nodeId) {
    let refs = [];
    //Get all person nodes
    let personNodes = new Map([...nodes].filter(([id, node]) => node.label === "Person"));
    //Loop over all nodes in the map and check if the given node has an info link with them
    personNodes.forEach((node, id) => {
        if (node.infoLinks.get(nodeId)) {
            refs.push(id);
        }
    });
    return refs;
}

/**
 * Show the link that follows the cursor
 * @param {Object} from - ...
 */
function showPreLink(from) {
    canvasRect = canvasContainer.getBoundingClientRect();
    const link = new Edge(from, from, "pre-link");

    linkStripe = link.element;
    let toCursor = { x: 0, y: 0 };
    mouseMoveHandler = (e) => {
        link.to = getMousePosOnCanvas(canvasContainer, e);
        link.calcAngle();
        toCursor = link.to;
    };
    scrollMoveHandler = () => {
        link.to = getMousePosOnCanvas(canvasContainer, 0, toCursor);
        link.calcAngle();
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

/**
 * Function for selecting a node and highlight it and its data
 * @param {Object} node - ...
 */
function selectNode(node) {
    node.element.classList.add("selected");
    if (node.label === "Person") {
        showPreLink(node);
        phone.classList.add("phone-selected");
        node.spawnForwardButtons(links);
    }
    selectedNode = node;
    // showMobile(node);
}

//Function for deselecting a node and remove the highlight
function deselectNode() {
    const node = selectedNode;
    phone.classList.remove("phone-selected");
    node.element.classList.remove("selected");

    // Assuming that mouseMoveHandler is now a named function
    canvasContainer.removeEventListener("mousemove", mouseMoveHandler);
    canvasContainer.removeEventListener("scroll", scrollMoveHandler);
    if (linkStripe) {
        linkStripe.remove();
    }

    selectedNodeOptions.classList.add("hide");
    selectedNode = null;
    node.removeForwardButtons();
}

let previousMips;
let mostImportantPersonsInText;
let mostImportantPersons = [];

//Function for calculating the closeness centrality of all nodes
function calculateAdjustedClosenessCentrality() {
    let centralities = {};
    let personNodes = new Map(
        [...nodes].filter(([id, node]) => {
            if (node.label === "Person") {
                return node;
            }
        })
    );
    personNodes.forEach((value, node) => {
        let shortestPaths = bfsShortestPath(nodes, node);
        let reachableNodes = Object.values(shortestPaths).filter((dist) => dist < Infinity).length;
        let totalDistance = Object.values(shortestPaths).reduce((acc, d) => (d < Infinity ? acc + d : acc), 0);

        if (reachableNodes > 1) {
            // Avoid division by zero if no nodes are reachable
            centralities[node] = (reachableNodes - 1) / totalDistance;
        } else {
            centralities[node] = 0; // Or consider another approach for isolated nodes
        }
    });
    let highestScore;
    mostImportantPersons = [];
    mostImportantPersonsInText = "Unknown";
    for (const [key, value] of Object.entries(centralities)) {
        const nodeName = nodes.get(Number(key));
        if ((highestScore === undefined) & (value > 0)) {
            highestScore = value;
            mostImportantPersonsInText = nodeName.userName;
            mostImportantPersons = [nodeName];
        } else if (value > highestScore) {
            highestScore = value;
            mostImportantPersonsInText = nodeName.userName;
            mostImportantPersons = [nodeName];
        } else if (value === highestScore) {
            highestScore = value;
            mostImportantPersonsInText = mostImportantPersonsInText + ", " + nodeName.userName;
            mostImportantPersons.push(nodeName);
        }
    }
    // calcMostImportantPerson.textContent = mostImportantPersonsInText;
    if (previousMips !== mostImportantPersonsInText) {
        addMedalToMip(mostImportantPersons, mostImportantPersonsInText);
    }
}

function addMedalToMip(mostImportantPersons, mostImportantPersonsInText) {
    hiddenImg = "";
    const allPreviousImages = canvasContainer.querySelectorAll(".mipMedal");
    allPreviousImages.forEach((img) => {
        img.remove();
    });
    previousMips = mostImportantPersonsInText;
    mostImportantPersons.forEach((person) => {
        const img = document.createElement("img");
        img.src = "images/goldMedal.png";
        img.classList.add("mipMedal");
        canvasContainer.append(img);
        img.style.positionAnchor = `--MIP${person.id}`;
        img.style.display = "block";
        person.element.style.anchorName = `--MIP${person.id}`;
    });
}

/**
 * Function for calculating the shortest paths between all nodes
 * @param {Map} graph - ... (nodes)
 * @param {Object} startNode - ...
 */
function bfsShortestPath(graph, startNode) {
    let distances = {};
    let queue = [startNode];
    graph.forEach((_, node) => (distances[node] = Infinity)); // Initialize distances
    distances[startNode] = 0;

    while (queue.length > 0) {
        let currentNodeId = queue.shift();
        let currentDistance = distances[currentNodeId];
        let neighbors = graph.get(currentNodeId).friends; // Assuming 'friends' is the adjacency list
        neighbors.forEach((neighbor) => {
            neighbor = neighbor.person.id;
            if (distances[neighbor] === Infinity) {
                // Node has not been visited
                queue.push(neighbor);
                distances[neighbor] = currentDistance + 1;
            }
        });
    }
    return distances;
}

// Switch the mobile pages
document.addEventListener("DOMContentLoaded", function () {
    const phoneNav = document.getElementById("phoneNav");
    const buttons = phoneNav.querySelectorAll("button");
    const pages = document.querySelectorAll("#friends, #profile, #liked, #selectedProfile, #feed");

    buttons.forEach((button) => {
        button.addEventListener("click", function () {
            buttons.forEach((btn) => btn.classList.remove("active"));

            this.classList.add("active");

            pages.forEach((page) => (page.style.display = "none"));
            document.getElementById(this.dataset.page).style.display = "block";
            if (this.dataset.page === "profile") {
                selectedProfile.style.display = "block";
            }
        });
    });
});

//Export & Import
exportButton.addEventListener("click", () => {
    fileHandler.export(nodes);
});

importButton.addEventListener("click", async () => {
    await fileHandler.import(nodes, links);
    nodes.forEach((node) => {
        setEventListeners(node);
    });
    resizeNodes(nodes);
});




deleteNodeButton.addEventListener('click', () => {
    const node = selectedNode
    node.friends.forEach((friend) => {
        friend.person.removeFriend(node, links);
    });
    node.items.forEach((item) => {
        node.removeItemLink(item.post, links);
    });
    node.infoLinks.forEach((infoLink) => {
        infoLink.person.removeInfoLink(infoLink.person, node, links);
    });

    deselectNode();
    node.element.remove();
    nodes.delete(node.id);
    // showMobile(node);


    // updateFriendList(node);
    console.log(nodes);
});



