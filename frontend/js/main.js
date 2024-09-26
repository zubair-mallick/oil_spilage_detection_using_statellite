// Initialize Leaflet Map
const map = L.map('map').setView([9.952936666666666, 76.28193333333334], 10);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Object to hold markers by MMSI
const markers = {};

// Define custom ship icon using an SVG file
const shipIcon = L.icon({
    iconUrl: 'ship.svg', // Replace with the actual path to your SVG file
    iconSize: [40, 60], // Size of the icon (width, height)
    iconAnchor: [15, 30], // Point of the icon which will correspond to marker's location
    popupAnchor: [0, -30] // Point from which the popup should open relative to the iconAnchor
});

// Function to add or update marker on the map
function updateMarker(mmsi, latitude, longitude, shipName) {
    // If the marker doesn't exist, create it
    if (!markers[mmsi]) {
        markers[mmsi] = L.marker([latitude, longitude], { icon: shipIcon })
            .addTo(map)
            .bindPopup(shipName) // Bind ship name to the marker popup
            .on('click', function () {
                // On marker click, center the map on this marker and zoom in
                map.setView([latitude, longitude], 12); // Change zoom level as needed
                this.openPopup(); // Open popup when marker is clicked
            })
            // .openPopup(); // Open popup for the newly created marker
    } else {
        // Otherwise, update the marker's position
        markers[mmsi].setLatLng([latitude, longitude]);
        markers[mmsi].setPopupContent(shipName); // Update the popup content
    }
}

// Establish WebSocket connection to the backend server
const socket = new WebSocket('ws://localhost:8080');

// Get the list element where AIS data will be displayed
const aisDataList = document.getElementById('ais-data-list');

// When the connection is opened
socket.onopen = function () {
    console.log("Connected to backend WebSocket server.");
};

// When a message is received from the server
socket.onmessage = function (event) {
    const aisMessage = JSON.parse(event.data);
    console.log("Received AIS Message:", aisMessage);

    const latitude = aisMessage.MetaData.latitude;
    const longitude = aisMessage.MetaData.longitude;
    const mmsi = aisMessage.MetaData.MMSI; // Unique identifier for the ship
    const shipName = aisMessage.MetaData.ShipName;

    // Update marker on the map using latitude and longitude
    updateMarker(mmsi, latitude, longitude, shipName);

    // Create a new list item element for data display
   
};

// When the connection is closed
socket.onclose = function () {
    console.log("WebSocket connection closed.");
};

// Handle WebSocket errors
socket.onerror = function (error) {
    console.error("WebSocket error:", error);
};
