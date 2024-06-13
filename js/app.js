import Person from "./Person.js";
import Post from "./Post.js";
import Edge from "./Edge.js";
import Cursor from "./Cursor.js";
import UserData from "./UserData.js";

const cursor = new Cursor();
const userdata = new UserData();

const canvas = document.getElementById("nodeCanvas");
const canvasContainer = document.getElementById("canvasContainer");
let canvasSize = { width: canvas.width, height: canvas.height };
const nodeDataContainer = document.getElementById("nodeDataContainer");
nodeDataContainer.style.display = "none";
const selectedNodeOptions = document.getElementById("selectedNodeOptions");
const generalOptions = document.getElementById("generalOptions");
const randomPeopleButton = document.getElementById("addRandomPeopleButton");
const randomContentButton = document.getElementById("addRandomContentButton");
const deleteNodeButton = document.getElementById("deleteNode");
const calcClosenessCentrality = document.getElementById("calcClosenessCentrality");
const increasedPopularityInput = document.getElementById("nodePopularity");
const calcGroupsButton = document.getElementById("calcGroups");
const countInputs = document.querySelectorAll(".counter-input");
const legendListItems = document.querySelectorAll(".legend li");
let linkStripe;
let mouseMoveHandler;
let scrollMoveHandler;
let canvasRect;

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

deleteNodeButton.addEventListener("click", () => {
    // deleteNode();
});

canvas.addEventListener("click", async (event) => {
    spawnNode(event);
});

// calcGroups.addEventListener("click", () => {
// calculateAdjustedClosenessCentrality();
// });

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
                node = new Post(id, "Social Media Post", x, y, null, { title, postImage });
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
            userData = await userdata.getPosts(1);
            const postImage = userData[0].enclosure.url;
            const title = userData[0].title;
            node = new Post(id, "Social Media Post", mousePos.x, mousePos.y, null, { title, postImage });
            break;
        default:
            break;
    }

    nodes.set(id, node);
    node.draw();
    setEventListeners(node);
}

/**
 * ...
 * @param {Map} nodes - ...
 */
function setEventListeners(node) {
    node.element.addEventListener("mouseover", function () {
        hoveredNode = node.id;
        if (node.label === "Person") {
            nodes.forEach((node) => {
                node.element.style.anchorName = "";
            });
            node.element.style.anchorName = "--currentNode";
            showNodeDataContainer(node);
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
                    updateFriendList(selectedNode);
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
    // if (hasAnchorPos()) {
    //     console.log(hasAnchorPos());
    //     //Move the nodeDataContainer to the position of the node label
    //     nodeDataContainer.style.left = nodeData.x + 10 + "px";
    //     nodeDataContainer.style.top = nodeData.y + 10 + "px";
    // }
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

    updateFriendList(nodeData);
    updateFeedList(nodeData);
    updateLikedList(nodeData);

    selectedNodeOptions.classList.remove("hide");
}

function updateFriendList(nodeData) {
    // friends
    const friendsUl = friends.querySelector("ul");
    if (nodeData.friends.size !== 0) {
        friendsUl.innerHTML = "";
        nodeData.friends.forEach((friend) => {
            if (friend.person) {
                friend = friend.person;
            }
            const clone = friendsTemplate.content.cloneNode(true);
            const img = clone.querySelector("img");
            const p = clone.querySelector("p");
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
                showNodeDataContainer(nodeData);
            });
            friendsUl.appendChild(clone);
        });
    }
}
function updateFeedList(nodeData) {
    const feedUl = feed.querySelector("ul");
    const nodesWithReaderMaps = getNodesWithReaders(nodes);
    if (nodesWithReaderMaps.length !== 0) {
        feedUl.innerHTML = "";
        nodesWithReaderMaps.forEach((item) => {
            const clone = feedTemplate.content.cloneNode(true);
            const img = clone.querySelector("img");
            img.src = item.image;
            const heading = clone.querySelector("h4");
            heading.textContent = item.title;

            const likeButton = clone.querySelector(".like-button");
            if (nodeData.items.has(item.id)) {
                likeButton.classList.add("active");
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
        });
    }
}
function updateLikedList(nodeData) {
    // liked
    const likedUl = liked.querySelector("ul");
    if (nodeData.items.size !== 0) {
        likedUl.innerHTML = "";
        nodeData.items.forEach((item) => {
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
        });
    } else {
        likedUl.innerHTML = "Like posts to see them here!"; // TODO add default
    }
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
    let mostImportantPerson = "Unknown";
    let highestScore;
    for (const [key, value] of Object.entries(centralities)) {
        const nodeName = nodes.get(Number(key));
        if ((highestScore === undefined) & (value > 0)) {
            highestScore = value;
            mostImportantPerson = nodeName.userName;
        } else if (value > highestScore) {
            highestScore = value;
            mostImportantPerson = nodeName.userName;
        } else if (value === highestScore) {
            highestScore = value;
            mostImportantPerson = mostImportantPerson + ", " + nodeName.userName;
        }
    }
    calcMostImportantPerson.textContent = mostImportantPerson;
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

// switch in the phone between tabs
const phoneNav = document.getElementById("phoneNav");
phoneNav.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
        phoneNav.querySelectorAll("button").forEach((button) => {
            button.classList.remove("active");
        });
        button.classList.add("active");
    });
});

// navigation in phone
document.addEventListener('DOMContentLoaded', function () {
    const buttons = document.querySelectorAll('#phoneNav button');
    const friendsSection = document.getElementById('friends');
    const profileSection = document.getElementById('profile');
    const likedSection = document.getElementById('liked');

    buttons.forEach(button => {
        button.addEventListener('click', function () {
            const page = this.dataset.page;

            if (page === 'friends') {
                friendsSection.style.display = 'block';
                profileSection.style.display = 'none';
                likedSection.style.display = 'none';
                selectedProfile.style.display = 'none';
                feed.style.display = "none";

            } else if (page === 'profile') {
                profileSection.style.display = 'block';
                selectedProfile.style.display = 'block';
                friendsSection.style.display = 'none';
                likedSection.style.display = 'none';
                feed.style.display = "none";
            }
            else if (page === 'liked') {
                likedSection.style.display = 'block';
                profileSection.style.display = 'none';
                friendsSection.style.display = 'none';
                selectedProfile.style.display = 'none';
                feed.style.display = "none";
            }
            else {
                friendsSection.style.display = 'none';
                profileSection.style.display = 'none';
                likedSection.style.display = 'none';
                selectedProfile.style.display = 'none';
                feed.style.display = "block";
            }
        });
    });
});




