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

    console.log(ctx)
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
        break;

        case 'move':
            if (drawFlag) {
                draw();
            }
            break;
    }
}

function sendData() {

}