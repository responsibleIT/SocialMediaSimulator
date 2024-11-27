export default class Edge {
    constructor(fromId, toId, type) {
        this.fromId = fromId;
        this.toId = toId;
        this.type = type;
        this.element = null;

        // Only draw the link if the DOM is available (browser environment)
        if (typeof document !== "undefined" && typeof window !== "undefined") {
            this.drawLink();
        }
    }

    drawLink() {
        // Check if the DOM is available
        if (typeof document === "undefined") {
            return; // Skip DOM-related operations in Node.js
        }

        let linkStripe = document.createElement("div");
        this.element = linkStripe;
        linkStripe.className = "linkStripe";
        linkStripe.style.position = "absolute";

        this.calcAngle();

        linkStripe.classList.add(this.type);

        // Ensure `canvasContainer` exists in your environment
        if (typeof canvasContainer !== "undefined") {
            canvasContainer.appendChild(linkStripe);
        }

        return linkStripe;
    }

    calcAngle() {
        if (!this.element) return;

        let Ydifference = this.from.y - this.to.y;
        let Xdifference = this.from.x - this.to.x;

        let linkLength = Math.sqrt(Math.pow(Ydifference, 2) + Math.pow(Xdifference, 2));
        let linkAngle = Math.atan2(Ydifference, Xdifference) + Math.PI;

        this.element.style.width = linkLength + "px";
        this.element.style.transform = "translateY(-50%) rotate(" + linkAngle + "rad)";
        this.element.style.left = this.from.x + "px";
        this.element.style.top = this.from.y + "px";
    }
}
