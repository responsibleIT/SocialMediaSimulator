import Person from "./Person.js";
import Post from "./Post.js";

export default class FileHandler {
	constructor() {

	}

	mapToArray(map) {
		const array = [];
		map.forEach(item => {
			const itemObject = {};
			Object.keys(item).forEach(key => {
				if (item[key] instanceof Map) {
					itemObject[key] = [];
					item[key].keys().forEach(mapItem => itemObject[key].push({id: mapItem, score: item[key].get(mapItem).score}));
				} else if (item[key] instanceof HTMLElement) {
					itemObject[key] = null;
				} else {
					itemObject[key] = item[key];
				}
			});
			array.push(itemObject);
		});
		return array;
	}

	export(nodes) {

		let filename = prompt('Give your network a name', '');

	    if (filename !== null) {

	    	const nodesArray = this.mapToArray(nodes);

	        const json = JSON.stringify(nodesArray);
	        const blob = new Blob([json], { type: "text/json" });
	        
	        const link = document.createElement("a");
	        link.download = `${filename}.sn-setup`;
	        link.href = window.URL.createObjectURL(blob);
	        link.target = '_blank';
	        link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

	        link.click();
	        link.remove();
	    }
	}

	import(nodes, links) {

		return new Promise((resolve) => {

			const input = document.createElement('input');
			input.type = 'file';
			input.accept = '.sn-setup';

			input.onchange = e => { 
			   	const file = e.target.files[0];

			   	const reader = new FileReader();
			   	reader.readAsText(file,'UTF-8');

			   	reader.onload = readerEvent => {
			    	const content = readerEvent.target.result;
			      	const array = JSON.parse(content);

			      	nodes.forEach(node => node.element.remove());

			      	nodes.clear();
			      	links.clear();

			      	array.forEach(item => {

			      		let node;

			      		if (item.label === 'Person') {
			      			node = new Person(item.id, "Person", item.x, item.y, { image: item.profileImage, username: item.userName });
			      		} else if (item.label === 'Social Media Post') {
			      			node = new Post(item.id, "Social Media Post", item.x, item.y, { title: item.title, postImage: item.image });
			      		}

			      		nodes.set(item.id, node);
			      	});

			      	nodes.forEach(node => {
			      		const nodeItem = array.find(item => item.id === node.id);

			      		if (node.label === 'Person') {
			      			nodeItem.friends.forEach(friend => {
			      				const friendNode = nodes.get(friend.id);
			      				node.addFriend(friendNode, links, friend.score);
			      			});
			      			nodeItem.items.forEach(item => {
			      				const itemNode = nodes.get(item.id);
			      				node.addItemLink(itemNode, node, links, item.score);
			      			});
			      			nodeItem.infoLinks.forEach(infoLink => {
			      				const infoLinkNode = nodes.get(infoLink.id);
			      				node.addInfoLink(infoLinkNode, node, links, item.score);
			      				
			      			});
			      		}

			      		node.draw();
			      	});

			      	resolve();
			   	}
			}

			input.click();
		});
	}
}