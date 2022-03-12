// var socketPath = window.location.pathname + "socket.io";
// var socket = io({path: socketPath});
const socket = io();

var canvasHeight = 4000;
var canvasWidth = 4000;
var backgroundColor = "#c9cecf"
// Create the canvas and set its attributes
let canvas = new fabric.Canvas("whiteboard");
canvas.setHeight(window.innerHeight * 0.75);
canvas.setWidth(window.outerWidth); // this can ignore console being open
canvas.backgroundColor = backgroundColor;
let r = new fabric.Rect({       // don't need this, just for debugging panning and zooming area
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

canvas.add(r);

// maybe add in an init for the start stuff
var recentObj;
var obj;
var newImg;

var undoStack = [];

// Initialise variables for changable attributes
var colour = 'black';
var pt = 500;
var lineWidth = 10;
var fontFamily = "Times New Roman";
var panning = false;
var straightLineDraw = {toggled: false, isDrawing: false};


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
    var activeObj = canvas.getActiveObject();
    if (activeObj) {
        if (activeObj.get('type') == 'textbox') {
            constructForUndoStack({id: activeObj.id, fontSize: activeObj.fontSize})    // Send ptSize before change to the undo stack
            activeObj.set('fontSize', pt);
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
    var activeObj = canvas.getActiveObject();
    if (activeObj) {
        // not sure if line is a type but just in case
        if (activeObj.get('type') == 'path' || activeObj.get('type') == 'polyline' || activeObj.get('type') == 'line') {
            constructForUndoStack({id: activeObj.id, strokeWidth: activeObj.strokeWidth})    // Send lineWidth before change to the undo stack
            activeObj.set("strokeWidth", parseInt(lineWidth));
        }
            
        canvas.renderAll();
        canvas.fire('object:modified')
    }
}

const fontFamilyInput = document.getElementById('font');    // Gets font selection box element
// Event listener for change in selection box value
fontFamilyInput.addEventListener('change', function () {
    fontFamily = fontFamilyInput.value;
    var activeObj = canvas.getActiveObject();
    if (activeObj) {
        if (activeObj.get('type') == 'textbox') {
            constructForUndoStack({id: activeObj.id, fontFamily: activeObj.fontFamily})    // Send font before change to the undo stack
            activeObj.set('fontFamily', fontFamily);
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
    var activeObj = canvas.getActiveObject();
    if (activeObj) {
        constructForUndoStack({id: activeObj.id, fill: activeObj.fill})    // Send the before colour change instance of the obj to the undo stack

        if (activeObj.get('type') == 'path' || activeObj.get('type') == 'polyline' || activeObj.get('type') == 'line') 
            activeObj.set("stroke", colour);
        else 
            activeObj.set("fill", colour);
        canvas.renderAll();
        canvas.fire('object:modified', activeObj)
    }
}

function changeBgColour(col) {
    backgroundColor = col;
    // r.set({fill: backgroundColor});  // this would make it so templates are hidden
    undoStack.push({attributes : {bgColour : canvas.backgroundColor}, type:"bgColour"}); // Send bgColour before change to the undo stack

    canvas.backgroundColor = backgroundColor;
    canvas.renderAll();
    socket.emit('canvasUpdate', {"change": backgroundColor, "type": 'bgColour'});
}

// Uses a switch case to perform actions for each tool, triggered by onclick when selecting any tool
function changeTool(res, imgInfo) {
    // Disable draw if other tool is selected
    if (res != 'DRAW') {
        canvas.isDrawingMode = false;
    }

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
        case 'ERASER':
            // canvas.freeDrawingBrush = new fabric.EraserBrush(canvas); // Make this its own case for 'eraser', find out why it makes the most recently placed obj invisible. Could create a switch case just for brush patterns
            // canvas.freeDrawingBrush.width = lineWidth;
            // canvas.isDrawingMode = !canvas.isDrawingMode;
            obj = null;

            freeDrawing('ERASER');

        break;
        case 'DRAW':
            // canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            // canvas.freeDrawingBrush.stroke = colour;
            // canvas.freeDrawingBrush.strokeWidth = lineWidth;
            // // brush.color = 'red';
            // // brush.width = 50;
            // // brush.radius = 50;
            // console.log(canvas.freeDrawingBrush)
            // // canvas.freeDrawingBrush = brush;
            // canvas.isDrawingMode = !canvas.isDrawingMode;
            // // had to make the listeners global because more would be made each time this section is called
            // panning = false;
            // canvas.selection = true;
            // straightLineDraw.toggled = false;
            // straightLineDraw.isDrawing = false;
            // document.getElementById('pan').style.backgroundColor = 'darkgrey';
            // document.getElementById('line').style.backgroundColor = 'darkgrey';

            obj = null;

            freeDrawing('PENCIL')

        break;
        case 'LINE':        //gonna work on setting the coords through user input
            straightLineDraw.toggled = !straightLineDraw.toggled;

            document.getElementById('draw').style.backgroundColor = 'darkgrey';
            document.getElementById('pan').style.backgroundColor = 'darkgrey';
            canvas.isDrawingMode = false;
            panning = false;
            canvas.selection = false;
            if (straightLineDraw.toggled) {
                r.set({hoverCursor: "crosshair"});
            } else {
                r.set({hoverCursor: "default"});
            }
           
        break;
        case 'IMAGE':
            // Images are created in a different way to the rest of the tools
            // Need to use from URL and then create a callback to add img to canvas after it has loaded
            obj = new fabric.Image.fromURL(imgInfo, function(oriImg){
                oriImg.set({
                    top: 1000,
                    left:1000
                });

                // this needs to be called here. Because of the callback, the code at the bottom of this section will not be able to add the img as it hadn't loaded at that point
                canvas.add(oriImg).renderAll();
                recentObj = oriImg;
                socket.emit('canvasUpdate', {"change": oriImg, "type" : "add"}, function(id) {
                    console.log(id);
                    if (id != null) {
                        recentObj.id = id;
                    }
                    undoStack.push({attributes: recentObj, type:"add"});
                });
                
            });
            obj = null; // need this otherwise errors will occur at bottom of this section
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
            // reset values for other tools that can be toggled
            canvas.isDrawingMode = false;
            document.getElementById('draw').style.backgroundColor = 'darkgrey';
            document.getElementById('line').style.backgroundColor = 'darkgrey';
            straightLineDraw.toggled = false;
            straightLineDraw.isDrawing = false;

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

    if (obj && res != 'IMAGE') {    //Img check needed bc of use of callback in image loading
        canvas.add(obj).renderAll();
        console.log("sending", obj);
        socket.emit('canvasUpdate', {"change": obj, "type" : "add"}, function(id) {
            console.log(id);
            if (id != null) {
                obj.id = id;
            }
        });
        recentObj = obj;
        
        undoStack.push({attributes: recentObj, type:"add"});
    }
}

function freeDrawing(brushType) {
    canvas.isDrawingMode = !canvas.isDrawingMode;

    switch (brushType) {
        case 'ERASER':
            canvas.freeDrawingBrush = new fabric.EraserBrush(canvas); // Make this its own case for 'eraser'. Could create a switch case just for brush patterns
            canvas.freeDrawingBrush.width = lineWidth;
        break;
        case 'PENCIL':
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.color = colour;
            canvas.freeDrawingBrush.width = lineWidth;
        break;
        case 'CIRCLES':
            canvas.freeDrawingBrush = new fabric.CircleBrush(canvas);       // STILL NEED TO IMPLEMENT THIS, NOT SURE IF ITS POSSIBLE THOUGH
            canvas.freeDrawingBrush.radius = lineWidth;
            canvas.freeDrawingBrush.width = colour;    // might be wrong values for circle
        break;
    }
    // reset values of other tools possibly in use
    panning = false;
    canvas.selection = true;
    straightLineDraw.toggled = false;
    straightLineDraw.isDrawing = false;
    document.getElementById('pan').style.backgroundColor = 'darkgrey';
    document.getElementById('line').style.backgroundColor = 'darkgrey';
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
    } else if (straightLineDraw.toggled) {
        straightMouseDown(opt);
    }
});

function straightMouseDown(o) {
    straightLineDraw.isDrawing = true;
    var pointer = canvas.getPointer(o.e);
    obj = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {strokeWidth: lineWidth, stroke: colour});
    canvas.add(obj);
}

function straightMouseMove(o) {
    var pointer = canvas.getPointer(o.e);
    obj.set({x2:pointer.x, y2:pointer.y});
    canvas.renderAll();
}

function straightMouseUp(o) {
    straightLineDraw.isDrawing = false;
    var pointer = canvas.getPointer(o.e);
    obj.set({x2:pointer.x, y2:pointer.y});
    recentObj = obj;
    canvas.renderAll();
    socket.emit('canvasUpdate', {"change": obj, "type" : "add"}, function(id) {
        console.log(id);
        if (id != null) {
            obj.id = id;
        }
        undoStack.push({attributes: obj, type:"add"});
    });
}

canvas.on("mouse:move", function (opt) {
    if (drawFlag) {  // this pushed line points to a stack when drawing, NOT SURE ANY OF THIS IS NECESSARY NOW
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
        // console.log("y", view[5], "height", canvas.getHeight(), "canvasHeight",canvasHeight * zoom,"yO", canvas.getHeight() - canvasHeight * zoom);
        this.requestRenderAll();
        this.lastPosX = e.clientX;
        this.lastPosY = e.clientY;
    } else if (straightLineDraw.isDrawing) {
        straightMouseMove(opt);
    }
});

canvas.on("path:created", function (e) {
    sendPath(e.path)    // send the 
});

function sendPath(e) {
    if (e) {
       recentObj = e;
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
                socket.emit('canvasUpdate', {change: intersectList, type: "addErased"});

                for (var i in intersectList) {  // remove the most recent added erasure line from the obj to get the previous state of the obj before erased line
                    intersectList[i].clipPath.objects.pop()
                }



                undoStack.push({attributes: intersectList, type:"addErased"})
                console.log(intersectList)
            }
        } else {
            socket.emit('canvasUpdate', {"change": {path: e.path, id: null, stroke: colour, lineWidth: lineWidth}, "type" : "add"}, function(id) {
                console.log(id);
                if (id != null) {
                    recentObj.id = id;
                }
                undoStack.push({attributes: recentObj, type:"add"});
            });
        }
    }
    drawFlag = false;
}
// end of free drawing code


canvas.on('mouse:up', function(opt) {
    if (panning) {
        this.setViewportTransform(this.viewportTransform);
        this.isDragging = false;
        // this.selection = true;
    } else if (straightLineDraw.isDrawing) {
        straightMouseUp(opt);
    }
});

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

    // console.log(zoom);
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
        // console.log("elsewhere", zoom, limitValue);
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
    console.log(view[4], view[5])

    // Used to recalculate the hitboxes of each object when zooming
    for (var i of canvas._objects) {        // If there is major lag when zooming, this might be the cause
        i.setCoords();
    }
});

