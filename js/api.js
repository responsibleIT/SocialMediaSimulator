async function fetchUsers(count) {
    const response = await fetch(`https://randomuser.me/api/?results=${count}`);
    const data = await response.json();

    array = [];
    data.results.forEach(person => {
        let personData = {
            image: person.picture.large,
            username: person.login.username,
        }
        array.push(personData);

    });
    return array;
};

// .then(response => {
//     if (!response.ok) {
//         throw new Error('Network response was not ok');
//     }
//     return response.json();
// })
// .then(data => {
//     // console.log(data);
//     // drawRandom("Person", count, data.results);
//     // change the image in html for each person
//     array = [];
//     data.results.forEach(person => {
//         let personData = {
//             image: person.picture.large,
//             username: person.login.username,
//         }
//         array.push(personData);

//         return array;
//         // const image = document.getElementById(`image`);
//         // image.src = person.picture.large;
//     });

// })
// .catch(error => {
//     console.error('Error fetching data:', error);
// })
//};
