// var socketPath = window.location.pathname + "socket.io";
// var socket = io({path: socketPath});
const socket = io();

let canvas = new fabric.Canvas("whiteboard");
canvas.setHeight(window.outerHeight * 0.75);
canvas.setWidth(window.outerWidth);
canvas.backgroundColor = "#c9cecf";

// maybe add in an init for the start stuff
var recentObj;
var obj;
var colour = 'black';
var pt = 40;
var lineWidth = 1;
var fontFamily = "Times New Roman";

const ptInput = document.getElementById('ptSize');
ptInput.setAttribute('size', ptInput.getAttribute('placeholder').length);
ptInput.addEventListener('focusout', function () {
    pt = parseInt(ptInput.value);
    console.log(pt)
    if (canvas.getActiveObject()) {
        if (canvas.getActiveObject().get('type') == 'textbox') {
            canvas.getActiveObject().set('fontSize', pt);
            canvas.renderAll();
            canvas.fire('object:modified')

        }
    }
});

const lineWidthInput = document.getElementById('lineWidth');
lineWidthInput.setAttribute('size', lineWidthInput.getAttribute('placeholder').length);
lineWidthInput.addEventListener('focusout', function () {
    lineWidth = lineWidthInput.value;
    canvas.freeDrawingBrush.width = parseInt(lineWidth);
    console.log(lineWidth)
    if (canvas.getActiveObject()) {
        // not sure if line is a type but just in case
        if (canvas.getActiveObject().get('type') == 'path' || canvas.getActiveObject().get('type') == 'polyline' || canvas.getActiveObject().get('type') == 'line') 
            canvas.getActiveObject().set("strokeWidth", parseInt(lineWidth));
        canvas.renderAll();
        canvas.fire('object:modified')
    }
});

const fontFamilyInput = document.getElementById('font');
fontFamilyInput.addEventListener('change', function () {
    fontFamily = fontFamilyInput.value;
    if (canvas.getActiveObject()) {
        if (canvas.getActiveObject().get('type') == 'textbox') {
            canvas.getActiveObject().set('fontFamilty', fontFamily);
            canvas.renderAll();
            canvas.fire('object:modified')
        }
    }
});

function changeColour(col) {
    colour = col;
    canvas.freeDrawingBrush.color = colour;
    console.log(colour);
    if (canvas.getActiveObject()) {
        // not sure if line is a type but just in case
        if (canvas.getActiveObject().get('type') == 'path' || canvas.getActiveObject().get('type') == 'polyline' || canvas.getActiveObject().get('type') == 'line') 
            canvas.getActiveObject().set("stroke", colour);
        else 
            canvas.getActiveObject().set("fill", colour);
        canvas.renderAll();
        canvas.fire('object:modified')
    }
}

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
                fill:colour,
                width: 20,
                height: 20
            });
            break;
        case 'CIRCLE':
            obj = new fabric.Circle({
                left:100,
                top:100,
                fill:colour,
                radius: 20
            });
            break;
        case 'TRIANGLE':
            obj = new fabric.Triangle({
                left:100,
                top:100,
                fill:colour,
                width: 20,
                height: 20
            });
        break;
        case 'DRAW':

            canvas.isDrawingMode = !canvas.isDrawingMode;
            
            var drawFlag = false;
            var stack;

            // there might be a build up of listeners
            canvas.on("mouse:down", function () {
                drawFlag = true;
                stack = [];
            })
            canvas.on("mouse:move", function () {
                if (drawFlag)
                    stack.push(canvas.getPointer());
            })
            canvas.on("path:created", (e) => {sendPath(e, stack);
            console.log("eher")});
        break;
        case 'LINE':        //gonna work on setting the coords through user input
            obj = new fabric.Line([50, 10, 200, 150], {
                stroke: colour
            })
        break;
        case 'IMAGE':
            // Open Windows Explorer
            break;
        case 'TEXT':
            obj = new fabric.Textbox("Enter Text Here...", {
                left: 100, 
                top:100,
                fontSize: pt,
                fontFamily: fontFamily
            });
        break;
        default:
            break;
    }
    if (obj) {
        console.log("we have obk")
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
    obj = null;     // Without this, the removed line will be re-added on next time draw is selected
}

