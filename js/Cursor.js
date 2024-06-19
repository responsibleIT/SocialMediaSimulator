export default class Cursor {

	constructor() {
		this.toolsMenu = document.getElementById('generalOptions');

		this.toolsMenu.addEventListener('input', (e) => {
			switch (e.target.value) {
				case 'select':
						canvasContainer.style.cursor = "url('images/select-cursor.png') 7 7, default";
					break;

				case 'add-person':
						canvasContainer.style.cursor = "url('images/add-person-cursor.png') 7 7, copy";
					break;

				case 'add-post':
						canvasContainer.style.cursor = "url('images/add-post-cursor.png') 7 7, copy";
					break;
			}
		});
	}
}

