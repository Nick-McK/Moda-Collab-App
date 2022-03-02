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
const sectionContainer = document.getElementById("designContainer");

const selectImage = document.getElementById("selectImage");
const upload = document.getElementById("upload");
const postButton = document.getElementById("post");
const postName = document.getElementById("_postName");
const postCaption = document.getElementById("_postCaption");
const posts = document.querySelectorAll(".post");


const postdesign = document.getElementById("addPostDesignsContainer");
const postDContent = document.getElementById("addPostDesignsContent");
const closePostSavedDesigns = document.getElementById("closePostSavedDesigns");

// CODE FOR POST TRANSITIONS IF I CAN MAKE IT STOP HALF WAY THROUGH AND REVERSE
// Currently will go to the full size if we move out before its finished and this is quite jarring
// for (let post of posts) {
//     post.addEventListener("mouseenter", () => {
//         // post.classList.add("active");
//         post.style.animation = "highlightPost 1s ease-in-out 1s 1 normal forwards";
        
//         // post.style.animation = "delay 0.5s";
//     });
//     post.addEventListener("mouseleave", () => {
//         post.style.animation = "out 1s ease-in-out";
//         // post.style.opacity = 0;
//         // post.classList.add("inactive");
//         // post.classList.remove("active");

        
        

//         // setTimeout(() => {
//         //     post.classList.add("active");
//         //     post.style.opacity = ""
//         // }, 25);

//         // post.addEventListener("animationend", onanimationend)
//     })

//     // function onanimationend() {
//     //     console.log("what is this");
//     //     post.classList.remove("active", "inactive");
//     //     post.removeEventListener("animationend", onanimationend);
//     // }
    
// }




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

// postButton.onclick = () => {
//     console.log("hasodgasdg");
//     socket.emit("newPost");
// }


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
            // let sectionContainer = document.createElement("section");

            let sectionContent = document.createElement("section");
            let sectionImage = document.createElement("img");

            // sectionContainer.classList.add("designContainer");
            sectionContent.classList.add("designContent");
            sectionImage.classList.add("designImage");
            
            sectionImage.setAttribute("src", design.thumbnail);

            sectionContent.appendChild(sectionImage);
            sectionContainer.appendChild(sectionContent);
            // savedDesignsContent.appendChild(sectionContainer);
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
                // postThumb.value = design.thumbnail;
                postdesign.style.display = "none";
            }
            nameDiv.appendChild(nameBut);

            postDContent.appendChild(nameDiv);
        }
    }
});

postButton.onclick = () => {

    let postImage = designChoice.src;
    let name = postName.value;
    let caption = postCaption.value;

    let data = {postName: name, postCaption: caption, image: postImage};

    console.log(data.image)

    socket.emit("post", (data));
}
// TODO: Clean this up with a loop for the repeated elements
socket.on("postAdded", (data) => {
    console.log("new post")
    let postDiv = document.createElement("div");
    let gridItem = document.createElement("div");
    let postBar = document.createElement("div");
    let postImage = document.createElement("img");
    let barImage1 = document.createElement("img");
    let barImage2 = document.createElement("img");
    let barImage3 = document.createElement("img");
    
    
    let div1 = document.createElement("div");
    let div2 = document.createElement("div");
    let div3 = document.createElement("div");


    barImage1.classList.add("bar_img");
    barImage2.classList.add("bar_img");
    barImage3.classList.add("bar_img");
    postDiv.classList.add("post");
    gridItem.classList.add("grid-item");
    postBar.classList.add("post-bar");
    postImage.classList.add("post_img");

    barImage1.setAttribute("src", "/public/assets/icons/floppy-disk.png");
    barImage2.setAttribute("src", "/public/assets/icons/archive-box.png");
    barImage3.setAttribute("src", "/public/assets/icons/plus.png");

    div1.appendChild(barImage1);
    div2.appendChild(barImage2);
    div3.appendChild(barImage3);
    

    postBar.appendChild(div1);
    postBar.appendChild(div2);
    postBar.appendChild(div3);

    
    

    postImage.setAttribute("src", data.image);

    gridItem.appendChild(postImage);
    postDiv.appendChild(gridItem);
    postDiv.appendChild(postBar);
    const feed = document.getElementById("_feed");
    feed.prepend(postDiv); // This is prepend as we want the newest posts at the top of the feed

    
    
})



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