function sendPath(e, stack) {
    if (e) {
       recentObj = e;
       //   TO IMPLEMENT A LINE THICKNESS FOR FREE DRAW, ADD 'LINEWIDTH: LINEWIDTH VAR'
       socket.emit('canvasUpdate', {"change": {stack: stack, id: null, stroke: colour, lineWidth: lineWidth}, "type" : "add"});}
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
            } else if (data.change.type == 'line') {
                addObj = new fabric.Line([50, 10, 200, 150], {  //hardcoded coords for time being, not being sent through socket io
                    stroke: data.change.stroke,
                    id: data.change.id 
                });
            } else if (data.change.type == 'textbox') {
                addObj = new fabric.Textbox(data.change.text, {
                    fontSize: data.change.fontSize,
                    fontFamily: data.change.fontFamily,
                    left: data.change.left,
                    top: data.change.top,
                    id: data.change.id
                });
            } else {    // this should cover both path and polyline
                // on other clients, free drawing is recreated as a polyline
                canvas.isDrawingMode = true;

                // this is if we want other clients to create instance of path instead of polyline
                // var test = ["M"];
                // for (var i in data.change.stack) {
                //     console.log(data.change.stack[i]['x'])
                //     test.push(data.change.stack[i]['x'] + " " + data.change.stack[i]['y'] + " L")
                // }
                // test = test.join(' ');
                // test = test.slice(0, -1) + 'z';



                addObj = new fabric.Polyline(data.change.stack, {
                    strokeWidth: parseInt(data.change.lineWidth),
                    stroke: data.change.stroke,
                    strokeLineJoin: 'round',
                    strokeLineCap: 'round',
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
            console.log("mod")
            for (var i in canvas._objects) {
                if (canvas._objects[i].id == data.id) {
                    var oriObj = canvas._objects[i];
                    var newObj = data.change;
                    
                    oriObj.set("left", newObj.left);
                    oriObj.set("top", newObj.top);
                    oriObj.setCoords(); //this is needed, trust me


                    // future proofing, might need more
                    oriObj.set("fill", newObj.fill);
                    oriObj.set("width", newObj.width);
                    oriObj.set("height", newObj.height);
                    oriObj.set("scaleX", newObj.scaleX);
                    oriObj.set("scaleY", newObj.scaleY);
                    oriObj.set("angle", newObj.angle);
                    oriObj.set("stroke", newObj.stroke);
                    oriObj.set("strokeWidth", newObj.strokeWidth);
                    oriObj.set("text", newObj.text);
                    oriObj.set("fontSize", newObj.fontSize);
                    oriObj.set("fontFamily", newObj.fontFamily);
                    
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
}

socket.on('saveDesignResponse', (res) => {
    if (res)
        alert("Saved Design");
    else
        alert("error");
});

function deleteDesign() {
    socket.emit('canvasUpdate', {type: "deleteDesign"});
    canvas.remove(...canvas.getObjects());
    canvas.renderAll();
}

function loadDesign() {
    socket.emit('loadDesign', {name: "designTest.JSON"});   // need some kind of explorer here

}

socket.on('loadDesignResponse', (data) => {
    canvas.loadFromJSON(data);
});

// Below is code for buttons in footer
function importTemplate(template, dontEmit) {
    var source = "./public/assets/templates/blank-t-shirt.png"  //hardcoded for now
    fabric.Image.fromURL(source, function (img) {
        console.log(img)
        img.scaleToHeight(canvas.getHeight());
        if (!dontEmit) {
            socket.emit('importTemplate', "./public/assets/templates/blank-t-shirt.png")
        }
        console.log(img)
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
            top: canvas.getCenter().top,
            left: canvas.getCenter().left,
            originX: 'center',
            originY: 'center'
        });
        canvas.renderAll();
    })
}



socket.on('importTemplate', (data) => {
    importTemplate( "" , true); // figure out solution for the first param later
})