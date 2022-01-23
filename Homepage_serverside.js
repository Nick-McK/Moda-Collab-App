const express = require("express");
const app = express()
const http = require("http");
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);
const router = express.Router();

const path = require("path");

// Use files from within the file structure
app.use(express.static(__dirname)); // Serves html files
app.use(express.static(__dirname + "/public")); //serving style sheets and js files
app.use(express.static(__dirname + "/public/assets")); // different assets for pages

app.use(express.json());
app.use(express.urlencoded({ extended: true}));


let rooms = {};

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/Homepage.html"));
});

// app.get("/collab_room", (req, res) => {
//     res.sendFile(path.join(__dirname + "/collab_room.html"));
// });

// Handles the post event which takes us to the collab_room that we create
app.post("/collab_room", (req, res) => {
    if (rooms[req.body.roomName] != null) {
        return res.redirect("/");   // This closes the collab menu currently, figure out way to keep it open
    }
    rooms[req.body.roomName] = {users: {} };
    console.log(rooms);
    res.redirect("/collab_room/" + req.body.roomName);
    // This is duplicated lower down, for some reason when using only 1 the rooms dont load until a refresh or
    // They only load when you create them and are lost when refreshed
    let roomList = new Array();
    Object.keys(rooms).forEach(room => {
        if (!roomList.includes(room)) {
            roomList.push(room);
            console.log("roomList", roomList);
            io.emit("roomNames", roomList);
        }
    });
})


app.get("/collab_room/:roomName", (req, res) => {
    // console.log("rooms", rooms);
    res.sendFile(__dirname + "/collab_room.html");
})



// When we connect give every use the rooms available
io.on('connect', (socket) => {
    console.log("A user connected", socket.id);
    let roomList = new Array();
    Object.keys(rooms).forEach(room => {
        if (!roomList.includes(room)) {
            roomList.push(room);
            console.log("roomList", roomList);
            io.emit("roomNames", roomList);
        }
    });

    


    socket.on("start", (answer) => {
        



        io.emit("collabTime");
        // res.sendFile(__dirname + "/collab_room.html");
    });

});

app.use(router);
server.listen(3000, () => {
    console.log("Listening on port *: 3000")
})