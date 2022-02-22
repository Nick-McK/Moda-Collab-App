// var socketPath = window.location.pathname + "socket.io";
// var socket = io({path: socketPath});
const socket = io();

var canvasHeight = 4000;
var canvasWidth = 4000;

// Create the canvas and set its attributes
let canvas = new fabric.Canvas("whiteboard");
canvas.setHeight(window.innerHeight * 0.75);
canvas.setWidth(window.outerWidth); // this can ignore console being open
canvas.backgroundColor = "#c9cecf";
let r = new fabric.Rect({       // don't need this, just for debugging panning and zooming area
    left:0,
    top:0,
    width:canvasWidth, //> 4k res
    height:canvasHeight,
    selectable: false,
    stroke: "black",
    strokeWidth: 5,
    fill: "rgba(0,0,0,0)",
    hoverCursor: "default"
});

canvas.add(r);

// maybe add in an init for the start stuff
var recentObj;
var obj;



// Initialise variables for changable attributes
var colour = 'black';
var pt = 40;
var lineWidth = 1;
var fontFamily = "Times New Roman";
var panning = false;


const ptInput = document.getElementById('ptSize');      // Gets ptSize input box element
ptInput.setAttribute('size', ptInput.getAttribute('placeholder').length);   // Modifies the size of the inputbox to fit the placeholder text
// Event listeners for either a focus out (selecting the desired obj) or enter
ptInput.addEventListener('focusout', function () {
    setPtSize();
});
ptInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        setPtSize();
    }
});

// Sets the ptSize of future and selected text to global ptSize value
function setPtSize() {
    pt = parseInt(ptInput.value);
    console.log(pt)
    if (canvas.getActiveObject()) {
        if (canvas.getActiveObject().get('type') == 'textbox') {
            canvas.getActiveObject().set('fontSize', pt);
            canvas.renderAll();
            canvas.fire('object:modified')

        }
    }
}

const lineWidthInput = document.getElementById('lineWidth');    // Gets lineWidth input box element
lineWidthInput.setAttribute('size', lineWidthInput.getAttribute('placeholder').length);
// Event listeners for either a focus out (selecting the desired obj) or enter
lineWidthInput.addEventListener('focusout', function () {
    setLineWidth();
});
lineWidthInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        setLineWidth();
    }
});

// Sets the lineWidth of futute and selected lines to global lineWidth value
function setLineWidth() {
    lineWidth = lineWidthInput.value;
    canvas.freeDrawingBrush.width = parseInt(lineWidth);
    console.log(canvas.getActiveObject())
    console.log(lineWidth)
    if (canvas.getActiveObject()) {
        // not sure if line is a type but just in case
        if (canvas.getActiveObject().get('type') == 'path' || canvas.getActiveObject().get('type') == 'polyline' || canvas.getActiveObject().get('type') == 'line') 
            canvas.getActiveObject().set("strokeWidth", parseInt(lineWidth));
        canvas.renderAll();
        canvas.fire('object:modified')
    }
}

const fontFamilyInput = document.getElementById('font');    // Gets font selection box element
// Event listener for change in selection box value
fontFamilyInput.addEventListener('change', function () {
    fontFamily = fontFamilyInput.value;
    if (canvas.getActiveObject()) {
        if (canvas.getActiveObject().get('type') == 'textbox') {
            canvas.getActiveObject().set('fontFamily', fontFamily);
            canvas.renderAll();
            canvas.fire('object:modified')
        }
    }
});

// This is triggered buy an onclick event when selecting any of the colours
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

// Uses a switch case to perform actions for each tool, triggered by onclick when selecting any tool
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
            // had to make the listeners global because more would be made each time this section is called
            panning = false;
            canvas.selection = true;
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
        case 'PAN':
            canvas.isDrawingMode = false;
            panning = !panning;
            canvas.selection = !canvas.selection;

            if (panning) {
                r.hoverCursor = "move";
            } else {
                r.hoverCursor = "default";
            }
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


// this is for free drawing
var drawFlag = false;
var stack;  // Stack of points for the line to be recreated on other clients

