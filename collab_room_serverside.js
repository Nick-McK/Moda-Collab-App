const express = require('express');     // initialise app to be a function handler that is given to a HTTP server
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const path = require('path');

// This is a server side canvas thing
const { createCanvas, loadImage, Image } = require('canvas');


const connectedUsers = [];
var loggedInUsers = [];

// this allows it to access the other files
app.use(express.static('../moda-collab-app'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/collab_room.html'));
});

var currentCanvas = createCanvas(1000,1000); // might want to adjust these sizes
var canvasCtx = currentCanvas.getContext("2d");
// might implement a recent date thing to make sure no out of date updates are distributed
var recentDate = new Date(2022, 01, 01);  // this date has already passed


io.on('connection', (socket) => {
    console.log('a user connected at socket: ' + socket.id);
    connectedUsers.push(socket); // add connected clients socket id to list

    // Create an image object to store the most up to date design
    var img = new Image;

    // When update comes in, update replace the serverside canvas context image with sent one and send out update to all connected users
    socket.on('canvasUpdate', (data) => {
        img.onload = () => {canvasCtx.drawImage(img, 0, 0);}
        img.src = data.image;
        for (var i in connectedUsers) {
            // send up to date version of canvas
            connectedUsers[i].emit('canvasUpdate', currentCanvas.toDataURL());
        }
    });
});

// http server listens on port 3000
server.listen(3000, () => {
    console.log('listening on *:3000');
});

// try to use this later, will be better for modularity
function updateRoom() {
    for (var i in connectedUsers) {
        // send up to date version of canvas
        connectedUsers[i].emit('canvasUpdate', currentCanvas.toDataURL());
    }
}

// updates all clients every 100ms
// setInterval(updateRoom, 100);