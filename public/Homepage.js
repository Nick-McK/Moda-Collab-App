const socket = io();


const collabContainer = document.getElementById("_collabContainer");
const collabContent = document.getElementById("_collabContent");
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
const postContent = document.getElementById("_postContent");
const closePosts = document.getElementById("closePosts");

let postTags = document.getElementById("postTags");
let tagOptions = document.querySelectorAll("select");

const savePost = document.getElementById("savePost");
const savedDesignBtn = document.getElementById("savedDesigns");
const savedDesignsContainer = document.getElementById("savedDesignsContainer");
const savedDesignsContent = document.getElementById("savedDesignsContent");
const closeSavedDesigns = document.getElementById("closeSavedDesigns")
const designChoice = document.getElementById("designChoice");

const selectImage = document.getElementById("selectImage");
const upload = document.getElementById("upload");

const postdesign = document.getElementById("addPostDesignsContainer");
const postDContent = document.getElementById("addPostDesignsContent");
const closePostSavedDesigns = document.getElementById("closePostSavedDesigns");

// Events for handling opening and closing the collaboration menu
btnOpen.onclick =  () => {
    socket.emit('giveRooms');
    if (collabContainer.style.display == "flex") {
        collabContainer.style.display = "none";
        promptContainer.style.display = "none"; // Set the prompt container to hide if we close the collab menu
    } else {
        collabContainer.style.display = "flex";
        collabContent.style.animation = "open 0.5s";
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


let recordedRooms = new Array();
// Adding rooms to the collab menu
socket.on("roomNames", (roomList) => {

    console.log("rooms", roomList);
    for (let room of roomList) {
        const collabContent = document.getElementById("_collabContent");
        let roomDiv = document.createElement("div");
        let roomBut = document.createElement("button");
        roomBut.innerHTML = room;
        // let roomLink = document.createElement("a");
        let linkTitle = document.createTextNode(room);
        roomDiv.classList.add("collabRoom");
        // roomDiv.appendChild(roomLink);
        roomDiv.appendChild(roomBut);
        roomBut.classList.add("roundBtn_noBorder");

        console.log("room", room);
        roomBut.onclick = () => {
            
            let pass = prompt("What is this rooms password?");
            // console.log("what is this", pass);
            let data = {roomName: room, password: pass};
            socket.emit("verify", data);
        }
        
        if (!recordedRooms.includes(room)) {
            collabContent.appendChild(roomDiv);
        }
        recordedRooms.push(room);
    }
})
socket.on("redirect", (roomName) => {
    window.location.href = "/collab_room/" + roomName;
})
addCollab.onclick = () => {

}

// Add post menu stuff

addPost.onclick = () => {

    if (addPostContainer.style.display == "flex") {
        addPostContainer.style.display = "none";
    } else {
        addPostContainer.style.display = "flex";
        postContent.style.animation = "open 0.5s";

    }
}
// Needs to be seeperate button for some reason
closePosts.onclick = () => {
    addPostContainer.style.display = "none";
}

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


// Saving posts

// savePost.onclick = () => {
//     socket.emit("savePost");
// }

savedDesignBtn.onclick = () => {
    if (savedDesignsContainer.style.display == "flex") {
        savedDesignsContainer.style.display = "none";
    } else {
        savedDesignsContainer.style.display = "flex";
        savedDesignsContent.style.animation = "open 0.5s";
        console.log("sending for designs with id: ", 0);
        socket.emit("getSavedDesigns", (0));
    }
}
let recordedDesigns = [];
let recordedPostDesigns = [];
socket.on("savedDesigns", (data) => {
    console.log("desss", data.designs);
    console.log("data", data.id);

    let designList = Object.values(data.designs);
    
    // if (data.id == 0)  {
    //     let sectionContainer = document.createElement("section");

    //     let sectionContent = document.createElement("section");
    //     let sectionImage = document.createElement("img");

    //     sectionImage.setAttribute("src", design.thumbnail);

    //     sectionContent.appendChild(sectionImage);
    //     sectionContainer.appendChild(sectionContent);
    //     savedDesignsContainer.appendChild(sectionContainer);
    // }







    for (let design of designList) {     
        // Check if the designs have been added to their respective pages thumbnails for savedPosts(id=0) page and names to the addPost page(id=1)
        // If they have not been then add them to the checked list and then carry on with adding them to the page
        // If none of that is true, then continue because the design has been added to both pages and we don't want to add it a second time 
        if (data.id == 0 && !recordedPostDesigns.includes(design.thumbnail)) {
            recordedPostDesigns.push(design.thumbnail);
        } else if (data.id == 1 && !recordedDesigns.includes(design.name)) {
            recordedDesigns.push(design.name);
        } else {
            continue;
        }
        
        // Handles adding design images to the savedPosts section with id == 0 and for adding posts section with id == 1
        if (data.id == 0) {
            let sectionContainer = document.createElement("section");

            let sectionContent = document.createElement("section");
            let sectionImage = document.createElement("img");

            sectionContainer.classList.add("designContainer");
            sectionContent.classList.add("designContent");
            sectionImage.classList.add("designImage");
            
            sectionImage.setAttribute("src", design.thumbnail);

            sectionContent.appendChild(sectionImage);
            sectionContainer.appendChild(sectionContent);
            savedDesignsContent.appendChild(sectionContainer);
        } else if (data.id == 1) {
            console.log("are we here");
            console.log("name", design.name);
            let nameDiv = document.createElement("div");
            let nameBut = document.createElement("button");

            nameBut.innerHTML = design.name;

            nameDiv.classList.add("collabRoom");
            nameBut.classList.add("roundBtn_noBorder_room");

            nameBut.onclick = () => {
                designChoice.setAttribute("src", design.thumbnail);
                postdesign.style.display = "none";
            }
            nameDiv.appendChild(nameBut);

            postDContent.appendChild(nameDiv);
        }
    }
});




closeSavedDesigns.onclick = () => {
    savedDesignsContainer.style.display = "none";
}

selectImage.onclick = () => {
    console.log("sending for designs with id: ", 1);
    socket.emit("getSavedDesigns", (1));
    postdesign.style.display = "flex";
}

closePostSavedDesigns.onclick = () => {
    postdesign.style.display = "none";
}