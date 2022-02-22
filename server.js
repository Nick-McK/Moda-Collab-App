const express = require("express");
const app = express()
const http = require("http");
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);
const router = express.Router();
const fs = require("fs");
const session = require("express-session")
const {v4: uuidv4} = require("uuid");
const mysql = require("mysql");
const MySQLStore = require("express-mysql-session")(session);
const mongoose = require("mongoose");
const mongoURL = 'mongodb://localhost:27017';
const path = require("path");
const res = require("express/lib/response");
const { profile } = require("console");
const fileUpload = require("express-fileupload");
const { isBuffer } = require("lodash");

// Use files from within the file structure
app.use(express.static(__dirname)); // Serves html files
app.use(express.static(__dirname + "/public")); //serving style sheets and js files
app.use(express.static(__dirname + "/public/assets")); // different assets for pages
// Used for parsing request types like POST and GET etc.
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

//all code for mongoDB is commented out as not everyone has mongoDB set up

//connects to mongodb for storing designs

mongoose.connect(mongoURL, (err) =>{
    if(err) throw err;
    console.log("Connected to MongoDB")
});

let designs = mongoose.connection.useDb('ModaLab');


// Database connection using mySQL version 5 (I think)
let con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "modacollab",
    database: "moda collab"
})
// Connect to the database and give an error if there are any errors, keep this
con.connect((err) => {
    if (err) throw err;
    console.log("connected to database");
})

let options = {
    host: "localhost",
    port: "3306",
    user: "root",
    password: "modacollab",
    database: "moda collab",
    schema: {
        tableNamme: "sessions",
        columnNames: {
            session_id: "session_id",
            expires: "expires",
            data: "data"
        }
    }
}


const sessionStore = new MySQLStore(options, con);

const sessionMiddleware = session({
    genid: (req) => {
        return uuidv4();
    },
    secret: "secret", // This should be some random string of characters ideally
    name: "sid", // Name of the cookie storing the session id
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 300000, // 1000 * 60 * 60 * 24 Sets the cookie to last for 1 day. (Set to 60000 for testing)
        sameSite: "lax", // Lax means cookies can be saved across the same domain
        // Ideally we would use secure: true, however this requires a HTTPS website which we do not have for this project
    }
})

// This is socket session middleware that lets us use sessions with the socket library
app.use(sessionMiddleware);
// Use is from express and we are telling the socket library to use the following middleware
// We cant write to the session data from socket using this -> we can use a library called express-socket.io-session to write from socket to the session.
io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
})

app.use(fileUpload({
    debug: true,
}));




// These are used to modify the session table in the database
// Probably use these to retrive session data like after we log in/use to authenticate users which is faster than database

// sessionStore.destroy(sid, (error) => {
    
// })

// sessionStore.get(sid, (error, session) => {

// })

// sessionStore.set(sid, session, (error) => {

// })


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

app.get("/account/tags", (req,res) => {
    res.sendFile(__dirname + "/tags.html");
});

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
var nameOfUser;
app.post("/home", (req, res) => {
    const username = req.body.username;

    const password = req.body.password;
    const sid = req.session.id;

    con.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, result) => {
        if (err) {
            throw err;
        }
        if (result.length > 0) {
            result.find((user, index) => {
                if (user.username == username && user.password == password) {
                    // Session stuff
                    req.session.username = username;
                    nameOfUser = username;
                    req.session.loggedIn = true;
                    console.log("welcome", req.session.username, " here is your session ", req.session);
                    console.log()
                    console.log("and the id: ", sid);

                    // Could possibly assign user ID's to increase security
                    res.cookie("uName", JSON.stringify(req.session.username), {
                        maxAge: 60000, 
                        secure: process.env.NODE_ENV !== "development",
                        httpOnly: true});


                        

                    sessionStore.set(req.session.id, req.session, (error) => {
                        if (error) throw error;

                        console.log("session stored");
                    })

                    
                    
                    res.sendFile(path.join(__dirname + "/Homepage.html"));
                    
                }
                    
            })
        } else {
            req.session.loggedIn = false;
            res.send("you dont have an account");
        }
    });
})


