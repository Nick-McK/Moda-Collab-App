const socket = io();        // Initialise socket connection

// Canvas attributes
var canvasHeight = 4000;
var canvasWidth = 4000;
var backgroundColor = "#c9cecf"

// Global for holding objects
var obj;
var recentlySelected;   // stores the most recently selected obj (or objects if group select is used)
var newImg;

// Global for tracking tool usage
var panning = false;
var straightLineDraw = {toggled: false, isDrawing: false};
var brushType;  // To track logic for brush switching

// Undo/Redo stack
var undoStack = [];
var redoStack = [];

// Global var for normal and selected colour of the tool buttons
// May need to manually change the starting colour in the CSS
var normalToolColour = "darkgrey";
var selectedToolColour = "grey";

// Global for object attributes
var colour = 'black';
var pt = 500;
var lineWidth = 10;
var fontFamily = "Times New Roman";


// Create the canvas and set its attributes
let canvas = new fabric.Canvas("whiteboard");
canvas.setHeight(window.innerHeight * 0.75);
canvas.setWidth(window.outerWidth);
canvas.backgroundColor = backgroundColor;

// Create Rect r to show boundaries of canvas area, give it no fill, not selectable, and a DONTDELETE id
let r = new fabric.Rect({ 
    left:0,
    top:0,
    width:canvasWidth, //> 4k res
    height:canvasHeight,
    selectable: false,
    stroke: "black",
    strokeWidth: 5,
    fill: "rgba(0,0,0,0)",
    hoverCursor: "default",
    erasable: false,
    id: "DONTDELETE"
});
canvas.add(r);  // Add to canvas


// When the window is resized, recalculate the size of the canvas in relation to the window
window.addEventListener('resize', () => {
    setTimeout(() => {
    // Set new size of canvas element
    canvas.setHeight(window.innerHeight * 0.75);
    canvas.setWidth(window.outerWidth);
    
    // Reset viewprot to 0,0
    // Re-calculate the limit values for zooming
    var view = canvas.viewportTransform;
    limitZoom = false;
    if (canvas.getHeight()/canvasHeight < canvas.getWidth() / canvasWidth) {
        limitValue = canvas.getWidth()/canvasWidth;
        widthHeightLimited = "width";
    } else {
        limitValue = canvas.getHeight()/canvasHeight;
        widthHeightLimited = "height";
    }    
    view[4] = 0;
    view[5] = 0;
    canvas.setZoom(1);
    }, 100);     // Set timeout to 100ms to make sure change can register properly
});



// Allows user to modify font size
const ptInput = document.getElementById('ptSize');      // Gets ptSize input box element
ptInput.setAttribute('size', ptInput.getAttribute('placeholder').length);   // Modifies the size of the inputbox to fit the placeholder text
ptInput.addEventListener('onfocus', function () {recentlySelected = canvas.getActiveObjects();});   // takes in the selected objects when the value is being changed
ptInput.addEventListener('change', function() {setPtSize(recentlySelected);});  // when value is changed, passed the selected objects to the pt size change function

// Sets the ptSize of future and selected text to global ptSize value
function setPtSize(objects) {
    pt = parseInt(ptInput.value);  // Update global var
    if (objects) {
        for (var i of objects) {
            if (i.get('type') == 'textbox') {
                constructForUndoStack({id: i.id, fontSize: i.fontSize})    // Send ptSize before change to the undo stack
                i.set('fontSize', pt);
                canvas.renderAll();
                canvas.fire('object:modified', {target:i});
            }
        }
    }
    recentlySelected = [];
}


// Allows user to modify line size
const lineWidthInput = document.getElementById('lineWidth');    // Gets lineWidth input box element
lineWidthInput.setAttribute('size', lineWidthInput.getAttribute('placeholder').length);
lineWidthInput.addEventListener('onfocus', function () {recentlySelected = canvas.getActiveObjects();});   // takes in the selected objects when the value is being changed
lineWidthInput.addEventListener('change', function () {setLineWidth(recentlySelected);});   // when value is changed, passed the selected object to the line width change funciton

// Sets the lineWidth of future and selected lines to global lineWidth value
function setLineWidth(objects) {
    lineWidth = parseInt(lineWidthInput.value);  // Update global var
    canvas.freeDrawingBrush.width = parseInt(lineWidth);    // set brush to entered width
    if (objects) {
        for (var i of objects) {
            if (i.get('type') == 'path' || i.get('type') == 'line') {  // Check that the object is actually a line (path)
                constructForUndoStack({id: i.id, strokeWidth: i.strokeWidth})    // Send lineWidth before change to the undo stack
                i.set("strokeWidth", parseInt(lineWidth));
                canvas.renderAll();
                canvas.fire('object:modified', {target:i});
            }
        }
    }
    recentlySelected = [];
}

// Allows user to modify font family
const fontFamilyInput = document.getElementById('font');    // Gets font selection box element
fontFamilyInput.addEventListener('onfocus', function () {recentlySelected = canvas.getActiveObjects();});   // takes in the selected objects when the value is being changed
fontFamilyInput.addEventListener('change', function () {setFontFamily(recentlySelected)});

// Sets the fontFamily of future and selected textboxes to global fontFamily value
function setFontFamily(objects) {
    fontFamily = fontFamilyInput.value;  // Update global var
    if (objects) {
        for (var i of objects) {
            if (i.get('type') == 'textbox') {
                constructForUndoStack({id: i.id, fontFamily: i.fontFamily})    // Send font before change to the undo stack
                i.set('fontFamily', fontFamily);
                canvas.renderAll();
                canvas.fire('object:modified', {target : i});
            }
        } 
    }
    recentlySelected = [];
}


// Allows users to modify colour
const colourInput = document.getElementById('colourSelect');
colourInput.addEventListener('onfocus', function () {recentlySelected = canvas.getActiveObjects();});   // takes in the selected objects when the value is being changed
colourInput.addEventListener('change', function () {changeColour(recentlySelected)});

// This is triggered buy an chnage event when selecting any of the colours
function changeColour(objects) {
    colour = colourInput.value;  // Update global var
    canvas.freeDrawingBrush.color = colour;     // set brush to entered colour
    if (objects) {
        for (var i of objects) {

            if (i.get('type') == 'path' || i.get('type') == 'line')  {  // since line types have the unique "stroke" property for colour, set that
                constructForUndoStack({id: i.id, stroke: i.stroke})    // Send the before colour change instance of the obj to the undo stack
                i.set("stroke", colour);
            }
            else {
                constructForUndoStack({id: i.id, fill: i.fill})    // Send the before colour change instance of the obj to the undo stack
                i.set("fill", colour);  // Otherwise, set fill as normal
            }
            canvas.renderAll();
            canvas.fire('object:modified', {target : i});
        }
    }
    recentlySelected = [];
}


