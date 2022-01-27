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
    // Disable draw if other tool is selected
    if (res != 'DRAW') {
        canvas.isDrawingMode = false;
    }

    switch (res) {
        case 'RECTANGLE':
            obj = new fabric.Rect({
                left:100,
                top:100,
                fill:'red',
                width: 20,
                height: 20
            });
            break;
        case 'CIRCLE':
            obj = new fabric.Circle({
                left:100,
                top:100,
                fill:'red',
                radius: 20
            });
            break;
        case 'TRIANGLE':
            obj = new fabric.Triangle({
                left:100,
                top:100,
                fill:'red',
                width: 20,
                height: 20
            });
        break;
        case 'DRAW':
            canvas.isDrawingMode = !canvas.isDrawingMode;
            
            var drawFlag = false;
            var stack;

            canvas.on("mouse:down", function () {
                drawFlag = true;
                stack = [];
            })
            canvas.on("mouse:move", function () {
                if (drawFlag)
                    stack.push(canvas.getPointer());
            })
            canvas.on("path:created", (e) => sendPath(e, stack));
        break;
        case 'LINE':
            break;
        
        case 'IMAGE':
            // Open Windows Explorer
            break;
        
        default:
            break;
    }
    if (obj) {
        canvas.add(obj).renderAll();
        recentObj = obj;
        socket.emit('canvasUpdate', {"change": obj, "type" : "add"});
    }
}

canvas.on('selection:created', function() {
    console.log(this._objects[0]);
})

canvas.on('object:modified', function () {
    // for some reason id wouldn't carry over to server through "change" object
    socket.emit('canvasUpdate', {"change":canvas.getActiveObject(), "type": 'mod', "id": canvas.getActiveObject().id});
});

function deleteItem() {
    obj = canvas.getActiveObject();
    socket.emit('canvasUpdate', {'change' : obj.id, 'type': 'remove'});
    canvas.remove(obj);
}

function sendPath(e, stack) {
    if (e) {
       recentObj = e;
       socket.emit('canvasUpdate', {"change": {stack: stack, id: null}, "type" : "add"});}
       delete stack;
       drawFlag = false;
}

// when update comes in 
socket.on('canvasUpdate', (data) => {
    var addObj;
    console.log(data.change);
    switch (data.type) {
        case 'add':
            if (data.change.type == 'rect') {
                addObj = new fabric.Rect({
                    left:data.change.left,
                    top:data.change.top,
                    fill:data.change.fill,
                    width: data.change.width,
                    height: data.change.height,
                    id: data.change.id
                });           
            } else if (data.change.type == 'triangle') {
                addObj = new fabric.Triangle({
                    left: data.change.left,
                    top: data.change.top,
                    fill: data.change.fill,
                    width:  data.change.width,
                    height:  data.change.height,
                    id: data.change.id
                });
            } else if (data.change.type == 'circle') {
                addObj = new fabric.Circle({
                    left: data.change.left,
                    top: data.change.top,
                    fill: data.change.fill,
                    radius: data.change.radius,
                    id: data.change.id
                });
            } else {    // this should cover both path and polyline
                // on other clients, free drawing is recreated as a polyline
                canvas.isDrawingMode = true;
                addObj = new fabric.Polyline(data.change.stack, {
                    stroke: 'black',
                    fill: null,
                    id: data.change.id
                });
                canvas.isDrawingMode = false;
            }
            console.log(addObj)
            canvas.add(addObj);
        break;
        case 'remove':
            for (var i in canvas._objects) {
                if (canvas._objects[i].id == data.change) {
                    canvas.remove(canvas._objects[i]);      //might need to change this to active Object
                }
            };
            
        break;
        case 'mod':
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
                    oriObj.angle = newObj.angle;
                }
            }
        break;
        case 'deleteDesign':
            canvas.remove(...canvas.getObjects());
            canvas.renderAll();
        break;
    }
   canvas.renderAll();
});

// this is server assigned id given when client creates obj
socket.on('idUpdate', (data) => {
    if (recentObj.path)         // this might've broken some stuff
        recentObj.path.id = data;
    else 
        recentObj.id = data;
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
    //Get room
    let room = getRoom();

    var data = {date: Date.now(), roomName: room};
    console.log("room in data", data.roomName)

    socket.emit("canvasUpdate", (data));
}

socket.on("chatMessage", data => {
    console.log(data);
})



// Below is the code pertaining to the buttons in the header
function saveDesign() {
    socket.emit('saveDesign', {design: JSON.stringify(canvas)})
    socket.on('saveDesignResponse', (res) => {
        if (res)
            alert("Saved Design");
        else
            alert("error");
    });
}


function deleteDesign() {
    socket.emit('canvasUpdate', {type: "deleteDesign"});
    canvas.remove(...canvas.getObjects());
    canvas.renderAll();
}

function loadDesign() {
    socket.emit('loadDesign', {name: "designTest.JSON"});   // need some kind of explorer here
    socket.on('loadDesignResponse', (data) => {
        canvas.loadFromJSON(data);
    });
}