function checkPointerInArea() {
    if (canvas.getPointer().x >= 0 && canvas.getPointer().x <= canvasWidth && canvas.getPointer().y >= 0 && canvas.getPointer().y <= canvasHeight) 
        return true;
    else
        return false;
}

const imageSelect = document.getElementById("image");
imageSelect.addEventListener('change', function(){
    const chosenFile = this.files[0];

    if (chosenFile && (chosenFile.type=="image/jpeg" || chosenFile.type=="image/png")) {    //check the file chosen is of a valid filetype
        
        const reader = new FileReader(); 
        console.log(reader)
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
    console.log(e);
    if (e.transform && typeof e.transform != 'function') {
        undoStack.push({attributes : e.transform, type: "mod"});
    } else if (e.target && e.target.text) {         // handler for if a textbox is typed in, e.target has to exists because of type error issue
        constructForUndoStack({id : e.target.id, text : e.target._textBeforeEdit});
    }
    // for some reason id wouldn't carry over to server through "change" object
    console.log(canvas.getActiveObject());
    socket.emit('canvasUpdate', {"change": canvas.getActiveObject(), "type": 'mod', "id": canvas.getActiveObject().id});
});


// this is to take in values that need to be pushed to the stack that are not covered in the general movement,scale,rotate etc values
// should add to the undoStack in a structure that the current undo code can understand
function constructForUndoStack(o) {
    console.log(o);
    var info = {};


    for (const [key, value] of Object.entries(o)) {
        if (key == 'id') continue;  // need to put id somewhere else in the structure
        info[key] = value;
    }

    var structureHelp = []
    structureHelp["original"] = info;
    structureHelp["target"] = {id:o.id}

    console.log({attributes: structureHelp, type : "mod"});

    undoStack.push({attributes: structureHelp, type : "mod"})    // modify this to fit in with the structure in the undo function
}


// This is for debugging
canvas.on('selection:created', function() {
    console.log(canvas.getActiveObject());
})

// dont worry about this
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function undo() {
    if (undoStack.length > 0) {
        console.log(undoStack)

        var change = undoStack.pop() 

        if (change.type == 'mod') {
            var moddedObj;

            for (var i in canvas._objects) {
                if (canvas._objects[i].id == change.attributes.target.id) {
                    for (const [key, value] of Object.entries(change.attributes.original)) {
                        console.log(key, value);
                        if (key == 'originX' || key == 'originY') { // this messes things up, so skip them
                            continue;
                        }
    
                        canvas._objects[i].set({[key]:value}); //set the objects key value to be the key value that was used before the most recent modification
                        canvas._objects[i].setCoords();
                    }
                    canvas.renderAll()
                    console.log(canvas._objects[i])
                    moddedObj = canvas._objects[i];
                    break;
                }
            }
            console.log(moddedObj)
            socket.emit('canvasUpdate', {"change": moddedObj, "type": 'mod', "id": moddedObj.id});
        } else if (change.type == 'add')   {        // this means we have to remove the object
            for (var i in canvas._objects) {
                if (canvas._objects[i].id == change.attributes.id) {
                    canvas.setActiveObject(canvas._objects[i]); // this is necessary so deleteItem knows which obj to delete
                    deleteItem(true)    //true marks that we are using the undo feature, so don't re add this removal to the undo stack for infinite loop
                }
            }
        } else if (change.type == 'bgColour') {
            canvas.backgroundColor = change.attributes.bgColour;
            canvas.renderAll();
            socket.emit('canvasUpdate', {"change": canvas.backgroundColor, "type": 'bgColour'});    // need a socket emit for only this one bc the others are handled by event managers
        } else if (change.type == 'delete') {
            for (var i in change.attributes) {
                console.log(change.attributes[i].toJSON(['id']))
                addItemFromData(change.attributes[i].toJSON(['id']));   // need to covert to json for enliven objects to work
                socket.emit('canvasUpdate', {'change': change.attributes[i].toJSON(['id']),type: "add"});  //don't know why we need to include id but we do
            }
        } else if (change.type == 'addErased') {
            addErasedFromData(change.attributes);
            socket.emit('canvasUpdate', {'change': change.attributes,type: "addErased"});  //don't know why we need to include id but we do
        }
        
    }
}

// This is triggered by an onclick on the delete button and also the delete key
function deleteItem(usingUndo) {
    obj = canvas.getActiveObjects();    // use Objects for group deletion
    var ids = obj.map(function (o) {return o.id});    //

    console.log(obj);
    if (!usingUndo) {
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

// deletes an object when delete key is pressed
document.onkeydown =  function (e) {        // This might cause issues for using the delete key anywhere else on the page
    if (e.key === 'Delete') {
        deleteItem();
    }

    // this bit is for dealing with an undo request
    if (e.ctrlKey && e.key === 'z') {
        console.log("undoStack before pop", undoStack)
       undo();
    }
};

function addItemFromData(data) {
    if (data.type == undefined) {    // this code needs to be here as the enlivenObjects doesn't work with the way we do normal pencil drawing atm
        canvas.isDrawingMode = true;

        addObj = new fabric.Path(data.path, {
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

        if (data.scaleX) {
            addObj.set({scaleX: data.scaleX, scaleY: data.scaleY});
        }
        
        canvas.isDrawingMode = false;

        canvas.add(addObj);
    } else {    // this adds in new objects from other clients as they are drawn
        fabric.util.enlivenObjects([data], function (enlivenObjects) {
            // canvas.remove(canvas._objects[i]);
            console.log(enlivenObjects[0]);
            canvas.add(enlivenObjects[0]);
            canvas.renderAll()
        });
    }

}

function addErasedFromData(objs) {
    console.log(objs);
    for (var j in objs) {
        for (var i in canvas._objects) {
            if (canvas._objects[i].id == objs[j].id) {
                console.log(objs[j])
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
    var addObj;     // Create variable to store object to be added (will have to be created from data given from server)
    console.log(data.change);   // Debugging

    // Use switch case to figure out what kind of update it is
    switch (data.type) {
        case 'add':
            console.log("this one be addin",data)
            console.log(data.change.type);
            addItemFromData(data.change)
            
            
            // somehow managed to reduce the below code to the stuff above

            // // find type of object to be added and construct with necessary values, make sure to set id of obj
            // if (data.change.type == 'rect') {
            //     addObj = new fabric.Rect({
            //         left:data.change.left,
            //         top:data.change.top,
            //         fill:data.change.fill,
            //         width: data.change.width,
            //         height: data.change.height,
            //         scaleX: data.change.scaleX,
            //         scaleY: data.change.scaleY,
            //         angle: data.change.angle,
            //         id: data.change.id
            //     });           
            // } else if (data.change.type == 'triangle') {
            //     addObj = new fabric.Triangle({
            //         left: data.change.left,
            //         top: data.change.top,
            //         fill: data.change.fill,
            //         width:  data.change.width,
            //         height:  data.change.height,
            //         scaleX: data.change.scaleX,
            //         scaleY: data.change.scaleY,
            //         angle: data.change.angle,
            //         id: data.change.id
            //     });
            // } else if (data.change.type == 'circle') {
            //     addObj = new fabric.Circle({
            //         left: data.change.left,
            //         top: data.change.top,
            //         fill: data.change.fill,
            //         radius: data.change.radius,
            //         scaleX: data.change.scaleX,
            //         scaleY: data.change.scaleY,
            //         angle: data.change.angle,
            //         id: data.change.id
            //     });
            // } else if (data.change.type == 'line') {
            //     var points = [data.change.x1, data.change.y1, data.change.x2, data.change.y2]
            //     addObj = new fabric.Line(points, {
            //         stroke: data.change.stroke,
            //         lineWidth: data.change.lineWidth,
            //         top: data.change.top,
            //         left: data.change.left,
            //         scaleX: data.change.scaleX,
            //         scaleY: data.change.scaleY,
            //         angle: data.change.angle,
            //         id: data.change.id 
            //     });
            // } else if (data.change.type == 'textbox') {
            //     addObj = new fabric.Textbox(data.change.text, {
            //         fontSize: data.change.fontSize,
            //         fontFamily: data.change.fontFamily,
            //         fill: data.change.fill,
            //         left: data.change.left,
            //         top: data.change.top,
            //         angle: data.change.angle,
            //         id: data.change.id
            //     });
            // } else if (data.change.type == 'image') {
            //     // newImg = document.createElement("img");
            //     // newImg.setAttribute('src', data.change.src);
            //     // document.getElementById("body").appendChild(newImg);

            //     addObj = new fabric.Image.fromURL(data.change.src, function(oriImg){
            //         oriImg.set({
            //             top: data.change.top,
            //             left: data.change.left,
            //             height: data.change.height,
            //             width: data.change.width,
            //             angle: data.change.angle,
            //             scaleX: data.change.scaleX,
            //             scaleY: data.change.scaleY,
            //             id: data.change.id
            //         })
                    
            //         canvas.add(oriImg);
            //         canvas.renderAll();
            //     });
            // } else {    // this should cover both path and polyline
            //     // on other clients, free drawing is recreated as a polyline
            //     canvas.isDrawingMode = true;

            //     // canvas.freeDrawingBrush = new fabric.EraserBrush(canvas); // Make this its own case for 'eraser'. Could create a switch case just for brush patterns
            //     // canvas.freeDrawingBrush.width = lineWidth;

            //     // canvas.loadFromJSON(data.change.path);

            //     addObj = new fabric.Path(data.change.path, {
            //         strokeWidth: data.change.lineWidth,
            //         stroke: data.change.stroke,
            //         strokeLineJoin: 'round',        // This is to avoid jagged edges especially at larger thicknesses
            //         strokeLineCap: 'round',
            //         fill: null,
            //         angle: data.change.angle,
            //         height: data.change.height,
            //         width: data.change.width,
            //         left: data.change.left,
            //         top: data.change.top,
            //         id: data.change.id
            //     });

            //     if (data.change.scaleX) {
            //         addObj.set({scaleX: data.change.scaleX, scaleY: data.change.scaleY});
            //     }
                
            //     canvas.isDrawingMode = false;
            // }


            // if (data.change.type != 'image') {  //when loading image from url, need to use callback when the image has loaded, so ignore here
            //     console.log(addObj);
            //     canvas.add(addObj);
            // }
            
        break;

        case 'addErased':
            console.log("erasedshithere", data.change);
            addErasedFromData(data.change);
            
        break;

        case 'bgColour':
            console.log(data);
            canvas.backgroundColor = data.change;
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
                if (canvas._objects[i].id == data.id) {
                    console.log("canvasObj",canvas._objects[i]);
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
            for (var i of canvas.getObjects()) {
                if (i.id != 'DONTDELETE') { // this makes sure that the delete function doesn't remove the background rectangle that shows the borders
                    canvas.remove(i);
                }
            }
            canvas.backgroundImage = false; // remove any possible background image
            canvas.renderAll();
        break;
    }
   canvas.renderAll();
});

// this is server assigned id given when client creates obj
// socket.on('idUpdate', (data) => {
//     recentObj.id = data;
// });

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

document.getElementById("newDesign").onclick = () => {
    document.getElementById('save').style.display = "none";
    socket.emit(socket.emit('saveDesign', {design: JSON.stringify(canvas), thumbnail: canvas.toDataURL({format: 'jpeg'})}, prompt("Name your design")));
}
var recordedSaveNames = [];
// Below is the code pertaining to the buttons in the header

// Emit to server design JSON data to be stored in a file for saving
function saveDesign() {
    //socket.emit('saveDesign', {design: JSON.stringify(canvas), thumbnail: canvas.toDataURL({format: 'jpeg'})});
    //var win = window.open();
    //win.document.write('<iframe src="' + canvas.toDataURL({format: 'jpeg'})  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>'); // this gives a preview of the image, can be commented out if needs be
    document.getElementById('save').style.display = "grid";
    socket.emit('getDesignNames');
    socket.on('retrieveDesignNames', (names) => {
        console.log("design names got");
        names.forEach((name) => {
            let currentName = document.createElement("div");
            let nameBut = document.createElement("button");
            nameBut.classList.add("saveButton");
            nameBut.innerHTML = name;
            nameBut.onclick = () => {
                document.getElementById('save').style.display = "none";
                socket.emit('saveDesign', {design: JSON.stringify(canvas), thumbnail: canvas.toDataURL({format: 'jpeg', width:(canvasWidth*canvas.getZoom()), height:(canvasHeight*canvas.getZoom())})}, name);
            }
            if(!recordedSaveNames.includes(name)){
                currentName.appendChild(nameBut);
                document.getElementById("saveContent").appendChild(currentName);
            }
            recordedSaveNames.push(name);
        });
        
    })
    /*
    let designName = prompt("Name your deisgn");
    designName.trim();
    if(designName.length > 0){
        socket.emit('saveDesign', {design: JSON.stringify(canvas), thumbnail: canvas.toDataURL({format: 'jpeg'})}, designName);
    }
    */
    // socket.emit('saveDesign', {design: JSON.stringify(canvas), thumbnail: canvas.toDataURL({format: 'jpeg', left:"0", top: "0", height:canvasHeight, width: canvasWidth})});    // the parameters other than format do not work currently
    var win = window.open();
    win.document.write('<iframe src="' + canvas.toDataURL({format: 'jpeg', width:(canvasWidth*canvas.getZoom()), height:(canvasHeight*canvas.getZoom())})  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>'); // this gives a preview of the image, can be commented out if needs be
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
    for (var i of canvas.getObjects()) {
        if (i.id != 'DONTDELETE') {
            canvas.remove(i);
        }
    }    
    canvas.backgroundImage = false; // remove any possible background image
    canvas.renderAll();
}

document.getElementById("close").onclick = () => {
    document.getElementById("load").style.display = "none";
    document.getElementById("save").style.display = "none";
}

let recordedLoadNames = [];
// Sends to the server asking for data of hardcoded design
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
                    document.getElementById("loadContent").appendChild(currentName);
                }
                recordedLoadNames.push(name);
            });
            
        }
    });
}

// Server responds with JSON design data, load it onto canvas
socket.on('loadDesignResponse', (res) => {

});
// End of header code

socket.on("backgroundColourUpdate", (data) => {
    console.log("newBgColour", data)
    canvas.backgroundColor = data;
    canvas.renderAll()
});


// Below is code for buttons in footer
// Get template image and format it as canvas background image, send emit to ell other client to do so
function importTemplate(template, dontEmit) {
    fabric.Image.fromURL(template, function (img) {
        // The don't emit thing will be implemented later
        if (!dontEmit) {
            socket.emit('importTemplate', template)
        }

        if (img.height < img.width) {
            // Scale to height (means it works better on landscape resolutions)
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
        console.log(canvas.backgroundImage);

        canvas.renderAll();
    })
}

function importTemplatePopup() {
    const popup = document.getElementById("_templateContainer");
    popup.style.display = "flex";
}

window.onload = function() {
    // Since templates will only be updated infrequently, request templates should only be called on page load rather than each time template window is opened
    socket.emit('requestTemplates');
}

socket.on('templateResponse', (templates) => {
    console.log(templates);  //Start by converting this to an image
    const templateGrid = document.getElementById("_templateGrid");
    if (templates.length == 0) {
        alert("No templates to show");
    } else {
        templates.forEach((template) => {
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

socket.on('importTemplate', (template) => {
    importTemplate(template, true); // figure out solution for the first param later
})

function leaveRoom() {
    socket.emit("leaveRoom");
    window.location.href = "/home";
}