canvas.on("mouse:down", function (opt) {
    if (canvas.isDrawingMode) {
        if (!checkPointerInArea()) {
            canvas.isDrawingMode = false;
        } else {
            drawFlag = true;
        }
        stack = [];
    } else if (panning) { // this is for panning, refer the mouse:wheel listener for reference to tutorial
        this.isDragging = true;
        // this.selection = false;
        this.lastPosX = opt.e.clientX;
        this.lastPosY = opt.e.clientY;
    }
});
canvas.on("mouse:move", function (opt) {
    if (drawFlag) {  // this pushed line points to a stack when drawing
        if (checkPointerInArea()) {
            stack.push(canvas.getPointer());
        } else if (canvas._isCurrentlyDrawing){
            
            
            console.log("here");
            canvas.isDrawingMode = false;

            canvas.fire("path:created");
            canvas.freeDrawingBrush.onMouseUp();

            
        }
        console.log("x", canvas.getPointer().x, "y", canvas.getPointer().y);
    }
    else if (this.isDragging && !canvas.getActiveObject()) { // this is for panning, refer the mouse:wheel listener for reference to tutorial
        var zoom = canvas.getZoom();    //gets the current zoom of the client
        var e = opt.e;
        var view = this.viewportTransform;
        view[4] += e.clientX - this.lastPosX;   // this calculates the change to the x and y values of the viewport
        view[5] += e.clientY - this.lastPosY;

        if (limitZoom) {    // if the zoom has decided that it has zoomed as far out as possible
            console.log(widthHeightLimited);
            if (widthHeightLimited == "width") {
                view[4] = (canvas.getWidth()/2) - canvasWidth * zoom / 2;       //limit the viewport so no panning can be done
                if(view[5] > 0) {
                    view[5] = 0;
                } else if (view[5] < canvas.getHeight() - canvasHeight * zoom) {
                    console.log("here", view[5]);
                    view[5] = canvas.getHeight() - canvasHeight * zoom;
                }
            }
            if (widthHeightLimited == "height") {
                view[5] = (canvas.getHeight()/2) - canvasHeight * zoom / 2;
                if (view[4] > 0) {
                    view[4] = 0;
                } else if (view[4] < canvas.getWidth() - canvasWidth * zoom) {
                    view[4] = canvas.getWidth() - canvasWidth * zoom;
                }    
            }
        } else {
            // this handles blocking panning if the new viewport is to be outwith the predefined canvas area
            if (view[4] > 0) {
                view[4] = 0;
            } else if (view[4] < canvas.getWidth() - canvasWidth * zoom) {
                view[4] = canvas.getWidth() - canvasWidth * zoom;
            }
            if(view[5] > 0) {
                view[5] = 0;
            } else if (view[5] < canvas.getHeight() - canvasHeight * zoom) {
                view[5] = canvas.getHeight() - canvasHeight * zoom;
            }
        }
        console.log("y", view[5], "height", canvas.getHeight(), "canvasHeight",canvasHeight * zoom,"yO", canvas.getHeight() - canvasHeight * zoom);
        this.requestRenderAll();
        this.lastPosX = e.clientX;
        this.lastPosY = e.clientY;
    }
});
canvas.on("path:created", function (e) {
    console.log(e);
    sendPath(e, stack)    // send the 
});

function sendPath(e, stack) {
    if (e) {
       recentObj = e;
       socket.emit('canvasUpdate', {"change": {stack: stack, id: null, stroke: colour, lineWidth: lineWidth}, "type" : "add"});
    }
    // delete stack;    // Probably don't need this because stack is set to [] on mousedown
    drawFlag = false;
}
// end of free drawing code


canvas.on('mouse:up', function(opt) {
    if (panning) {
        this.setViewportTransform(this.viewportTransform);
        this.isDragging = false;
        // this.selection = true;
    }
});

// these concern when the user has zoomed out as far as allowed in regards to the canvas area
var limitZoom = false;
var limitValue = 0.1;   //initial value
var widthHeightLimited = null;

