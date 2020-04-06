
const api = async (method, url, callBack, body = {}) => {
    method = method.toUpperCase();

    const options = {
        method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }

    if (method === "POST") options.body = body;

    const rawResponse = await fetch(url, options);
    callBack(await rawResponse.json());

}

const loadIpData = (ipadress) => {

    api("get", "/api/ip/" + ipadress, (json) => {
        console.log(json);

        if (json.status === "OK") {

            jumpTo(json.longitude, json.latitude, 10);
    
            addMarker(json.longitude, json.latitude);

            elDisplayIP.innerHTML = json.ip;
            elDisplayAdress.innerHTML = `
                <ul>
                    <li>${json.hostname}</li><br>
                    <li>${json.zipcode} ${json.city}</li>
                    <li>${json.region}</li>
                    <li>${json.country_short} - ${json.country_long}</li>
                </ul>`;

        } else {
            elDisplayAdress.innerHTML = `${json.status}<br><br>`;
        }

    })

}

function initMaps() {

    map = new OpenLayers.Map("basicMap", {
        units: 'meters',
        controls: [
            new OpenLayers.Control.Navigation()
        ],
    });
    const mapnik = new OpenLayers.Layer.OSM();
    map.addLayer(mapnik);
    
}

const elIpAdress = document.querySelector("[name=ipAdress]");
const elDisplayAdress = document.querySelector(".adress");
const elDisplayIP = document.querySelector(".displayIP");
const elForm = document.querySelector("form");

elForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loadIpData(elIpAdress.value);
    elDisplayIP.innerHTML = "";
    elDisplayAdress.innerHTML = `Wird geladen...<br><br>`;
})

window.onload = () => {

    api("get", "/api/myip", (json) => {
        loadIpData(json.ip);
    })

    initMaps();
    jumpTo(0, 0, 0);

}