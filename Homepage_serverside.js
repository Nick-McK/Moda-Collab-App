const express = require("express");
const app = express()
const http = require("http");
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);
const router = express.Router();

const path = require("path");

// Use files from within the file structure
app.use(express.static(__dirname));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/Homepage.html"));
});

app.get("/collab_room", (req, res) => {
    res.sendFile(__dirname + "/collab_room.html");
});




io.on('connect', (socket) => {
    console.log("A user connected", socket.id);


    socket.on("start", (req, res) => {
        io.emit("collabTime");
        // res.sendFile(__dirname + "/collab_room.html");
    });

});

app.use(router);
server.listen(3000, () => {
    console.log("Listening on port *: 3000")
})