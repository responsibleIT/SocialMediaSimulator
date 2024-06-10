export default class userData {

    constructor() {
        this.preFetchedData = [];
        this.postData = [];
        this.realPostData = [];
        this.fetchUserData(50);
        this.fetchPostData();
        this.fetchRealPostData();
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


    // get random items accourding to the count from the postData and return this
    getPosts(count) {
        // Shuffle the postData array to get random items
        const shuffled = this.realPostData.sort(() => 0.5 - Math.random());

        // Get the specified number of random posts
        const selectedPosts = shuffled.slice(0, count);

        // Simulate async behavior with a promise
        return selectedPosts;
    }

    async fetchPostData() {
        const response = await fetch(`../fakenews.json`);
        this.postData = await response.json();
    }

    async fetchRealPostData() {

        function xmlToJson(xml) {
            // Create the return object
            let obj = {};

            if (xml.nodeType == 1) {
                // element
                // do attributes
                if (xml.attributes.length > 0) {
                    for (let j = 0; j < xml.attributes.length; j++) {
                        const attribute = xml.attributes.item(j);
                        obj[attribute.nodeName] = attribute.nodeValue;
                    }
                }
            } else if (xml.nodeType == 3) {
                // text
                obj = xml.nodeValue;
            }

            // do children
            // If all text nodes inside, get concatenated text from them.
            const textNodes = [].slice.call(xml.childNodes).filter(function (node) {
                return node.nodeType === 3;
            });
            if (xml.hasChildNodes() && xml.childNodes.length === textNodes.length) {
                obj = [].slice.call(xml.childNodes).reduce(function (text, node) {
                    return text + node.nodeValue;
                }, "");
            } else if (xml.hasChildNodes()) {
                for (let i = 0; i < xml.childNodes.length; i++) {
                    const item = xml.childNodes.item(i);
                    const nodeName = item.nodeName;
                    if (typeof obj[nodeName] == "undefined") {
                        obj[nodeName] = xmlToJson(item);
                    } else {
                        if (typeof obj[nodeName].push == "undefined") {
                            const old = obj[nodeName];
                            obj[nodeName] = [];
                            obj[nodeName].push(old);
                        }
                        obj[nodeName].push(xmlToJson(item));
                    }
                }
            }
            return obj;
        }

        const domParser = new DOMParser();
        const response = await fetch('https://rss.at5.nl/rss/achtergrond');
        const xmlString = await response.text();
        const xmlDoc = domParser.parseFromString(xmlString, 'text/xml');
        const json = xmlToJson(xmlDoc.documentElement)
        this.realPostData = json.channel.item;
    }
}