// Code for Zoom and Panning adapted from fabricjs.com tutorial: http://fabricjs.com/fabric-intro-part-5#pan_zoom
canvas.on("mouse:wheel", function(options) {
    var delta = options.e.deltaY;
    var zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > 20) zoom = 20;
    if (zoom < limitValue) {        // if user has zoomed out as far as allowed, set the zoom to the limited value
        if (limitZoom == true) {
            zoom = limitValue;
        }
    } 
    canvas.zoomToPoint({x: options.e.offsetX, y: options.e.offsetY}, zoom); // this adapts the zoom to zoom in relation to the location of the mouse pointer
    options.e.preventDefault();
    options.e.stopPropagation();

    var view = this.viewportTransform;
    if (zoom < canvas.getHeight() / canvasHeight) {     // if zoomed out as far as allowed, set the fixed limited zoom value and set the viewports accordingly
        limitZoom = true;
        limitValue = zoom;
        view[4] = (canvas.getWidth()/2) - canvasWidth * zoom / 2;
        view[5] = (canvas.getHeight()/2) - canvasHeight * zoom / 2;
        widthHeightLimited = "height";
    } else if (zoom < canvas.getWidth() / canvasWidth) {
        limitZoom = true;
        limitValue = zoom;
        view[4] = (canvas.getWidth()/2) - canvasWidth * zoom / 2;
        view[5] = (canvas.getHeight()/2) - canvasHeight * zoom / 2;
        widthHeightLimited = "width";
    } else {
        limitZoom = false;
        if (view[4] >= 0) {
            view[4] = 0;
        } else if (view[4] < canvas.getWidth() - canvasWidth * zoom) {
            view[4] = canvas.getWidth() - canvasWidth * zoom;
        }
        if (view[5] >= 0) {
            view[5] = 0;
        } else if (view[5] < canvas.getHeight() - canvasHeight * zoom) {
            view[5] = canvas.getHeight() - canvasHeight * zoom;
        }
    }
});

function checkPointerInArea() {
    if (canvas.getPointer().x >= 0 && canvas.getPointer().x <= canvasWidth && canvas.getPointer().y >= 0 && canvas.getPointer().y <= canvasHeight) 
        return true;
    else
        return false;
}



// Emits to canvas whenever a change is made to any object so other clients can update
canvas.on('object:modified', function () {
    // console.log(canvas.getActiveObject());
    // console.log(canvas.getActiveObjects());
    // var select = canvas.getActiveObject();
    // var objs = [];
    // for (var i in select._objects) {
    //     objs.push(select._objects[i]);
    // }

    // var ids = [];
    // for (var i in objs) {
    //     ids.push(objs[i].id);
    // }

    // for group move the individual objects top and left values bug out

    // for some reason id wouldn't carry over to server through "change" object
    socket.emit('canvasUpdate', {"change": canvas.getActiveObject(), "type": 'mod', "id": canvas.getActiveObject().id});
});


// This is for debugging
canvas.on('selection:created', function() {
    console.log(canvas.getActiveObject());
})

// dont worry about this
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

// This is triggered by an onclick on the delete button and also the delete key
function deleteItem() {
    obj = canvas.getActiveObjects();    // use Objects for group deletion
    var ids = obj.map(function (o) {return o.id});    //


    // send emit for each obj and remove it from current client
    for (var i in ids) {
        socket.emit('canvasUpdate', {'change' : ids[i], 'type': 'remove'});
        canvas.remove(obj[i]);
    }
        
    obj = null;     // Without this, the removed line will be re-added on next time draw is selected
    ids = null;
}

// deletes an object when delete key is pressed
document.onkeydown =  function (e) {        // This might cause issues for using the delete key anywhere else on the page
    if (e.key === 'Delete') {
        deleteItem();
    }
};