// Allows users to modify the colour of the background
const bgColourInput = document.getElementById('bgColourSelect');
// Don't need an onfocus event as there are no objects being effected here
bgColourInput.addEventListener('change', function () {changeBgColour()});

// This is triggered buy an change event when selecting any of the colours
function changeBgColour() {
    backgroundColor = bgColourInput.value;  // Update global var
    undoStack.push({attributes : {bgColour : canvas.backgroundColor}, type:"bgColour"}); // Send bgColour before change to the undo stack
    canvas.backgroundColor = backgroundColor;
    canvas.renderAll();

    redoStack = [];      // Wipe the redoStack when normal move is made
    socket.emit('canvasUpdate', {"change": backgroundColor, "type": 'bgColour'});
}


// This is for debugging and getting recently selected object for attribute manipulation
canvas.on('selection:created', function() {
    recentlySelected = canvas.getActiveObjects();
    console.log(recentlySelected);
})

// Uses a switch case to perform actions for each tool, triggered by onclick when selecting any tool
function changeTool(res, imgUrl) {
    obj = null;     // set obj to null to prevent any errors where the previous value is being modified accidentally

    // Disable draw if other tool is selected, this is necessary
    if (res != 'DRAW') {
        canvas.isDrawingMode = false;
    }
    
    // Construct a base object depending on the item passed in
    switch (res) {
        case 'RECTANGLE':
            obj = new fabric.Rect({
                left:1000,
                top:1000,
                fill:colour,
                width: 1000,
                height: 1000
            });
            break;
        case 'CIRCLE':
            obj = new fabric.Circle({
                left:1000,
                top:1000,
                fill:colour,
                radius: 500
            });
            break;
        case 'TRIANGLE':
            obj = new fabric.Triangle({
                left:1000,
                top:1000,
                fill:colour,
                width: 1000,
                height: 1000
            });
        break;
        case 'LINE':    // Straight line is set by User selecting two points
            straightLineDraw.toggled = !straightLineDraw.toggled;

            showToggledTool("line");    // Set the visual feedback of the buttons to show that the line tool is in use
            togglePan(true);            // disable panning, but make sure that selection is still off
            canvas.selection = false;

            // Update the cursor to show that use has activated the straight line tool
            if (straightLineDraw.toggled) {
                r.set({hoverCursor: "crosshair"});
            } else {
                r.set({hoverCursor: "default"});
            };
        break;
        case 'IMAGE':
            // Need to use from URL and then create a callback to add img to canvas after it has loaded
            new fabric.Image.fromURL(imgUrl, function(oriImg){
                oriImg.set({
                    top: 1000,
                    left:1000
                });

                //Because of the callback, the code at the bottom of this section will not be able to add the img as it hadn't loaded at that point
                canvas.add(oriImg).renderAll();

                // Emit the addition to the server
                socket.emit('canvasUpdate', {"change": oriImg, "type" : "add"}, function(id) {
                    if (id != null) {       // if there is an id returned from the callback, give the image that id
                        oriImg.id = id;
                    }

                    redoStack = [];      // Wipe the redoStack when normal move is made

                    // push the change to the undo stack
                    undoStack.push({attributes: oriImg, type:"add"});
                });
                
            });
            break;
        case 'TEXT':
            obj = new fabric.Textbox("Enter Text Here...", {
                left: 1000, 
                top:1000,
                fontSize: pt,
                fontFamily: fontFamily
            });
        break;
        case 'PAN':
            showToggledTool("pan")  // set the visual feedback of the buttons to show that the pan tool is in use
            straightLineDraw.toggled = false;
            straightLineDraw.isDrawing = false;
            togglePan();
        break;
    }

    if (obj) {    // If this obj needs to be sent to the server from here
        redoStack = [];      // Wipe the redoStack when normal move is made
        canvas.add(obj).renderAll();        // Add obj and render canvas
        socket.emit('canvasUpdate', {"change": obj, "type" : "add"}, function(id) {
            if (id != null) {       // if there is an id returned from the callback, give the image that id
                obj.id = id;
            }
        });
        
        undoStack.push({attributes: obj, type:"add"});      // Push the addition to the undo stack
    }
}

// Sets all of the non-selected tools to the default colour, sets the one in use to a different colour
function showToggledTool(inUse) {
    var using = document.getElementById(inUse);

    if (using.style.backgroundColor == selectedToolColour) {        // If the tool is already in use, and the user is unselecting it, change the colour back to default
        using.style.backgroundColor = normalToolColour;
    } else {                                            // Otherwise, treat it as if the tool is being selected for use and set all other tools to default colour while setting the tool the different colour
        var allSelectableTools = ["pencil", "eraser", "pan", "line"];
        allSelectableTools.splice(allSelectableTools.indexOf(inUse), 1);
        for (var i of allSelectableTools) {
            document.getElementById(i).style.backgroundColor = normalToolColour;
        }
        using.style.backgroundColor = selectedToolColour;
    }
}

// Toggles pan, if it needs to be explicity set to false, set disable parameter to true
function togglePan(disable) {
    if (panning || disable) {
        panning = false;
        r.set({hoverCursor: "default"});
        canvas.selection = true;
    } else {
        panning = true;
        r.set({hoverCursor : "move"});
        canvas.freeDrawingBrush = false;
        canvas.selection = false;
    }
}

// Logic for switching brushes
function drawingToggle(brush) {
    if (canvas.isDrawingMode && brush == brushType) {   // if drawing is on and same brush has been selected, that means we are turning the free drawing off
        canvas.selection = true;
        canvas.isDrawingMode = false;
    } else if (canvas.isDrawingMode && brush != brushType) {    // This just means we are swtiching from pencil/brush
        // Allow freeDrawing to control this
    } else {                                            // Otherwise, we are turning on the free drawing
        canvas.isDrawingMode = true;
        togglePan(true);    // toggle pan, with parameter true to show that you want to disable it
        canvas.selection = false;
    }
}

