import dotenv from 'dotenv';
import WebSocket, { WebSocketServer } from 'ws';
import http from 'http'; // Import http module for WebSocket server creation

// Load environment variables from .env file
dotenv.config();

// Create an HTTP server to handle the WebSocket handshake and set CORS headers
const server = http.createServer((req, res) => {
    // Allow all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Respond to requests
    res.end();
});

// Create WebSocket server for the frontend
const frontendSocketServer = new WebSocketServer({ server });

// Set up a connection to the AIS WebSocket stream
const aisSocket = new WebSocket("wss://stream.aisstream.io/v0/stream");

let frontendClients = [];

// Establish AIS WebSocket connection
aisSocket.on('open', () => {
    const subscriptionMessage = {
        Apikey: process.env.AIS_API_KEY, // API key from .env file
        "BoundingBoxes": [[[35.508700, 68.176645], [6.746780, 97.395560]]]
    };

    // Send subscription message to AIS WebSocket
    aisSocket.send(JSON.stringify(subscriptionMessage));
    console.log("WebSocket connection opened and subscription message sent.");
});

// Handle incoming AIS data and send to frontend
aisSocket.on('message', (data) => {
    const aisMessage = JSON.parse(data);
    console.log("Received AIS Message:", aisMessage);

    // Forward AIS data to all connected frontend clients
    frontendClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(aisMessage));
        }
    });
});

// Handle AIS WebSocket close event
aisSocket.on('close', () => {
    console.log("AIS WebSocket connection closed.");
});

// Handle AIS WebSocket errors
aisSocket.on('error', (error) => {
    console.error("WebSocket error:", error);
});

// Handle new WebSocket connections from the frontend
frontendSocketServer.on('connection', (socket) => {
    console.log("Frontend WebSocket connection established.");
    frontendClients.push(socket);

    // Handle frontend client disconnection
    socket.on('close', () => {
        frontendClients = frontendClients.filter(client => client !== socket);
        console.log("Frontend WebSocket connection closed.");
    });

    // Handle frontend WebSocket errors
    socket.on('error', (error) => {
        console.error("Frontend WebSocket error:", error);
    });
});

// Start the HTTP server
server.listen(8080, () => {
    console.log("HTTP server is running and listening for WebSocket connections on port 8080.");
});
