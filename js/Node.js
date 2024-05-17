export default class Node {
	constructor(id, label, x, y, radius, nodeElement) {
		this.id = id;
		this.label = label;
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.nodeElement = nodeElement;
		this.popularity = 0;
		this.increasedPopularity = 0;
	}


}