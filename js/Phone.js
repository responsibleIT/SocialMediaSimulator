export default class Phone {
	constructor() {
		this.history = [];
	}

	show(selectedNode) {

	    selectedNodeImage.src = selectedNode.profileImage;
	    selectedNodeUserName.textContent = selectedNode.userName;

	    selectedNodeUserFriends.textContent = selectedNode.friends.size;
	    totalPopularity.textContent = Number(selectedNode.popularity) + Number(selectedNode.increasedPopularity);

	    increasedPopularityInput.value = selectedNode.increasedPopularity;

	    friendsUl.innerHTML = "";
	    feedUl.innerHTML = "";
	    likedUl.innerHTML = "";

	    updateFriendList(selectedNode);
	    updateFeedList(selectedNode);
	    updateLikedList(selectedNode);

	    selectedNodeOptions.classList.remove("hide");
	}

	navigateToPage(pageId) {

	}

	updateList(ul, template, data ) {
		if (data.size !== 0) {
	        data.forEach((item) => {
	            if (item[1]) {
	                item = item[1];
	            }
	            const existingItems = ul.querySelectorAll(".friend-name, .post-heading");
	            if (existingItems.length > 0) {
	                let dontAddToList = false;
	                existingItems.forEach((existingItem) => {
	                    if (node && existingItem.textContent === node.userName) {
	                        friendName.parentElement.remove(); // remove the li if the node that needs to be removed, is true aan de textcontent of the p
	                    }
	                    if (friendName.textContent === friend.userName) {
	                        dontAddToList = true;
	                    }
	                });
	                if (!dontAddToList) {
	                    addPostToFriendList(friendsUl, friend, nodeData);
	                }
	            } else {
	                ul.innerHTML = "";
	                addItemToList(ul, template, friend, nodeData);
	            }
	        });
	    } else {
	        ul.innerHTML = "";
	    }
	}

	addItemToList(ul, template, data) {

	}

	#fillFriendItem(element, friend, person) {
		const img = element.querySelector("img");
	    const name = element.querySelector("p");
	    const unfriendButton = element.querySelector(".unfriend-button");
	   	name.textContent = friend.userName;
	    img.src = friend.profileImage;
	    unfriendButton.addEventListener("click", () => {
	        person.removeFriend(friend, links);
	        unfriendButton.parentElement.remove();

	        resizeNodes(nodes);
	    });

	    return element;
	}

	#fillPostItem(element, post, person) {
		const img = element.querySelector("img");
	    img.src = post.image;
	    const heading = element.querySelector("h4");
	    heading.textContent = post.title;

	    const likeButton = element.querySelector(".like-button");
	    if (person.items.has(post.id)) {
	        likeButton.classList.add("active");
	    } else {
	        likeButton.classList.remove("active");
	    }
	    likeButton.addEventListener("click", (e) => {
	        if (person.items.has(post.id)) {
	            person.removeItemLink(post, links);
	            e.target.classList.remove("active");
	        } else {
	            nodeData.addItemLink(post, nodeData, links);
	            e.target.classList.add("active");
	        }
	    });

	    return element;
	}




}