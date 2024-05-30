export default async function fetchUsers(count) {
    const response = await fetch(`https://randomuser.me/api/?results=${count}`);
    const data = await response.json();

    const array = [];
    data.results.forEach(person => {
        let personData = {
            image: person.picture.large,
            username: person.name.first + " " + person.name.last,
        };
        array.push(personData);

    });
    return array;
};
