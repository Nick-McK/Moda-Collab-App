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

var currentCanvas = createCanvas(2000,2000); // might want to adjust these sizes
var canvasCtx = currentCanvas.getContext("2d");
// might implement a recent date thing to make sure no out of date updates are distributed
var recentDate = new Date(2022, 01, 01);  // this date has already passed

var roomNo = 1;
var roomName = "room"+roomNo;

var objIdCounter = 0;   // need to find a way to make this room specific
// it breaks things if we add it in under io.on connection. It starts at 0 for each user, being the same accross the entire room


io.on('connection', (socket) => {
    console.log('a user connected at socket: ' + socket.id);
    connectedUsers.push(socket); // add connected clients socket id to list

    socket.join(roomName);

    if (io.sockets.adapter.rooms.get(roomName).size == 4) {
        roomNo++;
        roomName = "room"+roomNo;

        console.log("Creating room " + roomNo)
    }


    
    // Create an image object to store the most up to date design
    // var img = new Image;

    // When update comes in, update replace the serverside canvas context image with sent one and send out update to all connected users
    socket.on('canvasUpdate', (data) => {
        // img.onload = () => {canvasCtx.drawImage(img, 0, 0);}
        // img.src = data.image;


        // can probs remove this bc it only needs to be exe clientside
        switch (data.type) {
            case 'add':
            data.change.id = objIdCounter;
            socket.emit('idUpdate', data.change.id);
            objIdCounter++;
            break;
            case 'remove':

            break;
            case 'mod':
                
            break;
        }

        socket.broadcast.to(roomName).emit('canvasUpdate', data);

        // for (var i in connectedUsers) {
        //     // send up to date version of canvas
        //     if (connectedUsers[i] == socket) continue;   //Ignore if it is the user that sent the data
        //     connectedUsers[i].emit('canvasUpdate', currentCanvas);
        // }
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