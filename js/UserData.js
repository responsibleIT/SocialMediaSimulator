export default class userData {
    constructor() {
        this.preFetchedData = [];
        this.postData = [];
        this.fetchUserData(50);
        this.fetchPostData();
    }

    async fetchUserData(count) {
        const response = await fetch(`https://randomuser.me/api/?results=${count}`);
        const data = await response.json();

        data.results.forEach((person) => {
            let personData = {
                image: person.picture.large,
                username: person.name.first + " " + person.name.last,
            };
            this.preFetchedData.push(personData);
        });
    }

    async get(count) {
        const array = [];

        if (this.preFetchedData.length < count) {
            await this.fetchUserData(count);
        }

        for (let i = count - 1; i >= 0; i--) {
            array.push(this.preFetchedData[i]);
        }

        this.preFetchedData.splice(0, count);

        this.fetchUserData(count);

        return array;
    }

    // get random items accourding to the count from the postData and return this
    getPosts(count) {
        // Shuffle the postData array to get random items
        const shuffled = this.postData.sort(() => 0.5 - Math.random());

        // Get the specified number of random posts
        const selectedPosts = shuffled.slice(0, count);

        // Simulate async behavior with a promise
        return selectedPosts;
    }

    async fetchPostData() {
        const response = await fetch(`../fakenews.json`);
        this.postData = await response.json();
    }
}
