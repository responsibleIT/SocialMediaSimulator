const toolsMenu = document.getElementById('generalOptions');
//const canvasContainer = document.getElementById('canvasContainer');

toolsMenu.addEventListener('input', (e) => {
	switch (e.target.value) {
		case 'select':
				canvasContainer.style.cursor = "url('../images/Select-cursor.png') 7 7, default";
			break;

		case 'add-person':
				canvasContainer.style.cursor = "url('../images/Add-person-cursor.png') 7 7, copy";
			break;

		case 'add-post':
				canvasContainer.style.cursor = "url('../images/Add-post-cursor.png') 7 7, copy";
			break;
	}
});