// Allows user to change what kind of brush they are using
function freeDrawing(newBrush) {
    drawingToggle(newBrush);
    brushType = newBrush;

    switch (brushType) {
        case 'ERASER':
            showToggledTool("eraser");
            canvas.freeDrawingBrush = new fabric.EraserBrush(canvas); // Make this its own case for 'eraser'. Could create a switch case just for brush patterns
            canvas.freeDrawingBrush.width = lineWidth;
        break;
        case 'PENCIL':
            showToggledTool("pencil");
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.color = colour;
            canvas.freeDrawingBrush.width = lineWidth;
            
        break;
        case 'CIRCLE':
            canvas.freeDrawingBrush = new fabric.CircleBrush(canvas);       // STILL NEED TO IMPLEMENT THIS, NOT SURE IF ITS POSSIBLE THOUGH
            canvas.freeDrawingBrush.radius = lineWidth;
            canvas.freeDrawingBrush.width = colour;    // might be wrong values for circle
        break;
    }
}



canvas.on("mouse:down", function (opt) {
    if (panning) { // this is for panning, refer the mouse:wheel listener for reference to tutorial
        this.isDragging = true;
        this.lastPosX = opt.e.clientX;
        this.lastPosY = opt.e.clientY;
    } else if (straightLineDraw.toggled) {
        straightMouseDown(opt);
    }
});


// These functions are for the straight line tool

// On mouse down, create a line object with initial start and end values as the mouse pointers x and y values
function straightMouseDown(o) {
    straightLineDraw.isDrawing = true;
    var pointer = canvas.getPointer(o.e);
    obj = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {strokeWidth: lineWidth, stroke: colour});
    canvas.add(obj);
}


// When mouse is moving and a straight line is being drawn, update the last set of x and y coords as the users mouse moves
function straightMouseMove(o) {
    var pointer = canvas.getPointer(o.e);
    obj.set({x2:pointer.x, y2:pointer.y});
    canvas.renderAll();
}


// On mouseup, finalise the coords of the line. Emit the line to the server, add to the undo stack
function straightMouseUp(o) {
    straightLineDraw.isDrawing = false;
    var pointer = canvas.getPointer(o.e);

    obj.set({x2:pointer.x, y2:pointer.y});
    canvas.renderAll();
    obj.setCoords();

    

    socket.emit('canvasUpdate', {"change": obj, "type" : "add"}, function(id) {
        if (id != null) {
            obj.id = id;
        }
        undoStack.push({attributes: obj, type:"add"});
    });
}