app.get("/home", (req, res) => {
    res.sendFile(path.join(__dirname + "/Homepage.html"));
})
// Get request to show the users profile - Will need to make this user specific 
app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname + "/profile.html"));
})

// Maybe make post request to profile page for x user for PP upload
app.post("/profile", (req, res) => {
    let uploadPath;

    console.log("asasdfasdf", req.files);

    if (!req.files) {
        return res.status(400).send("No files were uploaded");
    }




    uploadPath = __dirname + "/server/" + req.files.profilePic.name;

    console.log("upload path", uploadPath);

    req.files.profilePic.mv(uploadPath, (err) => {
        if (err)
            return res.status(500).send(err);

        console.log("file uploaded");

        res.send("file uploaded");
    });
    
    // res.sendFile(path.join(__dirname + "/profile.html"));
});

app.get("/communities", (req, res) => {
    res.sendFile(path.join(__dirname + "/communities.html"));

})

let roomList = new Array();

// Abstracted this because it is duplicated
// Get the keys for the rooms which will give us room names this is then passed to the client to be drawn onto the available rooms to join list in the homepage
function handleRoomCreation() {
    Object.keys(rooms).forEach(room => {
        if (!roomList.find(r => { return r.roomName === room; })) {
            roomList.push({roomName: room, objects: [], objIdCounter: 0, background: ''});
            console.log("roomList", roomList);
            io.emit("roomNames", roomList.map(function (ro) {return ro.roomName}));
        }
    });
}

// app.get("/collab_room/verify/:roomName", (req, res) => {

// }) 
    




// this only runs when collab room is entered
app.post("/collab_room", (req, res) => {
    if (rooms[req.body.roomName] != null) {
        return res.redirect("/home");   // This closes the collab menu currently, figure out way to keep it open
    }
    rooms[req.body.roomName] = {users: {}, roomPass: {}};
    console.log(rooms);
    rooms[req.body.roomName].roomPass = req.body.roomPass;
    res.redirect("/collab_room/" + req.body.roomName);
    // This is duplicated lower down, for some reason when using only 1 the rooms dont load until a refresh or
    // They only load when you create them and are lost when refreshed
    // handleRoomCreation();

})
// Gobal session variable to add to the users list in rooms in sockets


let usersSocketMap = new Map();
let sessionMap = new Map();

app.get("/collab_room/:roomName", (req, res) => {
    // console.log("rooms", rooms);
    // users[req.sessionID] = req.session.username;
    
    
    console.log("users in room: ", req.params.roomName, " are: ", users)
    
    res.sendFile(__dirname + "/collab_room.html");
})

const connectedUsers = [];

let roomName; // Used to assign the users room to a global variable to be used outside of just the join update

