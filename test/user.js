class User {
    constructor(name, age, id) {
        this.name = name;
        this.age = age;
        this.id = id;
        this.followers = [];
        this.follows = [];
        this.posts = [];
        this.liked = [];
        this.commented = [];
    }

    greet() {
        console.log(`Hello, my name is ${this.name} and I am ${this.age} years old.`);
        return this;
    }

    remove(userArray) {
        console.log(`User ${this.name} has been removed.`);
        // Remove this user from the userArray
        const index = userArray.indexOf(this);
        if (index !== -1) {
            userArray.splice(index, 1);
            console.log("array in function", userArray);
        }
        const userSection = document.getElementById(`${this.id}`);
        userSection.remove();
        return this;
    }

    addToPage() {
        const template = document.getElementById("user");
        const section = template.content.querySelector("section");
        section.setAttribute("id", `${this.id}`);
        const p = template.content.querySelector("p");
        p.textContent = `Hello, my name is ${this.name} and I am ${this.age} years old.`;
        let clone = template.content.cloneNode(true);
        document.body.appendChild(clone);
        return this;
    }

    follow(id, userArray) {
        const userExists = this.follows.find((user) => id === id);
        if (!userExists) {
            console.log("follow");
            this.follows.push(id);
            const otherUser = userArray.find((user) => user.id === id);
            otherUser.followers.push(this.id);
        } else {
            this.unFollow(id, userArray);
        }
    }
    unFollow(id, userArray) {
        console.log("unfollow");
        const index = this.follows.indexOf(id);
        if (index !== -1) {
            this.follows.splice(index, 1);
        }
        const otherUser = userArray.find((user) => user.id === id);

        const index2 = otherUser.followers.indexOf(this.id);
        if (index2 !== -1) {
            otherUser.followers.splice(index2, 1);
        }
    }
}