canvas.on("mouse:move", function (opt) {
    if (this.isDragging && !canvas.getActiveObject()) { // this is for panning, refer the mouse:wheel listener for reference to tutorial
        var zoom = canvas.getZoom();    //gets the current zoom of the client
        var e = opt.e;
        var view = this.viewportTransform;
        view[4] += e.clientX - this.lastPosX;   // this calculates the change to the x and y values of the viewport
        view[5] += e.clientY - this.lastPosY;

        if (limitZoom) {    // if the zoom has decided that it has zoomed as far out as possible
            if (widthHeightLimited == "width") {
                view[4] = (canvas.getWidth()/2) - canvasWidth * zoom / 2;       //limit the viewport so no panning can be done
                if(view[5] > 0) {
                    view[5] = 0;
                } else if (view[5] < canvas.getHeight() - canvasHeight * zoom) {
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
        // console.log("y", view[5], "height", canvas.getHeight(), "canvasHeight",canvasHeight * zoom,"yO", canvas.getHeight() - canvasHeight * zoom);
        this.requestRenderAll();
        this.lastPosX = e.clientX;
        this.lastPosY = e.clientY;
    } else if (straightLineDraw.isDrawing) {
        straightMouseMove(opt);
    }
});


canvas.on('mouse:up', function(opt) {
    if (panning) {
        this.setViewportTransform(this.viewportTransform);
        this.isDragging = false;
    } else if (straightLineDraw.isDrawing) {
        straightMouseUp(opt);
    }
});



// This is triggered when a free drawn path is created
canvas.on("path:created", function (e) {
    redoStack = [];     // Wipe redo stack when actual move is made
    sendPath(e.path)    // send the details of the path to the below function
});


function sendPath(e) {
    if (e) {
        let room = getRoom();
        if (canvas.freeDrawingBrush.type == 'eraser') { // if the line drawn is an eraser line
            var intersectList = [];

            // find all of the objects it intersects with
            for (var i in canvas._objects) {
                if (i==0) continue; //except the boundary box
                if (e.intersectsWithObject(canvas._objects[i], true)) { // when this happens, it means that the eraser line becomes a clip path on the obj and the obj should be sent fully to the server and other clients
                    intersectList.push(canvas._objects[i].toJSON(['id']));
                }
            }
        
            if (intersectList != null) {
                socket.emit('canvasUpdate', {change: intersectList, type: "addErased"});        // emit the list of clipped objects

                for (var i in intersectList) {  // remove the most recent added erasure line from each obj to get the previous state of the obj before erased line
                    intersectList[i].clipPath.objects.pop()
                }

                undoStack.push({attributes: intersectList, type:"addErased"})       // push the previous state of the obj to the undo stack
            }
        } else {
            // If the line drawn is with the pencil tool, send the relevant object details to the server
            socket.emit('canvasUpdate', {"change": {path: e.path, id: null, stroke: colour, lineWidth: lineWidth}, "type" : "add", roomName: room}, function(id) {
                if (id != null) {       // Get the id of the line from the server callback
                    e.id = id;
                }
                undoStack.push({attributes: e, type:"add"});        // Push the addition of the line to the undo stack
            });
        }
    }
}



// these concern when the user has zoomed out as far as allowed in regards to the canvas area
var limitZoom = false;
var limitValue = 0.1;   //initial value
var widthHeightLimited = null;
if (canvas.getHeight()/canvasHeight < canvas.getWidth() / canvasWidth) {
    limitValue = canvas.getWidth()/canvasWidth;
    widthHeightLimited = "width";
} else {
    limitValue = canvas.getHeight()/canvasHeight;
    widthHeightLimited = "height";
}


// Code for Zoom and Panning adapted from fabricjs.com tutorial: http://fabricjs.com/fabric-intro-part-5#pan_zoom
canvas.on("mouse:wheel", function(options) {
    var delta = options.e.deltaY;
    var zoom = canvas.getZoom();
    zoom *= 0.99916 ** delta;
    if (zoom > 20) zoom = 20;
    if (zoom < limitValue) {        // if user has zoomed out as far as allowed, set the zoom to the limited value
        if (limitZoom == true) {
            zoom = limitValue;
        }
    } 

    if(zoom >= limitValue) {    //make sure there is no out of bounds zooming
        canvas.zoomToPoint({x: options.e.offsetX, y: options.e.offsetY}, zoom); // this adapts the zoom to zoom in relation to the location of the mouse pointer
    }
    options.e.preventDefault();
    options.e.stopPropagation();

    var view = this.viewportTransform;

    if (zoom <= canvas.getHeight() / canvasHeight) {     // if zoomed out as far as allowed, set the fixed limited zoom value and set the viewports accordingly
        limitZoom = true;
        zoom = limitValue;

        view[5] = (canvas.getHeight()/2) - canvasHeight * zoom / 2;

        if (view[4] >= 0) {
            view[4] = 0;
        } else if (view[4] < canvas.getWidth() - canvasWidth * zoom) {
            view[4] = canvas.getWidth() - canvasWidth * zoom;
        }      

    } else if (zoom <= canvas.getWidth() / canvasWidth) {
        limitZoom = true;
        zoom = limitValue;

        view[4] = (canvas.getWidth()/2) - canvasWidth * zoom / 2;

        if (view[5] >= 0) {
            view[5] = 0;
        } else if (view[5] < canvas.getHeight() - canvasHeight * zoom) {
            view[5] = canvas.getHeight() - canvasHeight * zoom;
        }    
        
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

    // Used to recalculate the hitboxes of each object when zooming
    for (var i of canvas._objects) {        // If there is major lag when zooming, this might be the cause
        i.setCoords();
    }
});



const imageSelect = document.getElementById("image");       // This gets the button that opens the file explorer for image selection
// Allows user to upload image files into the collab room
imageSelect.addEventListener('change', function(){          // This is triggered when a choice of file is made
    const chosenFile = this.files[0];

    if (chosenFile && (chosenFile.type=="image/jpeg" || chosenFile.type=="image/png")) {    //check the file chosen is of a valid filetype
        
        const reader = new FileReader(); 
        reader.onload = function(){
            changeTool('IMAGE', reader.result);
        };
        reader.readAsDataURL(chosenFile);
    } else {
        alert("File not chosen or incompatible file type, please upload PNG or JPEG only.")
    }
});


// Emits to canvas whenever a change is made to any object so other clients can update
canvas.on('object:modified', function (e) {
    console.log("mod event: ",e);
    redoStack = [];         // Empty the redo stack when a normal move has been made
    if (e.transform && typeof e.transform != 'function') {
        if (e.transform.target._objects) {      // If the modified object is a group, add some relevant values to the transform section of the obj
            e.transform.grouped = true;
            e.transform.height = e.target.height;
            e.transform.left = e.target.left;
            e.transform.top = e.target.top;
        }
        undoStack.push({attributes : e.transform, type: "mod"});
    } else if (e.target && e.target._textBeforeEdit) {         // handler for if a textbox is typed in, e.target has to exists because of type error issue
        // this exists because there is not a direct handler section for a change of text
        constructForUndoStack({id : e.target.id, text : e.target._textBeforeEdit});
    }
    if (e.target._objects) {
        for (var i in e.target._objects) {
            var thisObj = JSON.parse(JSON.stringify(e.target._objects[i]));
            var group = e.target._objects[i].group;


            // Calculate the new borders 
            thisObj.left = group.left + ((group.width + (2 * thisObj.left))/2)
            thisObj.top = group.top + ((group.height + (2 * thisObj.top))/2)

            socket.emit('canvasUpdate', {"change": thisObj, "type": 'mod', "id": e.target._objects[i].id});
        }
        
    } else {
        socket.emit('canvasUpdate', {"change": e.target, "type": 'mod', "id": e.target.id});
    }
    
});


// this is to take in values that need to be pushed to the stack that are not covered in the general movement,scale,rotate etc values
// should add to the undoStack in a structure that the current undo code can understand
function constructForUndoStack(o) {
    var info = {};

    // Go through each of the values given in the passed object and set the info list to contain all key:value pairs
    for (const [key, value] of Object.entries(o)) {
        if (key == 'id') continue;  // need to put id somewhere else in the structure
        info[key] = value;
    }

    // StructureHelp is to provide additional assistance in the construction of the structure used in the undo stack
    var structureHelp = []
    structureHelp["original"] = info;
    structureHelp["target"] = {id:o.id}

    undoStack.push({attributes: structureHelp, type : "mod"})    // push to the undo stack in the necessary format
}

function undoRedoneUndo(group) {
    var listForGroup = [];
    // Deselect the group otherwise it gives the object coordinates in relation to their position within the group
    canvas.discardActiveObject().renderAll();
    for (var i in canvas._objects) {
        for (var j in group._objects) {
            if (canvas._objects[i].id == group._objects[j].id) {
                canvas._objects[i].clone(function (o) {
                    listForGroup.push(o);
                }, ['id']);
            }
        }
    }

    var redoGroup = new fabric.Group(listForGroup);
    // redoToUndoConstructor({attributes : undoGroup, type: "mod"})
    redoGroup.set("grouped", true);
    redoGroup.set("handledBefore", true);
    redoStack.push({attributes : redoGroup, type: "mod"});


    for (var i in canvas._objects) {            // Loop through canvas objects and find the one with the id matching the id in the change
        for (var j in group._objects) {
            if (canvas._objects[i].id == group._objects[j].id) {
                var thisObj = group._objects[j];
    
                // This calculates the correct left and top values of the redone object
                var leftVal = group.left + ((group.width + (2 * thisObj.left))/2);
                var topVal = group.top + ((group.height + (2 * thisObj.top))/2);

                // Assign new top left values
                canvas._objects[i].set("left", leftVal);
                canvas._objects[i].set("top", topVal);
                canvas.renderAll();

                socket.emit('canvasUpdate', {"change": canvas._objects[i], "type": 'mod', "id": canvas._objects[i].id});
            }
        }
    }
}



// Releases and reimplements the most recent change in the undo stack, has handlers for every possible kind of change
function undo() {
    if (undoStack.length > 0) {             // Make sure there are changes to undo
        var change = undoStack.pop();       // Get most recent change
        console.log(change)

        
        // Modded objects, for the most part, are stored as a collection of the primary attributes of the original object
        if (change.type == 'mod') {
            var moddedObj;

            // If the undo holds a group object modification
            if (change.attributes.grouped) {
                // If this group has already been undone, redone, pass to here as the structure will be different
                if (change.attributes.handledBefore) {
                    undoRedoneUndo(change.attributes);
                } else {
                    var listForGroup = [];
                    // Deselect the group otherwise it gives the object coordinates in relation to their position within the group
                    canvas.discardActiveObject().renderAll();
                    for (var i in canvas._objects) {
                        for (var j in change.attributes.target._objects) {
                            if (canvas._objects[i].id == change.attributes.target._objects[j].id) {
                                canvas._objects[i].clone(function (o) {
                                    listForGroup.push(o);
                                }, ['id']);
                            }
                        }
                    }
    
                    var redoGroup = new fabric.Group(listForGroup);
                    redoStack.push({attributes : redoGroup, type: "mod"});
                    console.log(redoGroup);
    
                    for (var i in canvas._objects) {            // Loop through canvas objects and find the one with the id matching the id in the change
                        for (var j in change.attributes.target._objects) {
                            if (canvas._objects[i].id == change.attributes.target._objects[j].id) {
    
                                // Deselect the group otherwise it gives the object coordinates in relation to their position within the group
                                canvas.discardActiveObject().renderAll();
    
                                // 1 Calculate the top and left value differences between the group boundary and obj in the group
                                console.log("Before undo group left val: ", change.attributes.left);
                                console.log("Before undo object left val: ", change.attributes.target._objects[j].left);
                                var leftObjGroupDiff = Math.abs(change.attributes.left - change.attributes.target._objects[j].left);
                                var topObjGroupDiff = Math.abs(change.attributes.top - change.attributes.target._objects[j].top);
                                console.log("Before undo left difference", leftObjGroupDiff);
    
                                // 2 Get the original left and top values of the group
                                var origLeft = change.attributes.original.left;
                                var origTop = change.attributes.original.top;
                                console.log("After undo group left val: ", origLeft);
                                
                                // 3 Add the objects left and top differences to the original left and top group values for the correct undone values
                                var afterUndoLeft = origLeft + leftObjGroupDiff;
                                var afterUndoTop = origTop + topObjGroupDiff;
                                console.log("After undo object offset left val: ", afterUndoLeft);
    
                                // Set the coordinates of the object
                                canvas._objects[i].set("left", afterUndoLeft);
                                canvas._objects[i].set("top", afterUndoTop);
                                canvas.renderAll();
    
                                
                                // Basically for any rotations or size changes here
                                for (const [key, value] of Object.entries(change.attributes.original)) {        // Go through each of the attributes in the object before the change
            
                                    if (key == 'originX' || key == 'originY' || key == 'left' || key == 'top') { // these mess obj positioning things up, so skip them
                                        continue;
                                    }
            
                                    canvas._objects[i].set({[key]:value}); //set the objects key value to be the key value that was used before the most recent modification
                                    canvas.renderAll(); // need to have this here otherwise some attributes aren't rendered properly
                                }
    
                                canvas._objects[i].setCoords();
    
                                moddedObj = canvas._objects[i];
                                socket.emit('canvasUpdate', {"change": moddedObj, "type": 'mod', "id": moddedObj.id});      // Emit the change to server
                                break;
                            }
                        }
                    }
                }
            } else {
                for (var i in canvas._objects) {            // Loop through canvas objects and find the one with the id matching the id in the change
                    for (var j in change.attributes.target) {
                        if (canvas._objects[i].id == change.attributes.target.id) {
    
                            // Create a copy of the object before undo for the redo stack
                            canvas._objects[i].clone(function (o) {
                                redoStack.push({attributes : o, type:"mod"});
                            }, ['id']);
                            
                            for (const [key, value] of Object.entries(change.attributes.original)) {        // Go through each of the attributes in the object before the change
        
                                if (key == 'originX' || key == 'originY') { // these mess obj positioning things up, so skip them
                                    continue;
                                }
        
                                canvas._objects[i].set({[key]:value}); //set the objects key value to be the key value that was used before the most recent modification
                                canvas.renderAll(); // need to have this here otherwise some attributes aren't rendered properly
                            }
        
                            canvas._objects[i].setCoords();
                            moddedObj = canvas._objects[i];
                            socket.emit('canvasUpdate', {"change": moddedObj, "type": 'mod', "id": moddedObj.id});      // Emit the change to server
                            break;
                        }
                    }
                }
            }
        } else if (change.type == 'add')   {        // this means we have to remove the object
            for (var i in canvas._objects) {
                if (canvas._objects[i].id == change.attributes.id) {        // Find object in canvas._objects by matching the ids

                    // Create a copy of the object before undo for the redo stack
                    canvas._objects[i].clone(function (o) {
                        redoStack.push({attributes : o, type:"add"});
                    }, ['id']);

                    canvas.setActiveObject(canvas._objects[i]); // this is necessary so deleteItem knows which obj to delete
                    deleteItem(true)    //true marks that we are using the undo feature, so don't re add this removal to the undo stack for infinite loop
                }
            }

        } else if (change.type == 'bgColour') {         // This should revert the background colour to previous colour

            redoStack.push({attributes: canvas.backgroundColor, type:"bgColour"});

            canvas.backgroundColor = change.attributes.bgColour;
            canvas.renderAll();
            socket.emit('canvasUpdate', {"change": canvas.backgroundColor, "type": 'bgColour'});    // need a socket emit for this one bc the others above are handled by event managers

        } else if (change.type == 'delete') {           // This means we need to re-add an object from the undo stack
            console.log(change.attributes)

            var ids = change.attributes.map(function (o) {return o.id});    // Get the ids of the selected objects

            redoStack.push({attributes: ids, type:"delete"});


            for (var i in change.attributes) {
                addItemFromData(change.attributes[i].toJSON(['id']));   // need to covert to json for enliven objects to work
                socket.emit('canvasUpdate', {'change': change.attributes[i].toJSON(['id']),type: "add"});  //don't know why we need to include id but we do
            }
        } else if (change.type == 'addErased') {        // This means we need to re-add a version of the object without the most recent eraser clip path
            // Create a copy of the object before undo for the redo stack

            for (var i in canvas._objects) {
                for (var j in change.attributes){
                    if (canvas._objects[i].id == change.attributes[j].id) {
                        redoStack.push({attributes : canvas._objects[i].toJSON(['id']), type:"addErased"})
                        break;
                    }
                }
            }

            addErasedFromData(change.attributes);
            socket.emit('canvasUpdate', {'change': change.attributes,type: "addErased"});  //don't know why we need to include id but we do
        }
    }
}



// Function for redoing undo changes, activated by Crtl+y.
// If there is issues with this, all code is in this function and any redoStack.push in undo()
// The use for redo is reversing the most recent undo's. The redo stack is wiped when a normal move is made so this will only be in use if the last n moves by the user must be undo's
function redo() {
    if (redoStack.length > 0) {
        var redoChange = redoStack.pop();

        // Deselect the group otherwise it gives the object coordinates in relation to their position within the group
        canvas.discardActiveObject().renderAll();
        
        console.log(redoChange)
        switch (redoChange.type) {
            case 'mod':
                var moddedObj;
                var listForGroup = [];

                for (var i in canvas._objects) {
                    for (var j in redoChange.attributes._objects) {
                        if (canvas._objects[i].id == redoChange.attributes._objects[j].id) {
                            canvas._objects[i].clone(function (o) {
                                listForGroup.push(o);
                            }, ['id']);
                        }
                    }
                }

                var undoGroup = new fabric.Group(listForGroup);
                // redoToUndoConstructor({attributes : undoGroup, type: "mod"})
                undoGroup.set("grouped", true);
                undoGroup.set("handledBefore", true);
                var nextStack = {attributes : undoGroup, type: "mod"} ;
                if (JSON.stringify(undoStack[undoStack.length - 1]) != JSON.stringify(nextStack)) {
                    undoStack.push(nextStack);
                }

                if (redoChange.attributes._objects) {
                    for (var i in canvas._objects) {            // Loop through canvas objects and find the one with the id matching the id in the change
                        for (var j in redoChange.attributes._objects) {
                            if (canvas._objects[i].id == redoChange.attributes._objects[j].id) {
                                var thisObj = redoChange.attributes._objects[j];
                    
                                // This calculates the correct left and top values of the redone object
                                var leftVal = redoChange.attributes.left + ((redoChange.attributes.width + (2 * thisObj.left))/2);
                                var topVal = redoChange.attributes.top + ((redoChange.attributes.height + (2 * thisObj.top))/2);

                                // Assign new top left values
                                canvas._objects[i].set("left", leftVal);
                                canvas._objects[i].set("top", topVal);
                                canvas.renderAll();
                                canvas._objects[i].setCoords();
    
                                socket.emit('canvasUpdate', {"change": canvas._objects[i], "type": 'mod', "id": canvas._objects[i].id});
                            }
                        }
                    }
                } else {
                    for (var i in canvas._objects) {            // Loop through canvas objects and find the one with the id matching the id in the change
                        if (canvas._objects[i].id == redoChange.attributes.id) {
                            constructForUndoStack(canvas._objects[i]);
                            for (const [key, value] of Object.entries(redoChange.attributes)) {        // Go through each of the attributes in the object before the change
    
                                if (key == 'originX' || key == 'originY') { // these mess obj positioning things up, so skip them
                                    continue;
                                }
            
                                canvas._objects[i].set({[key]:value}); //set the objects key value to be the key value that was used before the most recent modification
                                canvas._objects[i].setCoords();
                            }
    
                            canvas.renderAll();
                            moddedObj = canvas._objects[i];
                            socket.emit('canvasUpdate', {"change": moddedObj, "type": 'mod', "id": moddedObj.id});      // Emit the change to server
                            break;
                        }
                    }
                }
            break;

            case 'add':
                var nextStack = {attributes:redoChange.attributes, type:"add"};
                if (JSON.stringify(undoStack[undoStack.length - 1]) != JSON.stringify(nextStack)) {
                    undoStack.push(nextStack);
                }
                addItemFromData(redoChange.attributes.toJSON(['id']));   // need to covert to json for enliven objects to work
                socket.emit('canvasUpdate', {'change': redoChange.attributes.toJSON(['id']),type: "add"});  //don't know why we need to include id but we do
            break;

            case 'bgColour':
                
                var nextStack = {attributes: {bgColour: canvas.backgroundColor}, type:"bgColour"};
                if (JSON.stringify(undoStack[undoStack.length - 1]) != JSON.stringify(nextStack)) {
                    undoStack.push(nextStack);
                }
                
                canvas.backgroundColor = redoChange.attributes;     // In this case, redoChange.attributes is just backgroundColor
                canvas.renderAll();
                socket.emit('canvasUpdate', {"change": canvas.backgroundColor, "type": 'bgColour'});    // need a socket emit for this one bc the others above are handled by event managers
            break;

            case 'delete':
                var objList = [];
                for (var i in canvas._objects) {
                    for (var j in redoChange.attributes) {
                        if (canvas._objects[i].id == redoChange.attributes[j]) {       // In this case, redoChange.attributes is just id
                            objList.push(canvas._objects[i]);
                            canvas.setActiveObject(canvas._objects[i]); // this is necessary so deleteItem knows which obj to delete
                            break
                        }
                    }
                }
                var group = new fabric.ActiveSelection(objList);
                group.setCoords();
                canvas.setActiveObject(group);
                deleteItem()    //true marks that we are using the undo feature, so don't re add this removal to the undo stack for infinite loop
                var nextStack = {attributes:objList, type:"delete"} 

                // This should prevent an ever expanding undoStack for alternating calls to undo and redo
                if (JSON.stringify(undoStack[undoStack.length -1]) != JSON.stringify(nextStack)) {
                    undoStack.push(nextStack);
                }
            break;

            case 'addErased':

                // This loop is to find the pre-redo version of the clipped object and push it to the undo stack
                for (var i in canvas._objects) {
                    if (canvas._objects[i].id == redoChange.attributes.id) {
                        undoStack.push({attributes:[canvas._objects[i].toJSON(['id'])], type:"addErased"});
                        break;
                    }
                }
                
                var dataToSend = [redoChange.attributes]
                addErasedFromData(dataToSend); // need to put in into a list as the function expects a list
                socket.emit('canvasUpdate', {'change': dataToSend,type: "addErased"});  // need to put in into a list as the function expects a list
            break;
        }
    }
}


// This is triggered by an onclick on the delete button and also the delete key
function deleteItem(usingUndo) {
    obj = canvas.getActiveObjects();    // use Objects for group deletion

    var ids = obj.map(function (o) {return o.id});    // Get the ids of the selected objects

    if (!usingUndo) {       // Don't push this deletion to the undo stack if it is being popped from the undo stack, prevents infinite loops
        redoStack = [];     // There may be some use cases where this wipes the redo stack when it wasn't meant to
        // Deselect the group otherwise it gives the object coordinates in relation to their position within the group
        canvas.discardActiveObject().renderAll();
        console.log(obj);
        undoStack.push({attributes: obj, type: "delete"})
    }

    // send emit for each obj and remove it from current client
    for (var i in ids) {
        socket.emit('canvasUpdate', {'change' : ids[i], 'type': 'remove'});
        canvas.remove(obj[i]);
    }
        
    obj = null;     // Without this, the removed line will be re-added on next time draw is selected
    ids = null;
}


// The below two functions are in place mainly for debugging purposes
// The HTML button could just call undo() and redo() directly, but this allows us to trace errors a bit better
// Almost redundant though

// This is accessed when a user clicks the undo button or presses the Ctrl+z keybind shortcut
function triggerUndo(){
    console.log("undoStack before pop", undoStack)
    undo();
}


// This is accessed when a user clicks the redo button or presses the Ctrl+y keybind shortcut
function triggerRedo(){
    console.log("redo stack", redoStack);
    redo();
}

document.onkeydown =  function (e) {
    // deletes an object when delete key is pressed
    if (e.key === 'Delete') {
        deleteItem();
    }

    // pops from the undo stack when Ctrl+Z is pressed
    if (e.ctrlKey && e.key === 'z') {
        triggerUndo();
    }

    if (e.ctrlKey && e.key === 'y') {
        triggerRedo();
    }
};


// This adds objects that other clients have created
function addItemFromData(data) {
    if (data.type == undefined) {    // this code needs to be here as the enlivenObjects doesn't work with the way we do normal pencil drawing, the type of pencil drawings are considered undefined here

        // build Path object
        obj = new fabric.Path(data.path, {
            strokeWidth: data.lineWidth,
            stroke: data.stroke,
            strokeLineJoin: 'round',        // This is to avoid jagged edges especially at larger thicknesses
            strokeLineCap: 'round',
            fill: null,
            angle: data.angle,
            height: data.height,
            width: data.width,
            left: data.left,
            top: data.top,
            id: data.id
        });

        if (data.scaleX || data.scaleY) {      // if the obj has been scaled in some way, set that too
            obj.set({scaleX: data.scaleX, scaleY: data.scaleY});
        }
        
        canvas.add(obj);
    } else {    // this adds in new objects from other clients as they are drawn
        fabric.util.enlivenObjects([data], function (enlivenObjects) {
            console.log(enlivenObjects[0]);
            canvas.add(enlivenObjects[0]);
            canvas.renderAll();
        });
    }

}


// This replaces objects with updated versions when another user draws an eraser line through the object
function addErasedFromData(objs) {
    for (var j in objs) {
        for (var i in canvas._objects) {
            console.log("canvas", canvas._objects[i].id, "obj", objs[j])
            if (canvas._objects[i].id == objs[j].id) {
                fabric.util.enlivenObjects([objs[j]], function (enlivenObjects) {
                    canvas.remove(canvas._objects[i]);
                    canvas.add(enlivenObjects[0]);
                    canvas.renderAll();
                })
                break;
            };
        }
    }
}


// This handles all canvas updates, e.g. any additions, deletions, modifications, templates or design loads
socket.on('canvasUpdate', (data) => {
    console.log(data.change);   // Debugging

    // Use switch case to figure out what kind of update it is
    switch (data.type) {
        case 'add':
            addItemFromData(data.change);               // Add objects from other users
        break;

        case 'addErased':
            addErasedFromData(data.change);             // Updated objects with erased lines
        break;

        case 'bgColour':
            canvas.backgroundColor = data.change;       // Set background colour
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
        
        case 'mod':     // this is for general modifications to the object, not any eraser stuff
            for (var i in canvas._objects) {
                if (canvas._objects[i].id == data.id) {     // Find this clients instance of the object by matching the ids
                    var oriObj = canvas._objects[i];
                    var newObj = data.change;
                    
                    oriObj.set("left", newObj.left);
                    oriObj.set("top", newObj.top);
                    oriObj.setCoords(); //this is needed, trust me

                    // set these values of the object with the passed values
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
                    break;
                }
            }
        break;

        case 'deleteDesign':
            // wipe the undo/redo stacks if a design is loaded or the design is deleted
            undoStack = [];
            redoStack = [];
            for (var i of canvas.getObjects()) {
                if (i.id != 'DONTDELETE') { // this makes sure that the delete function doesn't remove the background rectangle that shows the borders
                    canvas.remove(i);
                }
            }
            canvas.backgroundImage = false; // remove any possible background image
            canvas.renderAll();
        break;
    }

    canvas.renderAll();          // Makes sure that the canvas is fully rendered
});


// This is all stuff pertaining to the joining and leaving of users from the collaboration room
// Get room function which takes in the room name when we create it from the server, then loop through them all and when that room == location.pathname we have our room
const whiteboard = document.getElementById("whiteboard");

if (whiteboard != null) {

    let data = {roomName: getRoom()}

    socket.emit("joined", (data));
}
let roomParticipants = new Array();
// Add in a button that you can click to bring up a window to show all users in a room 
socket.on("users", (roomData) => {
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
    let path = decodeURI(location.pathname);        // Decode URI sorts out any special characters like spaces
    let room = path.split("/")[2]
    return room;
}

function sendData() {
    //Get room
    let room = getRoom();

    var data = {date: Date.now(), roomName: room};
    console.log("room in data", data.roomName)
    console.log("what is happening");
    socket.emit("canvasUpdate", (data));
}

socket.on("chatMessage", data => {
    console.log(data);
})

document.getElementById("newDesign").onclick = () => {
    document.getElementById('save').style.display = "none";

    // Force user to enter design name before sending design
    var dName = prompt("Name your design");
    if (dName == "" || dName == null) {
        alert("You must give your design a name");
    } else {
        var design  = canvas.toJSON(['id']);

        // Remove the boundary rectangle from the canvas JSON
        design.objects = design.objects.filter(function(obj) {
            return obj.id != "DONTDELETE"
        })

        // This is used to get the correct dataURL output based off of the viewport the client has
        var view = canvas.viewportTransform;
        var pixDense = window.devicePixelRatio;


        socket.emit('saveDesign', {design: JSON.stringify(design), thumbnail: canvas.toDataURL({format: 'jpeg', width:(canvasWidth*canvas.getZoom())/pixDense, height:(canvasHeight*canvas.getZoom())/pixDense, left:view[4], top:view[5]})}, dName);     // the canvas.toDataUrl creates an image of the whole collab room, using logic to get the correct width and height
    }
}
var recordedSaveNames = [];


// Below is the code pertaining to the buttons in the header

// Emit to server design JSON data to be stored in a file for saving
// This also creates a form for the saving of designs
function saveDesign() {
    document.getElementById('save').style.display = "grid";
    socket.emit('getDesignNames');
    socket.on('retrieveDesignNames', (names) => {
        names.forEach((name) => {
            let currentName = document.createElement("div");
            let nameBut = document.createElement("button");
            nameBut.classList.add("loadButton");
            nameBut.innerHTML = name;
            nameBut.onclick = () => {
                var conf = confirm("Are you sure you want to overwrite " + name + "?\nThis cannot be undone");
                if (conf) {
                    document.getElementById('save').style.display = "none";
                    var design  = canvas.toJSON(['id']);
    
                    // Remove the boundary rectangle from the canvas JSON
                    design.objects = design.objects.filter(function(obj) {
                        return obj.id != "DONTDELETE"
                    })
                    

                    // This is used to get the correct dataURL output based off of the viewport the client has
                    var view = canvas.viewportTransform;
                    var pixDense = window.devicePixelRatio;

                    socket.emit('saveDesign', {design: JSON.stringify(design), thumbnail: canvas.toDataURL({format: 'jpeg', width:(canvasWidth*canvas.getZoom())/pixDense, height:(canvasHeight*canvas.getZoom())/pixDense, left:view[4], top:view[5]})}, name);     // the canvas.toDataUrl creates an image of the whole collab room, using logic to get the correct width and height
                }
            }
            if(!recordedSaveNames.includes(name)){
                currentName.appendChild(nameBut);
                document.getElementById("designSaveList").appendChild(currentName);
            }
            recordedSaveNames.push(name);
        });
        
    })

    // Gives users an idea of the image they have saved
    // var win = window.open();
    // win.document.write('<iframe src="' + canvas.toDataURL({format: 'jpeg', width:(canvasWidth*canvas.getZoom()), height:(canvasHeight*canvas.getZoom())})  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>'); // this gives a preview of the image, can be commented out if needs be
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
    var conf = confirm("Are you sure you want to delete the current design?\nThis cannot be undone");
    if (conf) {
        // wipe the undo/redo stacks if a design is loaded, or the design is deleted
        undoStack = [];
        redoStack = [];
        socket.emit('canvasUpdate', {type: "deleteDesign"});
        for (var i of canvas.getObjects()) {
            if (i.id != 'DONTDELETE') {         // Ignores boundary rectangle
                canvas.remove(i);
            }
        }    
        canvas.backgroundImage = false; // remove any possible background image
        canvas.renderAll();
    }
}

// CSS to close the form
document.getElementById("close").onclick = () => {
    document.getElementById("load").style.display = "none";
    document.getElementById("save").style.display = "none";
}


let recordedLoadNames = [];

// Function creates a form that shows all available designs to load
function loadDesign() {
    document.getElementById('load').style.display = "grid";
    socket.emit('getDesignNames');
    socket.on('retrieveDesignNames', (names) => {
        if(names.length == 0){
            alert("You have no designs to load");
        }else{
            names.forEach((name) => {
                let currentName = document.createElement("div");
                let nameBut = document.createElement("button");
                nameBut.classList.add("loadButton");
                nameBut.innerHTML = name;
                nameBut.onclick = () => {
                    document.getElementById('load').style.display = "none";
                    socket.emit('loadDesign', name);
                }
                if(!recordedLoadNames.includes(name)){
                    currentName.appendChild(nameBut);
                    document.getElementById("designLoadList").appendChild(currentName);
                }
                recordedLoadNames.push(name);
            });
        }
    });
}
// End of header code


// Below is code for buttons in footer
// Get template image and format it as canvas background image, send emit to ell other client to do so
function importTemplate(template, dontEmit) {
    fabric.Image.fromURL(template, function (img) {
        // Don't emit is true when the importTemplate function is being called by a client that did not import the template, but has to load it because another user has
        if (!dontEmit) {
            socket.emit('importTemplate', template)
        }

        // Create formatting of template that suits either landscape or portrait resolutions
        if (img.height < img.width) {
            // Scale to height (means it works better on portrait resolutions)
            img.scaleToWidth(canvasWidth, true);

            // Center the template and set at background image
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                top: (canvasHeight - (img.height*img.scaleY)) / 2,
                left: 0
            });
        } else {
            // Scale to height (means it works better on landscape resolutions)
            img.scaleToHeight(canvasHeight, true);

            // Center the template and set at background image
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                top: 0,
                left: (canvasHeight - (img.width*img.scaleX)) / 2
            });
        }

        canvas.renderAll();
    })
}


// This is called when the "Browse Template" button is pressed, makes the form viewable
function importTemplatePopup() {
    const popup = document.getElementById("_templateContainer");
    popup.style.display = "flex";
}


function removeTemplate(dontEmit) {
    if (canvas.backgroundImage != null) {
        
        if (!dontEmit) {        // Only emit if the delete request originated from this client
            socket.emit('removeTemplate');
        }

        const i = new fabric.Image('');
        canvas.setBackgroundImage(i, canvas.renderAll.bind(canvas));        // Set background to an empty image to remove the template

        canvas.backgroundImage = null;  // for the alert to work on repeated calls to this without adding new template
    } else {
        alert("No template to remove");
    }
}


window.onload = function() {
    console.log("this is the room you are in",getRoom())
    socket.emit('inRoom', getRoom())   // This allows the socket to be marked as one that connects to a user within a room

    // Since templates will only be updated infrequently, request templates should only be called on page load rather than each time template window is opened
    socket.emit('requestTemplates');
}

// This populates the "Browse Templates" form
socket.on('templateResponse', (templates) => {
    const templateGrid = document.getElementById("_templateGrid");
    if (templates.length == 0) {        // Check that there is templates to load (should always be)
        alert("No templates to show");
    } else {
        templates.forEach((template) => {       // Create image listing for each template and add it to the form
            let curImg = document.createElement("img");
            let imgContainer = document.createElement("div");
            let templateName = document.createElement("p");
            templateName.innerHTML = template.name;
            imgContainer.style.backgroundColor = "#c9cecf";
            imgContainer.onclick = () => {
                document.getElementById('_templateContainer').style.display = "none";
                importTemplate(template.image)
            }
            curImg.src = template.image;
            imgContainer.appendChild(curImg);
            imgContainer.appendChild(templateName);
            templateGrid.appendChild(imgContainer);
        });
    }
});


// When another user imports a template, add that template to this client
socket.on('importTemplate', (template) => {
    importTemplate(template, true); // figure out solution for the first param later
});

socket.on('removeTemplate', () => {
    removeTemplate(true);
})

// Called when the "Exit Call" button is pressed
function leaveRoom() {
    socket.emit("leaveRoom");
    window.location.href = "/home";
}