this.onload = () => {
    socket.emit("getPosts");
    
}

let posted = {};
socket.on("posts", posts => {
    console.log(posts.posts);
    for (let post of posts) {
        if (posted[post.name] == post.caption) {
            continue;
        }
        posted[post.name] = post.caption;
        console.log("possss", post);
        let postDiv = document.createElement("div");
        let gridItem = document.createElement("div");
        let postTop = document.createElement("div");
        let profilePic = document.createElement("div");
        let postBar = document.createElement("div");
        let name = document.createElement("div");
        let postImage = document.createElement("img");
        let barImage1 = document.createElement("img");
        let barImage2 = document.createElement("img");
        let barImage3 = document.createElement("img");
        let profileImage = document.createElement("img");

        profileImage.setAttribute("src", "assets/icons/empty-profile-picture.jpeg")
        
        
        let div1 = document.createElement("div");
        let div2 = document.createElement("div");
        let div3 = document.createElement("div");


        barImage1.classList.add("bar_img");
        barImage2.classList.add("bar_img");
        barImage3.classList.add("bar_img");
        postDiv.classList.add("post");
        gridItem.classList.add("grid-item");
        postTop.classList.add("post-top");
        profilePic.classList.add("profile-pic")
        profileImage.classList.add("profile-pic");
        name.classList.add("account");
        postBar.classList.add("post-bar");
        postImage.classList.add("post_img");

        name.innerHTML = post.user;

        barImage1.setAttribute("src", "/public/assets/icons/floppy-disk-inverted.png");
        barImage2.setAttribute("src", "/public/assets/icons/archive-box-inverted.png");
        barImage3.setAttribute("src", "/public/assets/icons/plus-inverted.png");

        div1.appendChild(barImage1);
        div2.appendChild(barImage2);
        div3.appendChild(barImage3);
        

        postBar.appendChild(div1);
        postBar.appendChild(div2);
        postBar.appendChild(div3);

        postImage.setAttribute("src", post.design);

    
        gridItem.appendChild(postImage);
        postTop.appendChild(profilePic);
        postTop.appendChild(name);
        profilePic.appendChild(profileImage);
        postDiv.appendChild(postTop);
        postDiv.appendChild(gridItem);
        postDiv.appendChild(postBar);
        const feed = document.getElementById("_feed");
        feed.prepend(postDiv); // This is prepend as we want the newest posts at the top of the feed
    }

    const postImages = document.querySelectorAll(".post_img");
    const postTop = document.querySelectorAll(".post-top");
    console.log("sfasdf", postImages)
    for (let image of postImages) {
        console.log("image", image);
        let post = image.parentElement.parentElement;
        let child = post.children;
        let postTop = child[0].children;
        console.log("posts", post);
        console.log("psot1", child);
        console.log("postTop", postTop);
        image.addEventListener("mouseenter", () => {
            console.log("enter")
            post.style.transition = "transform 1s";
            post.style.transitionDelay = "1s"
            post.style.transform = "scale(1.15, 1.15)";

            post.addEventListener("transitionend", () => {
                child[0].style.transition = "opacity 1s ease-in-out";
                child[0].style.opacity = "1";
            })
            
            // child[0].style.transition = "transform 1s";
            

        })
        image.addEventListener("mouseleave", () => {
            post.style.transform = "scale(1,1)";
            post.addEventListener("transitionend", () => {
                child[0].style.transition = "opacity 1s ease-in-out";
                child[0].style.opacity = "0";
            })
            
        });
    }
})