// This handles all canvas updates, e.g. any additions, deletions, modifications, templates or design loads
socket.on('canvasUpdate', (data) => {
    var addObj;     // Create variable to store object to be added (will have to be created from data given from server)
    console.log(data.change);   // Debugging

    // Use switch case to figure out what kind of update it is
    switch (data.type) {
        case 'add':
            // find type of object to be added and construct with necessary values, make sure to set id of obj
            if (data.change.type == 'rect') {
                addObj = new fabric.Rect({
                    left:data.change.left,
                    top:data.change.top,
                    fill:data.change.fill,
                    width: data.change.width,
                    height: data.change.height,
                    scaleX: data.change.scaleX,
                    scaleY: data.change.scaleY,
                    angle: data.change.angle,
                    id: data.change.id
                });           
            } else if (data.change.type == 'triangle') {
                addObj = new fabric.Triangle({
                    left: data.change.left,
                    top: data.change.top,
                    fill: data.change.fill,
                    width:  data.change.width,
                    height:  data.change.height,
                    scaleX: data.change.scaleX,
                    scaleY: data.change.scaleY,
                    angle: data.change.angle,
                    id: data.change.id
                });
            } else if (data.change.type == 'circle') {
                addObj = new fabric.Circle({
                    left: data.change.left,
                    top: data.change.top,
                    fill: data.change.fill,
                    radius: data.change.radius,
                    scaleX: data.change.scaleX,
                    scaleY: data.change.scaleY,
                    angle: data.change.angle,
                    id: data.change.id
                });
            } else if (data.change.type == 'line') {
                addObj = new fabric.Line([50, 10, 200, 150], {  //hardcoded coords for time being, not being sent through socket io
                    stroke: data.change.stroke,
                    lineWidth: data.change.lineWidth,
                    top: data.change.top,
                    left: data.change.left,
                    scaleX: data.change.scaleX,
                    scaleY: data.change.scaleY,
                    angle: data.change.angle,
                    id: data.change.id 
                });
            } else if (data.change.type == 'textbox') {
                addObj = new fabric.Textbox(data.change.text, {
                    fontSize: data.change.fontSize,
                    fontFamily: data.change.fontFamily,
                    fill: data.change.fill,
                    left: data.change.left,
                    top: data.change.top,
                    angle: data.change.angle,
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


                // Polyline works as a good constructor of the free draw
                // uses a stack of points from the free drawn line to recreate it
                if (data.change.stack) {
                    addObj = new fabric.Polyline(data.change.stack, {
                        strokeWidth: parseInt(data.change.lineWidth),
                        stroke: data.change.stroke,
                        strokeLineJoin: 'round',        // This is to avoid jagged edges especially at larger thicknesses
                        strokeLineCap: 'round',
                        fill: null,
                        angle: data.change.angle,
                        id: data.change.id
                    });
                } else {

                    // This is triggered when a user joins after a free drawn line is created

                    // This formats the path to have x: xCoord, y: yCoord such as a Polyline needs to be created
                    for (var i in data.change.path) {
                        delete data.change.path[i][0];
                        data.change.path[i] = {x: data.change.path[i][1], y: data.change.path[i][2]};
                    }

                    // this needs more attributes because there are more possible modifications when it has been placed before a user joins
                    addObj = new fabric.Polyline(data.change.path, {
                        strokeWidth: parseInt(data.change.strokeWidth),
                        stroke: data.change.stroke,
                        strokeLineJoin: 'round',        // This is to avoid jagged edges especially at larger thicknesses
                        strokeLineCap: 'round',
                        fill: null,
                        angle: data.change.angle,
                        scaleX: data.change.scaleX,
                        scaleY: data.change.scaleY,
                        height: data.change.height,
                        width: data.change.width,
                        left: data.change.left,
                        top: data.change.top,
                        id: data.change.id
                    });
                } 
                canvas.isDrawingMode = false;
            }
            console.log(addObj);
            canvas.add(addObj);
        break;

        case 'remove':
            // Loop through object to be deleted
            for (var i in data) {
                // Loop through objects on the canvas
                for (var j in canvas._objects) {
                    // Find the canvas objects that match ids to be deleted
                    if (canvas._objects[j].id == data[i]) {
                        canvas.remove(canvas._objects[j]);      //delete obj from canvas
                    }
                }
            }
        break;
        
        case 'mod':
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
            canvas.backgroundImage = false; // remove any possible background image
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

    console.log("pathname", getRoom());

    let data = {roomName: getRoom()}

    socket.emit("joined", (data));
}
let roomParticipants = new Array();
// Add in a button that you can click to bring up a window to show all users in a room 
socket.on("users", (roomData) => {
    console.log(roomData.usernames);
    const collabRoomHeader = document.getElementById("collabRoomHeader");
    for (let user of roomData.usernames) {
        if (!document.getElementById(user)) {       // makes sure there is no duplicates
            console.log("user is", user);

            let userDiv = document.createElement("div");
            let username = document.createTextNode(user);
            let userImg = document.createElement("img");

            userImg.src = "/assets/icons/person-inverted.png";
            userDiv.appendChild(userImg).src = "/assets/icons/person-inverted.png";
            userDiv.classList.add("participants");
            userDiv.id = user;
            
            userDiv.appendChild(username);
            
            collabRoomHeader.prepend(userDiv);
        }
    }
});

socket.on("userLeave", (data) => {
    console.log("username", data.username);
    document.getElementById(data.username).remove();
})

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

// Emit to server design JSON data to be stored in a file for saving
function saveDesign() {
    //socket.emit('saveDesign', {design: JSON.stringify(canvas), thumbnail: canvas.toDataURL({format: 'jpeg'})});
    //var win = window.open();
    //win.document.write('<iframe src="' + canvas.toDataURL({format: 'jpeg'})  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>'); // this gives a preview of the image, can be commented out if needs be
    let designName = prompt("Name your deisgn");
    designName.trim();
    if(designName.length > 0){
        socket.emit('saveDesign', {design: JSON.stringify(canvas), thumbnail: canvas.toDataURL({format: 'jpeg'})}, designName);
    }
    
    // socket.emit('saveDesign', {design: JSON.stringify(canvas), thumbnail: canvas.toDataURL({format: 'jpeg', left:"0", top: "0", height:canvasHeight, width: canvasWidth})});    // the parameters other than format do not work currently
    var win = window.open();
    win.document.write('<iframe src="' + canvas.toDataURL({format: 'jpeg'})  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>'); // this gives a preview of the image, can be commented out if needs be
}

// Recieves alert on success of save
socket.on('saveDesignResponse', (res) => {
    if (res)
        alert("Saved Design");
    else
        alert("error");
});

// Deletes all objects on canvas and sends emit telling other clients to do so as well
function deleteDesign() {
    socket.emit('canvasUpdate', {type: "deleteDesign"});
    canvas.remove(...canvas.getObjects());
    canvas.backgroundImage = false; // remove any possible background image
    canvas.renderAll();
}


let recordedName = [];
// Sends to the server asking for data of hardcoded design
function loadDesign() {
    socket.emit('getDesignNames');
    socket.on('retrieveDesignNames', (names) => {
        console.log(names);
        names.forEach((name) => {
        
            let currentName = document.createElement("div");
            let nameBut = document.createElement("button");
            nameBut.innerHTML = name;
            nameBut.onclick = () => {
                document.getElementById('load').style.display = "none";
                socket.emit('loadDesign', name);
            }
            if(!recordedName.includes(name)){
                currentName.appendChild(nameBut);
                document.getElementById("load").appendChild(currentName);
            }
            recordedName.push(name);
        });
        document.getElementById('load').style.display = "grid";
    });
    //socket.emit('loadDesign', {name: "designTest.JSON"});   // need some kind of explorer here
}

// Server responds with JSON design data, load it onto canvas
socket.on('loadDesignResponse', (res) => {
    if(res == "noDesign"){
        prompt("You have no saved designs to load");
    }
});
// End of header code


// Below is code for buttons in footer
// Get template image and format it as canvas background image, send emit to ell other client to do so
function importTemplate(template, dontEmit) {
    var source = "../public/assets/templates/blank-t-shirt (1).png"  //hardcoded for now
    fabric.Image.fromURL(source, function (img) {
        // Scale to height (means it works better on landscape resolutions)
        img.scaleToWidth(canvas.getWidth());

        // The don't emit thing will be implemented later
        if (!dontEmit) {
            socket.emit('importTemplate', source)
        }

        // Center the template and set at background image
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
            top: canvas.getHeight()*2,
            left: canvas.getWidth()-(canvas.getWidth()*0.2),
            originX: 'center',
            originY: 'center'
        });

        canvas.renderAll();
    })
}


socket.on('importTemplate', (data) => {
    importTemplate( "" , true); // figure out solution for the first param later
})

function leaveRoom() {
    socket.emit("leaveRoom");
    window.location.href = "/home";
}