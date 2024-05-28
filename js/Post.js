import Node from './Node.js';

export default class Post extends Node {
    constructor(id, label, x, y, nodeElement) {
        super(id, label, x, y, 5, nodeElement);
        this.readers = new Map(); //Contains {friend: score} pairs
    }
}