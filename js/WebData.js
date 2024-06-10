export default class WebData {
    constructor() {
        // web api for battery level
        this.batteryPercentage = 0;
        this.getBatteryStatus();
        this.updateTime();
    }

    updateBatteryStatus(battery) {
        const level = document.getElementById('level');
        const batteryLevelDiv = document.getElementById('battery-level');

        const percentage = Math.round(battery.level * 100);
        level.textContent = percentage + '%';

        // Update the battery level div width and color
        batteryLevelDiv.style.width = percentage + '%';

        if (percentage > 50) {
            batteryLevelDiv.style.backgroundColor = 'green';
        } else if (percentage > 20) {
            batteryLevelDiv.style.backgroundColor = 'yellow';
        } else {
            batteryLevelDiv.style.backgroundColor = 'red';
        }
    }

    getBatteryStatus() {
        navigator.getBattery().then((battery) => {
            // Update the battery status initially when the promise resolves ...
            this.updateBatteryStatus(battery);

            // .. and for any subsequent updates.
            battery.onchargingchange = () => {
                this.updateBatteryStatus(battery);
            };

            battery.onlevelchange = () => {
                this.updateBatteryStatus(battery);
            };
        });
    }

    updateTime() {
        const updateTime = () => {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const timeString = `${hours}:${minutes}`;
            document.getElementById('time').textContent = timeString;
        }

        // Initial call to set the time right away
        updateTime();
        // Update the time every minute
        setInterval(updateTime, 60000);
    }
}

// Initialize the WebData class
new WebData();
