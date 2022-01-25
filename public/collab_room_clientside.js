// var socketPath = window.location.pathname + "socket.io";
// var socket = io({path: socketPath});
const socket = io();


let canvas = new fabric.Canvas("whiteboard");
canvas.setHeight(window.innerHeight * 0.75);
canvas.setWidth(window.innerWidth);
canvas.backgroundColor = "#c9cecf";

// maybe add in an init for the start stuff
var rectCounter = 0;
var recentObj;
var obj;

function changeTool(res) {
    console.log(res);
    switch (res) {
        case 'RECTANGLE':
            obj = new fabric.Rect({
                left:100,
                top:100,
                fill:'red',
                width: 20,
                height: 20
            });
            canvas.add(obj).renderAll();
            recentObj = obj;
            
            socket.emit('canvasUpdate', {"change": obj, "type" : "add"});
            break;
        case 'CIRCLE':
        case 'LINE':
            artCanvas.setFigure(res);
            artCanvas.setMode(ArtCanvas.Mode.FIGURE);
            break;
        
        case 'IMAGE':
            // Open Windows Explorer
            artCanvas.drawImage('/public/assets/icons/person.png');
            break;
        
        case 'CLEAR':
            artCanvas.clear();
            break;

        default:
            artCanvas.setMode(res);
            break;
    }
}


canvas.on('object:modified', function () {
    // for some reason id wouldn't carry over to server through "change" object
    socket.emit('canvasUpdate', {"change":canvas.getActiveObject(), "type": 'mod', "id": canvas.getActiveObject().id});
});

function deleteItem() {
    obj = canvas.getActiveObject();
    socket.emit('canvasUpdate', {'change' : obj.id, 'type': 'remove'});
    canvas.remove(obj);
}

// when update comes in 
socket.on('canvasUpdate', (data) => {

    switch (data.type) {
        case 'add':
            if (data.type = 'rect') {
                console.log(canvas._objects);
                var rect = new fabric.Rect({
                    left:data.change.left,
                    top:data.change.top,
                    fill:data.change.fill,
                    width: data.change.width,
                    height: data.change.height,
                    id: data.change.id
                });           
                canvas.add(rect);
            };

        break;
        case 'remove':
            for (var i in canvas._objects) {
                if (canvas._objects[i].id == data.change) {
                    canvas.remove(canvas._objects[i]);      //might need to change this to active Object
                }
            };
            
        break;
        case 'mod':
            console.log(data.change);
            for (var i in canvas._objects) {
                if (canvas._objects[i].id == data.id) {
                    var oriObj = canvas._objects[i];
                    var newObj = data.change;
                    oriObj.left = newObj.left;
                    oriObj.top = newObj.top;
                    oriObj.setCoords(); //this is needed, trust me

                    // future proofing, might need more
                    oriObj.fill = newObj.fill;
                    oriObj.width = newObj.width;
                    oriObj.height = newObj.height;
                    oriObj.scaleX = newObj.scaleX;
                    oriObj.scaleY = newObj.scaleY;
                }
            }
        break;
    }
   canvas.renderAll();
});

// this is server assigned id given when client creates obj
socket.on('idUpdate', (data) => {
    recentObj.id = data;
    console.log(data);
});

// Get room fucntion which takes in the room name when we create it from the server, then loop through them all and when that room == location.pathname we have our room
const whiteboard = document.getElementById("whiteboard");

if (whiteboard != null) {
    let user = prompt("what is your name?");
    let roomName = getRoom();
    let data = {user: user, room: roomName}
    console.log("user", user);
    socket.emit("joined", (data));

}

// NEED TO COMBINE THIS
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
