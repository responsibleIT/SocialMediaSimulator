import Node from './Node.js';

export default class Post extends Node {
    constructor(id, label, x, y, data) {
        super(id, label, x, y, 5);
        this.readers = new Map(); //Contains {friend: score} pairs
        this.image = data.postImage;
        this.title = data.title;
        this.growFactor = 0.5;
    }
} 