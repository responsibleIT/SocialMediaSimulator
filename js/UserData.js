export default class userData {

    constructor() {
        this.preFetchedData = [];
        this.fetchUserData(50);
    }

    async fetchUserData(count) {
        const response = await fetch(`https://randomuser.me/api/?results=${count}`);
        const data = await response.json();

        data.results.forEach(person => {
            let personData = {
                image: person.picture.large,
                username: person.name.first + " " + person.name.last,
            };
            this.preFetchedData.push(personData);

        });
    }

    async get(count) {
        const array = [];

        if(this.preFetchedData.length < count) {
            await this.fetchUserData(count);
        }

        for (let i = count - 1; i >= 0; i--) {
            array.push(this.preFetchedData[i]);
        }

        this.preFetchedData.splice(0, count);

        this.fetchUserData(count);

        return array;
    }
};
