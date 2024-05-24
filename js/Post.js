import Node from './Node.js';

export default class Post extends Node {
	constructor(id, label, x, y, nodeElement, user) {
		super(id, label, x, y, 8, nodeElement);
	}

}