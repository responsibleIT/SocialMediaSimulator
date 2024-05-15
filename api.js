$(document).ready(function () {
    const photoSet = new Set();

    function fetchRandomUsers(count) {
        $.ajax({
            url: `https://randomuser.me/api/?results=${count}`,
            dataType: 'json',
            success: function (data) {
                data.results.forEach(function (user) {
                    const photoUrl = user.picture.large;

                    photoSet.add(photoUrl);

                    const userElement = `
                            <div class="user">
                                <img src="${photoUrl}" alt="User Picture">
                                <p>${user.name.first} ${user.name.last}</p>
                            </div>
                        `;
                    $('#user-container').append(userElement);
                });
            },
            error: function (error) {
                console.error('Error fetching data:', error);
            }
        });
    }

    // Always start with one random user
    fetchRandomUsers(1);

    // Fetch a new single random user when the button is clicked
    $('#generate-user').click(function () {
        fetchRandomUsers(1);
    });

    // Fetch seven random users when the button is clicked
    $('#generate-seven-users').click(function () {
        fetchRandomUsers(7);
    });
});
