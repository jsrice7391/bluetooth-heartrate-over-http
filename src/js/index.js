import '../css/index.scss';

class BTHRClient {
    constructor() {
        let W3CWebSocket = require('websocket').w3cwebsocket;
        this.client = new W3CWebSocket('ws://192.168.1.23:3000/bthr', 'bthr-protocol');

        this.client.onerror = () => {
            console.error('Connection Error');
        };

        this.client.onopen = () => {
            console.log(`BTHR Connection Opened`);
        };

        this.client.onclose = () => {
            console.log('BTHR Connection Closed');
        };

        this.client.onmessage = (e) => {
            if (typeof e.data === 'string') {
                let message;
                try {
                    message = JSON.parse(e.data);
                } catch (e) {
                    console.error(`Error when parsing WebSocket message:\n${e}`);
                    return;
                }

                switch (message.method) {
                    case "updateHR":
                        console.log(`New HR: ${message.data.hr}`);
                        break;
                    default:
                        console.warn(`Received message with unknown method!`);
                        break;
                }
            } else {
                console.warn(`Received message with unknown data!`);
            }
        };

        this.toggleSendingButton = document.querySelector(".toggleSendingButton");
        this.toggleSendingButton.addEventListener("click", (e) => {
            this.toggleSendingButtonOnClick();
        });


        this.latestHeartRateValues = [];
        this.latestHeartRateValue = undefined;
        this.heartRateValueEl = document.querySelector(".heartRateValue");

        this.initComplete = true;
    }

    updateHeartRateValue(newValue) {
        this.latestHeartRateValue = newValue;

        this.latestHeartRateValues.push(this.latestHeartRateValue / 2);
        this.latestHeartRateValues = this.latestHeartRateValues.slice(-200);
        this.heartRateValueEl.innerHTML = this.latestHeartRateValue;
    }

    toggleSendingButtonOnClick() {
        const connect = async props => {
            console.clear()
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['heart_rate'] }],
                acceptAllDevices: false,
            })
            console.log(`%c\n👩🏼‍⚕️`, 'font-size: 82px;', 'Starting HR...\n\n')
            const server = await device.gatt.connect(),
                service = await server.getPrimaryService('heart_rate'),
                char = await service.getCharacteristic('heart_rate_measurement')

            char.oncharacteristicvaluechanged = props.onChange;
            char.startNotifications();
            return char;
        }

        connect({
            onChange: e => {
                const val = e.target.value.getInt8(1)
                this.updateHeartRateValue(val);
            },
        }).catch(e => console.warn(Error(e)))
    }
}

let bthrClient = new BTHRClient();