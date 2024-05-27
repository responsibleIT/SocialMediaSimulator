export default class Edge {
    constructor(from, to, type) {
        this.from = from;
        this.to = to;
        this.type = type;
        this.element = null;
    }

    drawLink() {
        let linkStripe = document.createElement("div");
        this.element = linkStripe;
        linkStripe.className = "linkStripe";
        linkStripe.style.position = "absolute";
        linkStripe.style.height = "1px";

        this.calcAngle();

        if (this.type === "itemlink") {
            linkStripe.classList.add("link-item");
        } else if (this.type === "friend") {
            linkStripe.classList.add("link-friend");
        } else if (this.type === "infolink") {
            linkStripe.classList.add("link-info");
        } else if (this.type === "pre-link") {
            linkStripe.classList.add("followLink", "linkStripe");
        }

        canvasContainer.appendChild(linkStripe);

        return linkStripe;
    }

    calcAngle() {
        console.log(this.to.x);
        let Ydifference = this.from.y - this.to.y;
        let Xdifference = this.from.x - this.to.x;

        let linkLength = Math.sqrt(Math.pow(Ydifference, 2) + Math.pow(Xdifference, 2));
        let linkAngle = Math.atan2(Ydifference, Xdifference) + Math.PI;
        console.log(linkLength, linkAngle);
        this.element.style.width = linkLength + "px";
        this.element.style.transform = "translateY(-50%) rotate(" + linkAngle + "rad)";
        this.element.style.left = this.from.x + "px";
        this.element.style.top = this.from.y + "px";
    }
}