export default class Edge {
    constructor(from, to, type) {
        this.from = from;
        this.to = to;
        this.type = type;
        this.element = null;
    }

    drawLink(links, name1, name2) {
        let linkStripe = document.createElement("div");
        this.element = linkStripe;
        links.set(name1 + "-" + name2, this);
        linkStripe.className = "linkStripe";
        linkStripe.style.position = "absolute";
        linkStripe.style.height = "1px";

        let Ydifference = this.from.y - this.to.y;
        let Xdifference = this.from.x - this.to.x;

        let linkLength = Math.sqrt(Math.pow(Ydifference, 2) + Math.pow(Xdifference, 2));
        let linkAngle = Math.atan2(Ydifference, Xdifference) + Math.PI;

        linkStripe.style.width = linkLength + "px";
        linkStripe.style.transform = "translateY(-50%) rotate(" + linkAngle + "rad)";

        linkStripe.style.left = this.from.x + "px";
        linkStripe.style.top = this.from.y + "px";
        if (this.type === "itemlink") {
            linkStripe.classList.add("link-item");
        } else if (this.type === "friend") {
            linkStripe.classList.add("link-friend");
        } else if (this.type === "infolink") {
            linkStripe.classList.add("link-info");
        }

        canvasContainer.appendChild(linkStripe);

        return linkStripe;
    }
}