let usersInRoom;
// When we connect give every use the rooms available
io.sockets.on('connect', (socket) => {

    console.log("socket sessionID", socket.request.session)
    // Store the socket id from socket just in case we need it (not sure if we will)
    let sock = socket.request.session.socketio = socket.id;
    socket.request.session.save();


    // app.get("/collab_room/:roomName", (req, res) => {
    //     // console.log("rooms", rooms);
    //     console.log("user ", req.session.username, " is being added to the room", req.params.roomName);
    //     users[socket.id] = req.session.username;
    //     console.log("path", req.params.roomName);
    //     socket.join(req.params.roomName);
    //     console.log("users in room: ", req.params.roomName, " are: ", users)
    //     console.log()
    //     console.log(req.session);
    
    //     socket.on("joined", (data) => {
    //         users[req.sessionID] = req.session.username;
    //         socket.join(req.params.roomName);
    //     })


    //     console.log(rooms);


    //     res.sendFile(__dirname + "/collab_room.html");
    // })

    console.log("A user connected", socket.id);
    connectedUsers.push(socket);

    

    // Use session to save the users socket and add them to the room when they click join room

    socket.on("joined", (data) => {

        console.log("roompass", data.roomPass);

        // rooms[data.roomName].roomPass = data.roomPass;

        console.log("room password", rooms[data.roomName].roomPass);


        
        usersSocketMap.set(socket.request.session.id, socket.id);

        console.log("socketMap", usersSocketMap);
        console.log("session username", socket.request.session.username);

        users[socket.request.session.id] = socket.request.session.username;
        console.log("users", users);
        rooms[data.roomName].users[socket.request.session.id] = socket.request.session.username;
        console.log("rooms", rooms)
        socket.join(data.roomName);
        
        
        // use rooms[roomToJoin].users instead of users to get only users in the given room
        let userVals = Object.values(rooms[data.roomName].users); // Pass this to the client and we can loop through to find the usernames
        
        roomName = data.roomName;
        io.to(roomName).emit("users", {usernames: userVals, sessionID: socket.request.session.id, room: roomName});     //do we need to send session and room?


        for (var i in roomList) {
            if (roomList[i].roomName == roomName) {
                for (var j in roomList[i].objects) {
                    socket.emit('canvasUpdate', {change: roomList[i].objects[j], type: "add"}); 
                }

                if (roomList[i].background) {
                    socket.emit("importTemplate", roomList[i].background);
                }
            }
        }
    });

    socket.on("verify", (data) => {
        console.log("password for the room", data.password);
        if (data.password == rooms[data.roomName].roomPass) {
            socket.emit("redirect", (roomName));
        }
    })

    socket.on('giveRooms', () => {
        socket.emit('roomNames', roomList.map(function (ro) {return ro.roomName}));
    });

    // let roomList = new Array();
    handleRoomCreation();

    // Whiteboard stuff
    connectedUsers.push(socket);

    var t = socket.request.session.username;
	var x;
	con.query("SELECT userID FROM users WHERE username = ?", [t], (err, result) => {
		
        if (err) {
            throw err;
        }
		x = result[0]; 
		console.log(x);
	})

	console.log(x);
	socket.on("fat", () => {con.query("SELECT * FROM tags WHERE userID = ?", [x], (err, result) => {
        if (err) {
            throw err;
        }
		socket.emit("fuckKnows", result);
		console.log(result);
	})});

    socket.on("canvasUpdate", (data) => {
        switch(data.type) {
            // each type of call is sent in a slightly different way
            case "add":
                addObj(data.change);
                
                break;
            case "remove":
                removeObj(data.change);

                break
            case "mod":
                data.change.id = data.id;
                modObj(data.change);

                break;
            case "deleteDesign":
                deleteDesign();

                break;
        }

        console.log("roomName to console", roomName);
        socket.to(roomName).emit("canvasUpdate", data);
 
    });

    socket.on("NewProfilePic", profilePic => {
        console.log("proffff", profilePic);
        con.query("INSERT INTO user_details (profilePicture) VALUES = ?", [profilePic], (err, result) => {
            console.log("profile pic added", result);
        })
    })

    function addObj(data, ignore, loadDesign) {
        for (var i in roomList) {
            if (roomList[i].roomName == roomName) {
                data.id = roomList[i].objIdCounter;
                roomList[i].objects.push(data);
                roomList[i].objIdCounter++;

                if (loadDesign) {
                    io.to(roomList[i].roomName).emit('canvasUpdate', {change: data, type: "add"});            
                }
            }
        }

        if (!ignore) {
            socket.emit("idUpdate", data.id);
        }
    }

    function removeObj(data) {
        for (var i in roomList) {
            if (roomList[i].roomName == roomName) {
                for (var j in roomList[i].objects) {
                    if (roomList[i].objects[j].id == data) {
                        delete roomList[i].objects[j];
                    }
                }
            }
        }
    }

    function modObj(data) {
        for (var i in roomList) {
            if (roomList[i].roomName == roomName) {
                for (var j in roomList[i].objects) {
                    if (roomList[i].objects[j].id == data.id) {
                        roomList[i].objects[j] = data;
                        roomList[i].objects[j].id = data.id;
                    }
                }
            }
        }
    }

    function deleteDesign() {
        for (var i in roomList) {
            if (roomList[i].roomName == roomName) {
                roomList[i].background = false;
                roomList[i].objects = [];
            }
        }
    }

    socket.on("saveDesign", (data, designName) => {
        /*
        fs.writeFile("designsTemp/designTest.json", data.design, (err) => {
            socket.emit("saveDesignResponse", (!err));
            if (err) {
                throw err;
            }
        }); 
        */
        
        //convert design string to JSON then save JSON to Design database
        data.design = data.design.slice(0, data.design.length - 1);
        data.design += ", \"name\": \"" + designName + "\"";
        data.design += ", \"user\": \"" + nameOfUser + "\"}";
        const designJSON = JSON.parse(data.design);
        designs.collection("Designs").insertOne(designJSON, (err) => {
            socket.emit("saveDesignResponse", (!err));
            if(err) throw err;
        });
        
    });

    socket.on('getDesignNames', (res) => {
        const designList = designs.collection("Designs").find({user: nameOfUser});
        let i = 0;
        let namesList = [];
        
        designList.forEach((current) => {
            namesList[i] = current.name;
            console.log(namesList[i]);
            i++;
        }).then(() => {
            console.log("number of iterations " + i);
            socket.emit('retrieveDesignNames', (namesList));
        })

    })

    // Maybe make it so it removes all other objects when load design is called
    socket.on('loadDesign', (designName) => {
      /*
        fs.readFile('designsTemp/' + data.name, 'utf-8', (err, data) => {
            if (err) throw err;
            io.to(roomName).emit('loadDesignResponse', data);

            deleteDesign();     // remove previous design
            io.to(roomName).emit("canvasUpdate", {type: "deleteDesign"}); // tell clients to remove previous design


            //find out how to get the objects from the json file
            var objs = JSON.parse(data).objects

            for (var i in objs) {
                addObj(objs[i], true, true);
            }
            
            for (var i in roomList) {
                if (roomList[i].roomName == roomName) {
                    if (JSON.parse(data).backgroundImage) {
                        roomList[i].background = JSON.parse(data).backgroundImage;
                        io.to(roomList[i].roomName).emit("importTemplate", roomList[i].background);
                    }
                    roomList[i].background = data;
                }
            }
        });
        */
        
        //code to load design from database 
        const design = designs.collection("Designs").findOne({name: designName, user: nameOfUser});
        design.then((data) => {
            console.log(JSON.stringify(data));
            io.to(roomName).emit('loadDesignResponse', data);

            deleteDesign();     // remove previous design
            io.to(roomName).emit("canvasUpdate", {type: "deleteDesign"}); // tell clients to remove previous design

            
            //find out how to get the objects from the json file
            var objs = data.objects

            for (var i in objs) {
                addObj(objs[i], true, true);
            }
            console.log("Design Loaded");
            // i don't know what this code does but everything seems to work without so its getting commented out for now
            /*
            for (var i in roomList) {
                if (roomList[i].roomName == roomName) {
                    if (JSON.parse(data).backgroundImage) {
                        roomList[i].background = JSON.parse(data).backgroundImage;
                        io.to(roomList[i].roomName).emit("importTemplate", roomList[i].background);
                    }
                    roomList[i].background = data;
                }
            }*/
        })
    });

    socket.on("importTemplate", (data) => {
        for (var i in roomList) {
            if (roomList[i].roomName == roomName) {
                roomList[i].background = data;
                socket.to(roomList[i].roomName).emit("importTemplate", data);
            }
        }
    });

    socket.on("leaveRoom" , () => {
        
        socket.leave(roomName);
        console.log("")
        console.log("leaving room:", rooms[roomName],"username leaving", rooms[roomName].users[socket.request.session.id])
        io.to(roomName).emit("userLeave", {username: rooms[roomName].users[socket.request.session.id]}); // allow other clients to update participants
        delete rooms[roomName].users[socket.request.session.id];
        
    });
    socket.on("details", () => {
        socket.emit("accountDetails", {username: socket.request.session.username});
    })
    

});

app.use(router);
server.listen(3000, () => {
    console.log("Listening on port *: 3000")
});