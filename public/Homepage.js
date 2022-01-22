const socket = io();


const collabContainer = document.getElementById("_collabContainer");
const promptContainer = document.getElementById("_promptContainer");
const promptBtn = document.getElementById("promptButton");
const btnOpen = document.getElementById("collaborate");
const btnClose = document.getElementById("close");
const startCollab = document.getElementById("startCollaborating");
const addCollab = document.getElementById("addCollaborators");

// Events for handling opening and closing the collaboration menu
btnOpen.onclick =  () => {
    collabContainer.style.display = "flex"
};

btnClose.onclick = () => {
    collabContainer.style.display = "none";
}

startCollab.addEventListener("click", () => {
    promptContainer.style.display = "flex";
})





// Users to be added to the chat
let users = new Array();



// Collaboration menu start and add collaborators buttons
socket.on("connect", () => {
    promptBtn.addEventListener("click", () => {
        socket.emit("start");
    });
});

socket.on("collabTime", () => {
    window.location = "/collab_room.html";
})
    

addCollab.onclick = () => {

}