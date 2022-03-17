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
const ObjectId = require("mongodb").ObjectId; // Lets us find entries in MongoDb using the objectId

const path = require("path");
const { profile } = require("console");
const fileUpload = require("express-fileupload");
const { isBuffer, forEach } = require("lodash");
const { createSocket } = require("dgram");
const { emitWarning } = require("process");

// Use files from within the file structure
app.use(express.static(__dirname)); // Serves html files
app.use(express.static(__dirname + "/public")); //serving style sheets and js files
app.use(express.static(__dirname + "/public/assets")); // different assets for pages
// Used for parsing request types like POST and GET etc.
app.use(express.json());
app.use(express.urlencoded({ extended: true}));


app.use((req, res, next) => {
    req.io = io;
    return next();
})

//all code for mongoDB is commented out as not everyone has mongoDB set up

//connects to mongodb for storing designs

mongoose.connect(mongoURL, (err) =>{
    if(err) throw err;
    console.log("Connected to MongoDB");
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
    req.session.loggedIn = false;
    res.sendFile(path.join(__dirname + "/login.html"))
})

app.get("/account/register", (req, res) => {
    res.sendFile(path.join(__dirname + "/register.html"));
})

app.get("/account/tags", (req,res) => {
    let initialStrikes = 0;
    req.session.strikes = initialStrikes;
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
                console.log("inserted into table users the username: " + req.body.username + " and password: " + req.body.pass1, "and ID: ", result.insertId);
                req.session.userID = result.insertId; // This gives us the ID of the user so we dont need to query DB every time we want to know
                console.log("user id: " + req.session.userID);
                req.session.save();

                con.query("INSERT INTO user_details (userID, email, contactNo, role, strikes, isMod) VALUES (?, ?, ?, ?, ?, ?)", [req.session.userID, req.body.email, req.body.contactNo, req.body.role, 0, false], (err,res) => {
                    if (err) throw err;
                    console.log("res", res);
                    let initialStrikes = 0; // cannot set a session variable to just a number so set a variable to 0 and set to strike count -> only done on register
                    req.session.strikes = initialStrikes;
                });



                res.sendFile(path.join(__dirname + "/tags.html"));
            });

           
        } else {
            // Do some error handling and tell them to make sure that password 1 and password 2 match
        }
    }
})
var nameOfUser;
app.post("/home", (req, res) => {
    // If we are on the login page (the only place where username input field is present) then login
    // Doing thus lets us make mulitple post requests to the homepage and have different results based on the page
    if(req.body.username) {

        

        const username = req.body.username;

        const password = req.body.password;
        const sid = req.session.id;

        con.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, result) => {
            if (err) {
                throw err;
            }
            
            // console.log("---------------", result);

            if (result.length > 0) {
                result.find((user, index) => {
                    if (user.username == username && user.password == password) {
                        // Session stuff
                        req.session.username = username;
                        nameOfUser = username;
                        req.session.loggedIn = true;
                        req.session.userID = user.userID;
                        console.log("welcome", req.session.username, "userID:", req.session.userID,"here is your session ", req.session);
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
    }
    
})



//TODO: Put in error handling if we are not logged in
app.get("/home", (req, res) => {
    // If the user is logged in then let them access page
    if (req.session.loggedIn) {
        console.log("strikes", req.session.strikes);
        res.sendFile(path.join(__dirname + "/Homepage.html"));
    } else {
        // res.send("log in");
        res.sendFile(path.join(__dirname + "/Homepage.html"));
    }
    
    
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

    const folderName = "./server/" + req.session.userID;

    try {
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName);
        }
    } catch (err) {
        console.error(err);
    }
    

    uploadPath = __dirname + "/server/" + req.session.userID + "/" + req.files.profilePic.name;

    console.log("upload path", uploadPath);

    req.files.profilePic.mv(uploadPath, (err) => {
        if (err)
            return res.status(500).send(err);

        console.log("file uploaded");


        // get all names of files in /public/assests/templates folder
        serverFolder = [];
        serverFolderPath = './server/' + req.session.userID + "/";
        fs.readdirSync(serverFolderPath).forEach(file => {
            serverFolder.push(file);
        });

        // console.log("dataaaa", data.profileImg)

        // con.query("SELECT userID FROM users WHERE username = ?", [data.username], (err, result) => {
        //     if (err) throw err;
        //     console.log("username from profile", result);

            for (var i in serverFolder) {
            
                
                const data = fs.readFileSync(serverFolderPath+serverFolder[i], {encoding:'base64'})
                const buf = Buffer.from(data,"base64");
                
                con.query("UPDATE users SET profilePicture = ? WHERE userID = ?", [buf, req.session.userID], (err, res) => {
                    if (err) throw err;
    
                    console.log("this is our new profile pic", res);
                });
            }
        // });







        res.sendFile(path.join(__dirname + "/profile.html"));
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

app.get("/moderator/posts", (req,res) => {
    res.sendFile(__dirname + "/mods-home.html");
})


// This is to update the templates table if new templates have been added, runs every 5 mins, or on server start
function updateTemplateTable() {
    // get all names of files in /public/assests/templates folder
    templateFolder = [];
    templateFolderPath = './public/assets/templates/'
    fs.readdirSync(templateFolderPath).forEach(file => {
        templateFolder.push(file);
    });

    con.query("SELECT name FROM templates", (err, result) => {
        if(result != null){

        
            let retrievedTemplateNames = []
            for (var l of result) {
                retrievedTemplateNames.push(l.name);
            }
            for (var i in templateFolder) {
                const fileName = templateFolder[i].toString().slice(0,-4).toLowerCase()
                if (!retrievedTemplateNames.includes(fileName)) {
                    const data = fs.readFileSync(templateFolderPath+templateFolder[i], {encoding:'base64'})
                    const buf = Buffer.from(data,"base64");
                    con.query("INSERT INTO templates (name, image) VALUES (?, ?)", [fileName,buf], (err) => {
                        if (err) {
                            console.log("fail");
                            console.log(err);
                        } else {
                            console.log("success");
                        }
                    });
                }
            }
        }
    });
    setTimeout(updateTemplateTable, 500000) // This runs the code every 5 min
};
updateTemplateTable();  //Initial function call at start


const connectedUsers = [];

let roomName; // Used to assign the users room to a global variable to be used outside of just the join update

let usersInRoom;
// When we connect give every use the rooms available
io.sockets.on('connect', (socket) => {

    // console.log("socket sessionID", socket.request.session)
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

        if (rooms[data.roomPass]?.roomPass === undefined) {
            console.log("no room password, server would've crashed")
        } else {
            console.log("room password", rooms[data.roomName].roomPass);
        }
        


        
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

        // give new users existing collab room data
        for (var i in roomList) {
            if (roomList[i].roomName == roomName) {
                for (var j in roomList[i].objects) {
                    socket.emit('canvasUpdate', {change: roomList[i].objects[j], type: "add"}); 
                }

                if (roomList[i].background) {
                    socket.emit("importTemplate", roomList[i].background);
                }

                if (roomList[i].backgroundColor) {
                    socket.emit("canvasUpdate", {change: roomList[i].backgroundColor, type:"bgColour"});
                }
            }
        }
    });

    socket.on("verify", (data) => {
        console.log("password for the room", data.password);
        if (data.password == rooms[data.roomName].roomPass) {
            socket.emit("redirect", (data.roomName));
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
	})

	console.log(x);
	socket.on("fat", () => {con.query("SELECT * FROM tags WHERE userID = ?", [x], (err, result) => {
        if (err) {
            throw err;
        }
		socket.emit("fuckKnows", result);
		console.log(result);
	})});

    socket.on("canvasUpdate", (data, callback) => {
        console.log(data.type,data);

        switch(data.type) {
            // each type of call is sent in a slightly different way
            case "add":
                var id = addObj(data.change);
                if (callback) {
                    callback(id);
                }
                
            break;
            case "addErased":
                addErased(data.change);
            break;
            case "bgColour":  // for background colour change
                bgColourChange(data.change);
            break;
            case "remove":
                removeObj(data.change);
            break;
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
        con.query("UPDATE users (profilePicture) VALUES = ?", [profilePic], (err, result) => {
            console.log("profile pic added", result);
        })
    })

    function addObj(data, ignore, loadDesign) {     //ignore probably isn't needed anymore, not 100% sure though
        for (var i in roomList) {
            if (roomList[i].roomName == roomName) {
                if (data.id == null) {      // if id is unassigned, assign it and increment id counter
                    data.id = roomList[i].objIdCounter;
                    roomList[i].objIdCounter++;
                }
                
                
                roomList[i].objects.push(data);
                console.log("newObj", data)

                if (loadDesign) {
                    io.to(roomList[i].roomName).emit('canvasUpdate', {change: data, type: "add"});            
                }
            }
        }

        // if (ignore) { // this should be called on a user loading into the room, they need to add the objects but not assign new ids
        //     // console.log("sending");
        //     // socket.emit("idUpdate", data.id);
        //     return null;
        // }

        return data.id;
    }

    // This is for updating the objects that have been clipped by an eraser line
    function addErased(data) {
        // for (var i in data.obj) {
        //     console.log(data.obj[i].clipPath.objects);
        // }
        for (var i in roomList) {
            if (roomList[i].roomName == roomName) {
                for (var j in roomList[i].objects) {
                    for (var n in data) {
                        console.log("here",data[n])
                        if (data[n].id == roomList[i].objects[j].id) {
                            roomList[i].objects[j] = data[n];
                        }
                    }
                }
            }
        }
    }

    function bgColourChange(data) {
        for (var i in roomList) {
            if (roomList[i].roomName == roomName) {
                roomList[i].backgroundColor = data;
            }
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
                console.log("roomObjs",roomList[i].objects);
            }
        }
    }

    function modObj(data) {
        for (var i in roomList) {
            if (roomList[i].roomName == roomName) {
                for (var j in roomList[i].objects) {
                    // console.log(roomList[i].objects[j], data.id);
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
        data.design += ", \"thumbnail\": \"" + data.thumbnail + "\"";
        data.design += ", \"name\": \"" + designName + "\"";
        data.design += ", \"user\": \"" + socket.request.session.username + "\"}";
        const designJSON = JSON.parse(data.design);
        console.log("this is our JSON string", designJSON);
        designs.collection("Designs").findOne({name: designName}, (err, res) => {

            console.log(res, "----------------------------------")
            if(res === null){
                console.log("what is this fucking shit");
                designs.collection("Designs").insertOne(designJSON, (err, res) => {
                    if (err) throw err;
                    console.log("this is our responding", res.insertedId);
                    socket.emit("saveDesignResponse", (!err));
                    // if(err) throw err;
                    console.log("what is this thing", res.insertedId.toString());
                    let stringObjID = res.insertedId.toString();

                    con.query("INSERT INTO designs (design, creatorID) VALUES (?, ?)", [stringObjID, socket.request.session.userID], (err, result) => {
                        if (err) throw err;
                        console.log("inserted the design into designs with id:", result.insertId);
                    });
                    con.query("INSERT INTO saveddesigns (savedBy, design, creatorID) VALUES (?, ?, ?)", [socket.request.session.userID, stringObjID, socket.request.session.userID], (err, result) => {
                        if (err) throw err;
                        console.log("design saved to saveddesigns with id:", result.insertId);
                    });
                });
            }else{
                designs.collection("Designs").findOneAndReplace({name: designName}, designJSON, (err) => {
                    socket.emit("saveDesignResponse", (!err));
                    if(err) throw err;
                });
            }
        })

        
    });
    
    let _designList = new Array();
    socket.on("getSavedDesigns", (data) => {

        con.query("SELECT design FROM saveddesigns WHERE savedBy = ?", [socket.request.session.userID], (err, result) => {
                if (err) throw err;
                // console.log("got this: -------------------------------", result);

                
                result.forEach(design => {
                    designs.collection("Designs").find({_id: new ObjectId(design.design)}, {projection: {_id: 0, name: 1, thumbnail: 1}}).toArray((err, result) => {
                        if (err) throw err;
                        // console.log("from mongo", result);
                        
                        _designList.push(result[0]); // Can hardcode the result to 0 because objectId's are unique so we only get 1 result
                        // console.log("designList--------", _designList);

                        sendClientDesigns(_designList, data);
                        
                        // socket.emit("savedDesigns", _designList);
                    });
                });
                // console.log("designList--------", _designList);
                
                
        });
        
    });
    
    function sendClientDesigns(designList, data) {
        if (data == 0) {
            socket.emit("savedDesigns", ({designs: designList, id: data}));
        } else if (data == 1) {
            socket.emit("savedDesigns", ({designs: designList, id: data}));
        }
    }



    socket.on('getDesignNames', () => {
        const designList = designs.collection("Designs").find({user: socket.request.session.username});
        let i = 0;
        let namesList = [];
        designList.forEach((current) => {
             namesList[i] = current.name;
            i++;
        }).then(() => {
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
        const design = designs.collection("Designs").findOne({name: designName, user: socket.request.session.username});
        design.then((data) => {

            deleteDesign();     // remove previous design
            io.to(roomName).emit("canvasUpdate", {type: "deleteDesign"}); // tell clients to remove previous design

            socket.on("savePost", () => {

            })

            //find out how to get the objects from the json file
            var objs = data.objects

            for (var i in objs) {
                addObj(objs[i], true, true);
            }
            console.log("Design Loaded");
            console.log(data._id);
            
            for (var i in roomList) {
                if (roomList[i].roomName == roomName) {
                    if (data.backgroundImage) {
                        roomList[i].background = data.backgroundImage;
                        io.to(roomList[i].roomName).emit("importTemplate", roomList[i].background);
                    }
                    roomList[i].background = data;
                }
            }
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

    socket.on("requestTemplates", () => {
        con.query("SELECT name, image FROM templates", (err, result) => {
            if (err) {
                throw err;
            } else {
                for (var i in result) { // dont touch this stuff pls, I have no clue how it works but it does - dan
                    result[i].image = Buffer.from(result[i].image).toString('base64');
                    result[i].image = "data:image/png;base64," + result[i].image.toString("base64");   //convert arraybuffer from blob to base64
                }
                socket.emit('templateResponse', result);
            }
        })
    })

    socket.on("leaveRoom" , () => {
        
        socket.leave(roomName);
        console.log("")
        console.log("leaving room:", rooms[roomName],"username leaving", rooms[roomName].users[socket.request.session.id])
        io.to(roomName).emit("userLeave", {username: rooms[roomName].users[socket.request.session.id]}); // allow other clients to update participants
        delete rooms[roomName].users[socket.request.session.id];
        
        // If there are no people in the room then after 5 mins delete
        if (rooms[roomName].users.length == undefined) {
            let start = 0;
            let TIMER = setInterval(() => {
                start++;
                
            if (start == 10) { //300 for 5 mins
                console.log("DELETED ROOM:", rooms[roomName]);
                delete rooms[roomName]
                roomList = roomList.filter(ro => ro.roomName != roomName);
                clearInterval(TIMER);
                io.emit("roomNames", roomList);
            }
            }, 1000);
        }
    });

    

    socket.on("details", () => {

        con.query("SELECT * FROM users", (err, result) => {
            if (err) throw err;
            console.log("this is our resssssss", result);

            socket.emit("accountDetails", {username: socket.request.session.username});
        })

        
    })
    
    socket.on("post", (postData) => {


        designs.collection("Designs").find({thumbnail: postData.image}, {projection: {_id: 1, name: 1, user: 1}}).toArray((err, result) => {
            if (err) console.log(err);
            let image = result[0]._id;
            let design = image.toString();
            let tags = [];
            if(postData.tagsList.length > 0){
               
                for(let i = 0; i<8; i++){
                    tags[i] = 0;
                }
                if(postData.tagsList.includes('streetware')){
                    tags[0] = 1;
                }
                if(postData.tagsList.includes('formal')){
                    tags[1] = 1;
                }
                if(postData.tagsList.includes('casual')){
                    tags[2] = 1;
                }
                if(postData.tagsList.includes('luxury')){
                    tags[3] = 1;
                }
                if(postData.tagsList.includes('vintage')){
                    tags[4] = 1;
                }
                if(postData.tagsList.includes('chic')){
                    tags[5] = 1;
                }
                if(postData.tagsList.includes('punk')){
                    tags[6] = 1;
                }
                if(postData.tagsList.includes('sportsware')){
                    tags[7] = 1;
                }
            }
            // code that's commented out is tags stuff
            /* none of this works bruh 
            con.query("SELECT postID FROM posts WHERE postName = ?", [postData.postName], (err, result) => {
               if (err) throw err;
               if(result.postID != null){
                   socket.emit("postAlreadyExists", (postData.postName));
               } else{

               }
            });
            */
            con.query("INSERT INTO posts (postName, postCaption, design, userID) VALUES (?, ?, ?, ?)", [postData.postName, postData.postCaption, design, socket.request.session.userID], (err) => {
                if(err) throw err;
                console.log("added post");
                /* fixing this aint worth it bruh
                if (err) throw err;
                con.query("SELECT postID FROM posts WHERE postName = ?",[postData.postName], (err, postResult) => {
                    if(err) throw err;
                    con.query("INSERT INTO posttags (postID, streetware, formal, casual, luxury, vintage, chic, punk, sportsware) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [postResult[0].postID, tags[0], tags[1], tags[2], tags[3], tags[4], tags[5], tags[6], tags[7]], (err, result) => {
                        if(err) throw err;
                        console.log("posts added to sql database");
                    });
                })
                */
            });
        });

        // Use io.emit to give it to all connected clients
        io.emit("postAdded", (postData));
        
    })

    // Deals with sending posts to new users that join the page
    socket.on("getPosts", () => {
        let posts = [];
        let postsName = {};
        con.query("SELECT postID, postName, postCaption, design, userID, likes FROM posts", (err, result) => {
            if (err) throw err;
            if (result.length == 0) {return}
            console.log("resulllll", result);
            console.log("this sis our result", result);
            for (let i = 0; i < result.length; i++) {
                con.query("SELECT username FROM users WHERE userID = ?", [result[i].userID], (err, r) => {
                    if (err) console.log(err);
                    console.log("r value", r);
                        designs.collection("Designs").find({_id: new ObjectId(result[i].design)}, {projection: {_id: 0, thumbnail: 1}}).toArray((err, res) => {
                            // console.log("ressi", res);
                            let image = res[0].thumbnail; // Leave this as index 0 as we loop through the queries there can never be more than 1 entry
                            let name = r[0].username; // Leave this as index 0 as we loop through the queries there can never be more than 1 entry
                            if (result[i].likes == null) result[i].likes = 0;
                            postsName = {name: result[i].postName, caption: result[i].postCaption, design: image, user: name, likes: result[i].likes, id: result[i].postID} // Send over name of the user who created it so that we can show who posted it
                            posts.push(postsName);

                            
                            socket.emit("posts", posts);
                            
                        });
                });
            }
        });
        
    });

    socket.on("liked", data => {
        console.log("data", data.id);
        con.query("UPDATE posts SET likes = ? WHERE postID = ?", [data.likes, data.id], (err, result) => {
            if (err) throw err;
            console.log("updated the table posts with likes ", result)
        })
    })
    
    socket.on("sendTagData", (tagsList) => {
        if(tagsList.length > 0){
            let tags = [];
            for(let i = 0; i<8; i++){
                tags[i] = 0;
            }
            if(tagsList.includes('streetware')){
                tags[0] = 1;
            }
            if(tagsList.includes('formal')){
                tags[1] = 1;
            }
            if(tagsList.includes('casual')){
                tags[2] = 1;
            }
            if(tagsList.includes('luxury')){
                tags[3] = 1;
            }
            if(tagsList.includes('vintage')){
                tags[4] = 1;
            }
            if(tagsList.includes('chic')){
                tags[5] = 1;
            }
            if(tagsList.includes('punk')){
                tags[6] = 1;
            }
            if(tagsList.includes('sportsware')){
                tags[7] = 1;
            }
            con.query("INSERT INTO tags (userID, streetware, formal, casual, luxury, vintage, chic, punk, sportsware) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [socket.request.session.userID, tags[0], tags[1], tags[2], tags[3], tags[4], tags[5], tags[6], tags[7]], (err, result) => {
                if(err) throw err;
            });
            (socket.emit("tagDataResponse", true))
        }else{
            socket.emit("tagDataResponse", false);
        }
    })
    

    // Adds comments to the comments table with foreign key of postID
    socket.on("postComment", data => {
        con.query("INSERT INTO comments (postID, comment) VALUES (?, ?)", [data.postID, data.comment], (err, result) => {
            if (err) throw err;
            console.log("updated table posts with:", result);
        });
    });

    socket.on("getComments", (data) => {
        con.query("SELECT * FROM comments WHERE postID = ?", [data.postID], (err, result) => {
            if (err) throw err;
            let comments = [];
            for (let i = 0; i< result.length; i++) {
                comments.push(result[i]);
            }
            console.log("comments", comments);
            socket.emit("returnComments", {comments: comments});
            
        });
    });

    socket.on("savePostedDesign", (data) => {
        con.query("SELECT userID from users WHERE username = ?", [data.creator], (err, result) => {
            if (err) throw err;

            console.log("resuilt", result[0].userID);

            con.query("SELECT design FROM posts WHERE postID = ?", [data.design], (err, res) => {
                if (err) throw err;

                console.log("ressssss", res[0].design);

                con.query("INSERT INTO saveddesigns (savedBy, design, creatorID) VALUES (?, ?, ?)", [socket.request.session.userID, res[0].design, result[0].userID], (err, r) => {
                    if (err) throw err;
                    console.log("rrrrrrrrrrrr------------------", r);
                });
             });
        });
    });

    socket.on("setProfilePic", (data) => {

        // // get all names of files in /public/assests/templates folder
        // serverFolder = [];
        // serverFolderPath = './server/'
        // fs.readdirSync(serverFolderPath).forEach(file => {
        //     serverFolder.push(file);
        // });

        // console.log("dataaaa", data.profileImg)

        // con.query("SELECT userID FROM users WHERE username = ?", [data.username], (err, result) => {
        //     if (err) throw err;
        //     console.log("username from profile", result);

        //     for (var i in serverFolder) {
            
                
        //         const data = fs.readFileSync(serverFolderPath+serverFolder[i], {encoding:'base64'})
        //         const buf = Buffer.from(data,"base64");
                
        //         con.query("UPDATE users SET profilePicture = ? WHERE userID = ?", [buf, result[0].userID], (err, res) => {
        //             if (err) throw err;
    
        //             console.log("this is our new profile pic", res);
        //         });
        //     }
        // });
    });


    socket.on("getProfile", (data) => {
        console.log("we are logging", data.username);
        
        con.query("SELECT profilePicture FROM users WHERE username = ?", [data.username], (err, result) => {
            if (err) throw err;
            console.log("what is this", result);
            if (result[0].profilePicture == undefined) result[0].profilePicture = "/public/assets/icons/empty-profile-picture.jpeg"

            result[0].profilePicture = Buffer.from(result[0].profilePicture).toString('base64');
            result[0].profilePicture = "data:image/png;base64," + result[0].profilePicture.toString("base64");

            console.log("this is our picture stored", result);

            socket.emit("returnProfile", {picture: result[0].profilePicture});
        })
        
    })
    // Flags a post and inserts into the flagged posts table
    socket.on("postFlagged", (data) => {
        console.log("testing", data.postID);
        con.query("SELECT * FROM posts WHERE postID = ?", [data.postID], (err, result) => {
            if (err) throw err;
            console.log("this is our result", result);
            con.query("INSERT INTO flaggedPosts (postID, postName, postCaption, likes, design, userID) VALUES (?, ?, ?, ?, ?, ?)", [
                result[0].postID, 
                result[0].postName,
                result[0].postCaption,
                result[0].likes,
                result[0].design,
                result[0].userID], (err, res) => {
                    if (err & err != "ER_DUP_ENTRY") throw err; // If there is a duplicate entry skip it
            });
        });
    });

    socket.on("getModStatus", () => {
        con.query("SELECT isMod FROM user_details WHERE userID = ?", [socket.request.session.userID], (err, result) => {
            if (err) throw err;
            console.log("mod status", result);
            socket.emit("returnModStatus", {isMod: result[0].isMod});
        })
    })
    // Gets all the flagged posts to display on moderator page
    socket.on("getFlagged", () => {
        let flaggedPost = {}
        let posts = [];
            con.query("SELECT * FROM flaggedPosts", (err, result) => {
                if (err) throw err;
                console.log("flagged", result);
                for (let i in result) {
                    con.query("SELECT username FROM users WHERE userID = ?", [result[i].userID], (err, r) => {
                        if (err) console.log(err);
                        designs.collection("Designs").find({_id: new ObjectId(result[i].design)}, {projection: {_id: 0, thumbnail: 1}}).toArray((err, res) => {
                            let name = r[0].username;
                            let image = res[0].thumbnail;
                            flaggedPost = {name: result[i].postName, caption: result[i].postCaption, design: image, user: name, likes: result[i].likes, id: result[i].postID}
                            posts.push(flaggedPost);
                            socket.emit("returnFlagged", (posts));
                        });
                });       
            }
        });
    });
    // Removes the post from the flaggedPosts table and it stays on the homepage
    socket.on("unflagPost", data => {
        con.query("DELETE FROM flaggedPosts WHERE postID = ?", [data.postID], (err, result) => {
            if (err) throw err;
            console.log("result from deletion", result);
        })
    })
    // Deletes the post from flaggedPosts and Posts, removing it from the homepage
    // Then strike against the user who posted it
    socket.on("deleteAndStrike", data => {
        con.query("DELETE FROM flaggedPosts WHERE postID = ?", [data.postID], (err, result) => {
            if (err) throw err;
        })
        con.query("DELETE FROM posts WHERE postID = ?", [data.postID], (err, result) => {
            if (err) throw err;
        })
        con.query("SELECT userID FROM users WHERE username = ?", [data.username], (err, result) => {
            if (err) throw err;
            console.log("results from getting userID", result);
            // Quite inefficient querying the database for the number of strikes, but this doesn't happen often
            con.query("SELECT strikes FROM user_details WHERE userID = ?", [result[0].userID], (err, r) => {
                let strikes = r[0].strikes;
                strikes++;
                // console.log("strikes", socket.request.session.strikes)
                con.query("UPDATE user_details SET strikes = ? WHERE userID = ?", [strikes, result[0].userID], (err, res) => {
                    if (err) throw err;
                    console.log("idek", res);
                })
            });
        })
    })
});

app.use(router);
server.listen(3000, () => {
    console.log("Listening on port *: 3000")
});