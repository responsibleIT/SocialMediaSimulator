const randomPeopleButton = document.getElementById("addRandomPeopleButton");
const randomContentButton = document.getElementById("addRandomContentButton");
const calcClosenessCentrality = document.getElementById("calcClosenessCentrality");
const deleteNodeButton = document.getElementById("deleteNode");

randomPeopleButton.addEventListener("click", () => {
    drawRandomPersonNodes();
});
randomContentButton.addEventListener("click", () => {
    drawRandomSocialMediaPostNodes();
});
calcClosenessCentrality.addEventListener("click", () => {
    calculateAdjustedClosenessCentrality();
});
deleteNodeButton.addEventListener("click", () => {
    deleteNode();
});
canvas.addEventListener("click", (event) => {
    spawnNode(event);
});
