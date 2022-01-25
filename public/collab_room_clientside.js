// var socketPath = window.location.pathname + "socket.io";
// var socket = io({path: socketPath});
const socket = io();


var canvas = document.getElementById("whiteboard");
var ctx = canvas.getContext('2d');
var prevX = 0,
currX = 0,
prevY = 0,
currY = 0;

var drawFlag = false;


// might want to update these when window is resized
canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.75;  // might want to make this value modular if we want to change the height of the header and footer



// maybe add in an init for the start stuff


// make getCoords find the current mouse position in relation to the canvas
canvas.addEventListener("mousedown", function (e) {getCoords(e, 'down')});
canvas.addEventListener("mouseup", function (e) {getCoords(e, 'up')});
canvas.addEventListener("mousemove", function (e) {getCoords(e, 'move')});

function draw() {
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.strokeStyle = "black"; // make this a var to change line colour
    ctx.lineWidth = "1px"; // make this a var to change line thickness
    ctx.stroke();
    ctx.closePath();
}   

function getCoords(e, action) {
    var x = e.clientX;
    var y = e.clientY;

    prevX = currX;
    prevY = currY;

    // gets the new x and y in relation to the canvas
    currX = x - canvas.offsetLeft;
    currY = y - canvas.offsetTop;


    // switch case allows for expansion later
    switch (action) {
        case 'down':
            drawFlag = true;
        break;

        case 'up':
            drawFlag = false;
            sendData(); // need to figure out when we want to send data, currently on line up
        break;

        case 'move':
            if (drawFlag) {
                draw();
            }
            break;
    }
}

// Get room fucntion which takes in the room name when we create it from the server, then loop through them all and when that room == location.pathname we have our room
const whiteboard = document.getElementById("whiteboard");

if (whiteboard != null) {
    let user = prompt("what is your name?");
    let roomName = getRoom();
    let data = {user: user, room: roomName}
    console.log("user", user);
    socket.emit("joined", (data));

}

function getRoom() {
    let path = location.pathname;
    let room = path.split("/")[2]
    return room;
}

function sendData() {
    var content = canvas.toDataURL();
    

    //Get room
    let room = getRoom();

    var data = {image: content, date: Date.now(), roomName: room};
    console.log("room in data", data.roomName)

    // not needed now
    // var jsonString = JSON.stringify(data);

    socket.emit("canvasUpdate", (data));
}

// this is to represent the current client design
var img = new Image;

// when update comes in 
socket.on("canvasUpdate", (data) => {
    img.onload = () => {ctx.drawImage(img, 0, 0);};
    img.src = data;
    ctx.drawImage(img, 0, 0);       // this brakes everything
});

socket.on("chatMessage", data => {
    console.log(data);
})