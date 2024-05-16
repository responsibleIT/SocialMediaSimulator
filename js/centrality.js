//Function for calculating the closeness centrality of all nodes
function calculateAdjustedClosenessCentrality() {
    let centralities = {};
    let personNodes = new Map([...nodes].filter(([id, node]) => node.label === "Person"));
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

    console.log(centralities);
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
