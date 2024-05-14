let userArray = [];

function makeNewUser(name, age) {
    let id;
    if (name === "test") {
        id = 123;
    } else {
        id = generateUniqueId(userArray);
    }
    const newUser = new User(name, age, id);
    userArray.push(newUser);
    return newUser;
}

function deleteUser(id) {
    const foundUser = userArray.find((user) => user.id === id);
    foundUser.remove(userArray);
}

function generateUniqueId(array) {
    let id;
    do {
        // Generate a random 8-digit ID
        id = Math.floor(10000000 + Math.random() * 90000000).toString();
    } while (array.some((element) => element.id === id)); // Check if ID already exists in users array
    return id;
}

// Example usage:
makeNewUser("Bart", 30).addToPage().greet();
makeNewUser("Joppe", 30).addToPage().greet();
makeNewUser("Jop", 30).addToPage().greet();
makeNewUser("test", 30).addToPage().greet();

// console.log("new user:", newUser);

const sections = document.querySelectorAll("body section");
sections.forEach((section) => {
    section.addEventListener("click", () => {
        // deleteUser(section.id);
        const foundUser = userArray.find((user) => user.id === section.id);
        foundUser.follow(123, userArray);
        console.log(userArray);
    });
});
