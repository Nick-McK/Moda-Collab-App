const express = require("express");
const app = express()
const http = require("http");
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);
const router = express.Router();
const fs = require("fs");

const mysql = require("mysql");

// Probably use session cookies from express.session to save the session and get users
const session = require("express-session")

const path = require("path");
const { createCanvas, Image } = require("canvas");
const { fstat } = require("fs");

// Use files from within the file structure
app.use(express.static(__dirname)); // Serves html files
app.use(express.static(__dirname + "/public")); //serving style sheets and js files
app.use(express.static(__dirname + "/public/assets")); // different assets for pages
// Used for parsing request types like POST and GET etc.
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

app.use(session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
    
}))

// Database connection using mySQL version 5 (I think)
let con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "modacollab",
    database: "moda collab"
})
con.connect((err) => {
    if (err) throw err;
    console.log("connected to database");
})

let rooms = {};
let users = {};

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/landing_page.html"));
})

app.get("/account/login", (req, res) => {
    res.sendFile(path.join(__dirname + "/login.html"))
})

app.get("/account/register", (req, res) => {
    res.sendFile(path.join(__dirname + "/register.html"));
})

app.post("/account/tags", (req, res) => {
    // Get the username and password from the inputs on register page
    let userCheck = req.body.username;
    let passCheck1 = req.body.pass1;
    let passCheck2 = req.body.pass2;
    // If the three fields have text in them (probably dont need this since they are all required fields but just to be safe)
    if (userCheck && passCheck1 && passCheck2) {
        // If password 1 and password 2 are matching then insert into the database and take to the tags page
        if (passCheck1 == passCheck2) {
            con.query("INSERT INTO users (username, password) VALUES (?, ?)", [req.body.username, req.body.pass1], (err, result) => {
                if (err) throw err;
                console.log("inserted into table users the username: " + req.body.username + " and password: " + req.body.pass1);
                res.sendFile(path.join(__dirname + "/tags.html"));
            });
        } else {
            // Do some error handling and tell them to make sure that password 1 and password 2 match
        }
    }
})

app.post("/home", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    console.log("user", username);
    console.log("pass", password);

    con.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, result) => {
        if (err) throw err;
        console.log("we retrieved", result);

        if (result.length > 0) {
        
        // Returns a set of keys from the result that we can then loop over then we can get certain column details
        Object.keys(result).forEach((key) => {
            console.log("rowname", result[key].username)
            if (result[key].username == username && result[key].password == password) {
                res.sendFile(path.join(__dirname + "/Homepage.html"));
            }
        });
        } else {
            res.send("you dont have an account");
        }
    });
})


app.get("/home", (req, res) => {
    res.sendFile(path.join(__dirname + "/Homepage.html"));
})

// DO SOMETHING WITH THIS WHERE WE CHECK IF THE PERSON IS LOGGED IN AND IF THEY ARE THEN THEY CAN GO TO THIS PAGE
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

const connectedUsers = [];
const canvas = createCanvas(2000,2000);
const ctx = canvas.getContext("2d");

let objIdCounter = 0;
let roomName; // Used to assign the users room to a global variable to be used outside of just the join update

// When we connect give every use the rooms available
io.on('connect', (socket) => {

    console.log("A user connected", socket.id);
    connectedUsers.push(socket);

    // Use session to save the users socket and add them to the room when they click join room

    socket.on("joined", (data) => {
        console.log("user", data.user);
        users[socket.id] = data.user;
        socket.join(data.room);
        console.log("users", users);
        roomName = data.room;
    })

    
    let roomList = new Array();
    Object.keys(rooms).forEach(room => {
        if (!roomList.includes(room)) {
            roomList.push(room);
            console.log("roomList", roomList);
            io.emit("roomNames", roomList);
        }
    });
    
    // Whiteboard stuff
    connectedUsers.push(socket);

    let img = new Image;

    socket.on("canvasUpdate", (data) => {
        // img.onload = () => { ctx.drawImage(img, 0, 0); }
        // img.src = data.image;
        // console.log("room", data.roomName);
        // socket.to(data.roomName).emit("canvasUpdate", canvas.toDataURL());

        switch(data.type) {
            case "add":
                data.change.id = objIdCounter;
                socket.emit("idUpdate", data.change.id);
                objIdCounter++;
                break;
            case "remove":
                break
            case "mod":
                break
        }

        console.log("roomName to console", roomName);
        socket.broadcast.to(roomName).emit("canvasUpdate", data);
 
    });

    socket.on("saveDesign", (data) => {
        fs.writeFile("designsTemp/designTest.json", data.design, (err) => {
            socket.emit("saveDesignResponse", (!err));
            if (err) {
                throw err;
            }
        });
    });

    socket.on('loadDesign', (data) => {
        fs.readFile('designsTemp/' + data.name, 'utf-8', (err, data) => {
            if (err) throw err;
            io.to(roomName).emit('loadDesignResponse', data);
        });
    });

    socket.on("importTemplate", (data) => {
        socket.broadcast.to(data.room).emit("importTemplate", data);
    });



});


app.use(router);
server.listen(3000, () => {
    console.log("Listening on port *: 3000")
})
