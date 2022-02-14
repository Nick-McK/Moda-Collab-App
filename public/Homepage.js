const socket = io();


const collabContainer = document.getElementById("_collabContainer");
const promptContainer = document.getElementById("_promptContainer");
const promptBtn = document.getElementById("promptButton");
const closePrompt = document.getElementById("promptClose");
const passPrompt = document.getElementById("promptPass");
let promptAnswer = document.getElementById("promptAnswer");
const btnOpen = document.getElementById("collaborate");
const btnClose = document.getElementById("close");
const startCollab = document.getElementById("startCollaborating");
const addCollab = document.getElementById("addCollaborators");

// Events for handling opening and closing the collaboration menu
btnOpen.onclick =  () => {
    socket.emit('giveRooms');
    if (collabContainer.style.display == "flex") {
        collabContainer.style.display = "none";
        promptContainer.style.display = "none"; // Set the prompt container to hide if we close the collab menu
    } else {
        collabContainer.style.display = "flex";
    }
};

btnClose.onclick = () => {
    collabContainer.style.display = "none";
    promptContainer.style.display = "none";
}

startCollab.addEventListener("click", () => {
    promptContainer.style.display = "flex";
})

// passPrompt.onclick = () => {
//     let pass = prompt("What would you like the room password to be?");

//     let room = promptAnswer.value;

//     let data = {roomName: room, roomPass: pass}

//     console.log("roomPass", data.roomPass);
//     socket.emit("joined", data);
//     promptContainer.style.disaply = "none";
// }


// Collaboration menu start and add collaborators buttons
socket.on("connect", () => {
    
});

function getRooms() {
    
}

let recordedRooms = new Array();
// Adding rooms to the collab menu
socket.on("roomNames", (roomList) => {

    console.log("rooms", roomList);
    for (let room of roomList) {
        const collabContent = document.getElementById("_collabContent");
        let roomDiv = document.createElement("div");
        let roomBut = document.createElement("button");
        roomBut.innerHTML = room;
        let roomLink = document.createElement("a");
        let linkTitle = document.createTextNode(room);
        roomDiv.classList.add("collabRoom");
        // roomDiv.appendChild(roomLink);
        roomDiv.appendChild(roomBut);
        roomBut.classList.add("roundBtn_noBorder");


        roomBut.onclick = () => {
            console.log("passy");
            let pass = prompt("What is this rooms password?");
            // console.log("what is this", pass);
            let data = {roomName: room, password: pass};
            socket.emit("verify", data);
        }
        // roomLink.appendChild(linkTitle);
        // roomLink.href = "/collab_room/verify/" + room;
        if (!recordedRooms.includes(room)) {
            collabContent.appendChild(roomDiv);
            roomDiv.appendChild(roomLink);
        }
        recordedRooms.push(room);
    }
})

socket.on("redirect", (roomName) => {
    window.location.href = "/collab_room/" + roomName;
})
    

addCollab.onclick = () => {

}
