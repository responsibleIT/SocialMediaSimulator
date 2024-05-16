document.addEventListener('DOMContentLoaded', function () {
    // const photoSet = new Set();

    function fetchRandomUsers(count) {
        fetch(`https://randomuser.me/api/?results=${count}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                data.results.forEach(user => {
                    const photoUrl = user.picture.large;

                    // photoSet.add(photoUrl);

                    const userElement = `
                        <div class="user">
                            <img src="${photoUrl}" alt="User Picture">
                            <p>${user.login.username}</p>
                        </div>
                    `;
                    document.getElementById('user-container').insertAdjacentHTML('beforeend', userElement);
                });
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    // Always start with one random user
    fetchRandomUsers(1);

    // Fetch a new single random user when the button is clicked
    document.getElementById('generate-user').addEventListener('click', function () {
        fetchRandomUsers(1);
    });

    // Fetch seven random users when the button is clicked
    document.getElementById('generate-seven-users').addEventListener('click', function () {
        fetchRandomUsers(7);
    });
});
