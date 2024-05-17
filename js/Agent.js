import Node from './Node.js';

export default class Agent extends Node {
	constructor(id, label, x, y, nodeElement, user) {
		super(id, label, x, y, 8, nodeElement);
		this.friends = [];
		this.likedItems = [];
        this.infoLinks = [];
        this.profileImage = user.picture;
        this.userName = user.login.username;
	}
}