const express = require('express');     // initialise app to be a function handler that is given to a HTTP server
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const connectedUsers = [];
var loggedInUsers = [];

const mysql = require('mysql');
// fill in the values below when database is created
var conn = mysql.createConnection({
    host: "",
    user: "",
    password: "",
    database: "",    // db name here
    multipleStatements: true
});

// maybe move this to each point where db access is needed
conn.connect(function(err) {
    if(err) {
        createDb(); // Probably a better way to do this too
    };
    console.log("connected to db");
});


// route handler / that gets called when load website home, returns index.html webpage REPLACE WITH LOGIN/SIGNUP FILENAME
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
// might need to add more of the above for other files?

// console log on user connection
io.on('connection', (socket) => {
    console.log('a user connected');
    connectedUsers.add(socket); // add connected clients socket id to list
    // when user logs in/registers, the following occurs
    socket.on('login', (details) => {
        // convert pass to sha-256
        details.pass = shaConversion(details.pass);

        var res = login(socket, details);
        // might be a better way to do this, with app?
        // client should listen for login packet, true if success - redirect to next page, false if not
        socket.emit('login', res);
    });

    socket.on('register', (details) => {
        // convert pass to sha-256
        details.pass = shaConversion(details.pass);

        var res = register(socket, details);
        if (res) {
            socket.emit('login', res)
        } else {
            socket.emit('regError', res);
        }
    });
});


function login(socket, details) {
    // validate



    // then create sql query, REPLACE TABLE NAME WITH ACTUAL NAME
    var sql = "SELECT EXISTS(SELECT * FROM userDetails WHERE user = '"+ conn.escape(details.user) + "' AND '" + conn.escape(details.pass) + "')";

    // execute query
    conn.query(sql, function(err) {
        // if no match, return false
        if (err) return false;
    });

    // if match, add to login list - return success
    loggedInUsers.add([socket, details.user]);
    return true;
}

function register(socket, details) {
    // validate - esp important here

    // build query - find out what fields are needed
    var sql = "INSERT INTO userDetails (user, pass) VALUES ('" + conn.escape(details.user) + "','" + conn.escape(details.pass) + "')";

    // execute query
    conn.query(sql, function(err) {
        // if error, return error msg - handle this later
        if (err) return false;
    });

    // if success, login user
    return login(socket, details);
}

// encrypts input to sha-256, code taken from
// https://stackoverflow.com/questions/18338890/are-there-any-sha-256-javascript-implementations-that-are-generally-considered-t/48161723#48161723
function shaConversion(input) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(input);                    

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string                  
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

function createDb() {
    // creates the different tables
    // should contant num be a required field?
    var createTable = `
        CREATE TABLE users (
            userId int(10) NOT NULL auto_increment,
            username varchar(20) NOT NULL,   
            password varchar(50) NOT NULL,
            PRIMARY KEY (username)
        );
    `;
   conn.query('SHOW TABLES LIKE "users"', (err) => {
       if (err)
        conn.query(createTable, (error) => {
            if (error) throw error;
        });
    });

    createTable = `
        CREATE TABLE userDetails (
            userId int(10),
            fName varchar() NOT NULL,
            sName varchar() NOT NULL,
            age int(3) NOT NULL,
            email varchar(100) NOT NULL,
            contactNum int(11) NOT NULL,
            FOREIGN KEY (userId) REFERENCES user(userId)
        );
    `;
    conn.query('SHOW TABLES LIKE "userDetails"', (err) => {
        if (err)
         conn.query(createTable, (error) => {
             if (error) throw error;
         });
     });
     return;
}



// http server listens on port 3000
server.listen(3000, () => {
    console.log('listening on *:3000');
});

// need to find the login textbox elements
// need to find the login and register button elements
// create a sever listen for a button selection for both register and login
// get the data from the respective textboxes

// for login:
// first check input for any invalid text/characters. make sure its not an SQL injection
// build an SQL query to search the database for a matching username and password
// if so, redirect user to homepage and pass in the authenticated login, add socket/username pair to a loggedIn list
// if not, give user error message

// for register:
// validate inputs
// check there is no duplicate username in the database
// create SQL insert query to add user details to the database
// redirect user to the tags page