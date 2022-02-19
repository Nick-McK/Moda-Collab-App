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

const addPost = document.getElementById("addPost");
const addPostContainer = document.getElementById("addPostContainer");
const closePosts = document.getElementById("closePosts");

let postTags = document.getElementById("postTags");
let tagOptions = document.querySelectorAll("select");

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
    addPostContainer.style.display = "none";
}

startCollab.addEventListener("click", () => {
    promptContainer.style.display = "flex";
})

addPost.onclick = () => {

    if (addPostContainer.style.display == "flex") {
        addPostContainer.style.display = "none";
    } else {
        addPostContainer.style.display = "flex";
    }
}
// Needs to be seeperate button for some reason
closePosts.onclick = () => {
    addPostContainer.style.display = "none";
}

console.log("asdasd", document.querySelectorAll("option"));

// Select multiple tags without having to hold CTRL
window.onmousedown = (e) => {
    let el = e.target;
    // If the element has a tag of option and the select tag has multiple attribute
    if (el.tagName.toLowerCase() == "option" && el.parentNode.hasAttribute("multiple")) {
        e.preventDefault();
        if(el.hasAttribute("selected")) el.removeAttribute("selected");
        else el.setAttribute("selected", "");
    }
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
