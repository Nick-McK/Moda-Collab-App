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

const likedPost = document.getElementById("likedPost");
const likedPostContainer = document.getElementById("likedPostsContainer");
const likedPostContent = document.getElementById("likedPostsContent");
const likedPostsList = document.getElementById("likedPostsList");
const closeLikedPosts = document.getElementById("closeSavedPosts");

const postdesign = document.getElementById("addPostDesignsContainer");
const postDList = document.getElementById("addPostDesignsList");
const closePostSavedDesigns = document.getElementById("closePostSavedDesigns");
const commentsContainer = document.getElementById("commentsContainer");
const commentsContent = document.getElementById("commentsContent");
const commentSection = document.getElementById("_comments")
const commentText = document.getElementById("comment");

const feed = document.getElementById("_feed");

const postComment = document.getElementById("postComment");
const commentFormImg = document.getElementById("commentFormImg");

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


// A parameter is returned if a user tries to create a room with the same name as an existing room
const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  if (params.success == "failed") {
    alert('Room name already in use, please choose another.');
  }


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

closePrompt.onclick = () => {
    promptContainer.style.display = "none";
}

let recordedRooms = new Array();
// Adding rooms to the collab menu
socket.on("roomNames", (roomList) => {
    const collabRoomList = document.getElementById("_collabRoomList");

    // If the incoming roomList is less than the existing elements, remove all elements of class collabRoom from form
    if (roomList.length < (collabRoomList.childElementCount)) {
        var roomListings = document.querySelectorAll(".collabRoom")
        roomListings.forEach(room => {
            room.remove();
        });
        // Empty the recordedRooms tracker
        recordedRooms = [];
    }

    for (let room of roomList) {
        let roomDiv = document.createElement("div");
        let roomBut = document.createElement("button");
        roomBut.innerHTML = room;
        // let roomLink = document.createElement("a");
        let linkTitle = document.createTextNode(room);
        roomDiv.classList.add("collabRoom");
        // roomDiv.appendChild(roomLink);
        roomDiv.appendChild(roomBut);
        roomBut.classList.add("roundBtn");

        console.log("room", room);
        roomBut.onclick = () => {
            
            let pass = prompt("What is this rooms password?");
            // console.log("what is this", pass);
            let data = {roomName: room, password: pass};
            socket.emit("verify", data);
        }
        
        if (!recordedRooms.includes(room)) {
            collabRoomList.appendChild(roomDiv);
            recordedRooms.push(room);
        }
    }
})
socket.on("redirect", (data) => {

    // If user entered wrong password, give them an alert and dont redirect
    if (data.wrongPass == true) {
        alert("Incorrect Password");
    } else {
        // might need encodeURIComponent()?
        window.location.replace(window.location.origin + "/collab_room/" + data.roomName);
    }
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

    console.log("designList",designList);

    // If user has no saved designs, give alert and close window
    if (designList.length == 0) {
        alert("You have no saved designs\nGo to the collaboration room to create and save a design");
        savedDesignsContainer.style.display = "none";
    } else {
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
                let nameDiv = document.createElement("div");
                let nameBut = document.createElement("button");
    
                nameBut.innerHTML = design.name;
    
                nameDiv.classList.add("collabRoom");
                nameBut.classList.add("roundBtn_noBorder_room");
    
                nameBut.onclick = () => {
                    designChoice.setAttribute("src", design.thumbnail);
                    // This resizes the container of the image to fit with the form factor of the image
                    designChoice.parentNode.style.width = "70%";
                    designChoice.parentNode.style.height = "auto";
                    // postThumb.value = design.thumbnail;
                    postdesign.style.display = "none";
                }
                nameDiv.appendChild(nameBut);
    
                postDList.appendChild(nameDiv);
            }
        }
    }
});


likedPost.onclick = () => {    
    if (likedPostContainer.style.display == "flex") {
        likedPostContainer.style.display = "none";
    } else {
        likedPostContainer.style.display = "flex";
        likedPostContent.style.animation = "open 0.5s";
        socket.emit("getLikedPosts");
    }
}   

closeLikedPosts.onclick = () => {
    likedPostContainer.style.display = "none";
}

socket.on("returnLikedPosts", (data) => {
    console.log("liked posts?",data)
    if (data.length == 0 || data == undefined) {
        alert("No liked posts\nlike some posts from your Home Page for them to appear here");
        closeLikedPosts.click();
    } else {
        displayPost(data, true, null);
    }
})


postButton.onclick = () => {
    let tags = []

    // Copy link of the design, and get the value following the final /
    var checkValidDesign = new String(designChoice.src);
    checkValidDesign = checkValidDesign.split("/");
    checkValidDesign = checkValidDesign.pop();

    // If that value games.jpg that means that the default image is still there and alert should be sent to user
    if (checkValidDesign == "games.jpg") {
        alert("Please select a design for the post.");
        return;
    }

    if(postTags.selectedOptions.length > 0){

    
        for(let i=0; i<postTags.selectedOptions.length; i++){
            tags.push(postTags.selectedOptions[i].innerHTML);
        };
        let postImage = designChoice.src;
        let name = postName.value;
        let caption = postCaption.value;

    
        let data = {postName: name, postCaption: caption, image: postImage, tagsList: tags};

        socket.emit("post", (data));
    }else{
        alert("Please select at least 1 tag");
    }
}

socket.on("postAdded", (posts) => {
    socket.on("tags2", tag => {
        console.log("new post")
    displayPost(posts, false, tag);
    })
    
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
    socket.emit("getModAndAdminStatus");
}

let posted = {};
let commented = [];

let displayedInLiked = {};
socket.on("posts", posts => {
    socket.on("tags", tag => {

        console.log("tags", tag);
        


        displayPost(posts, false, tag);
    })
    
});
/**
 * 
 * @param {Array} posts An array of objects that contains details about each post to be displayed to the screen
 * This is abstracted to reduce code duplication. This method takes all posts in the array and creates an element
 * for them on screen, conforming to the post layout determined in the commented out post class in the Homepage
 * 
 * We also add event listeners to play for our animations to work.
 */
function displayPost(posts, forLiked, tag) {
    for (let post of posts) {
        if (posted[post.id] == post.caption && !forLiked) {
            continue;
        }

        if (forLiked && displayedInLiked[post.id] == post.id) {
            continue;
        }

        // Add to a tracker so no posts appear twice in for liked
        if (forLiked) displayedInLiked[post.id] = post.id;

        // Check to see if the user has the same tag as the post if they do not then skip this post
        console.log("postTaga", post.tag)
        if (tag != null && tag[post.tag] == 0) {
            continue;
        }
        
        posted[post.id] = post.caption;
        let postDiv = document.createElement("div");
        // Set the HTML id of the post element to resemble the database id,
        // might not be the most secure but the only way to properly send
        // comments to the db while knowing what post the comment was made on
        postDiv.setAttribute("id", "post-"+post.id);
        let gridItem = document.createElement("div");
        let postTop = document.createElement("div");
        let profilePic = document.createElement("div");
        let postBar = document.createElement("div");
        let name = document.createElement("button");
        let postImage = document.createElement("img");
        let barImage1 = document.createElement("img");
        let barImage2 = document.createElement("img");
        let barImage3 = document.createElement("img");
        let profileImage = document.createElement("img");
        
        let likeCounter = document.createElement("sup"); // Creates a superscript tag to show the number of likes
        let flagDiv = document.createElement("div");
        let flagImg = document.createElement("img");

        flagDiv.classList.add("flag");

        flagImg.setAttribute("src", "assets/icons/flag-fill.png");
        flagImg.setAttribute("title", "Flag for Moderation");
        flagDiv.appendChild(flagImg);


        if (post.pfp != null) {
            profileImage.setAttribute("src", post.pfp);
        } else {
            profileImage.setAttribute("src", "assets/icons/empty-profile-picture.jpeg");
        }
        
        
        let div1 = document.createElement("div");
        let div2 = document.createElement("div");
        let div3 = document.createElement("div");


        barImage1.classList.add("bar_img");
        barImage2.classList.add("bar_img");
        barImage3.classList.add("bar_img");
        if (forLiked) {
            postDiv.classList.add("liked-post");
        } else {
            postDiv.classList.add("post");
        }
        gridItem.classList.add("grid-item");
        postTop.classList.add("post-top");
        profilePic.classList.add("profile-pic")
        profileImage.classList.add("profile-pic");
        name.classList.add("account");
        name.classList.add("roundBtn_noBorder");
        postBar.classList.add("post-bar");
        postImage.classList.add("post_img");

        name.innerHTML = post.user;

        name.addEventListener("click", () => {
            window.location.href = "/profile/"+post.user;
        })

        postImage.setAttribute("src", post.design);
        postImage.setAttribute("alt", post.id);

        barImage1.setAttribute("src", "/public/assets/icons/heart-inverted.png");

        // Need this for when the post has just been added, as we create the userIDs part if the post has more than 0 likes
        // And because it makes it work, kinda not sure why because it worked without it
        if (post.likedBy == undefined && !forLiked) {
            post.LIKED = false;
        } else if (forLiked || Object.values(post.likedBy).includes(post.sessionID)) {
            console.log("I exist!");
            post.LIKED = true;
            barImage1.setAttribute("src", "/public/assets/icons/heart-fill.png");
        } else {
            post.LIKED = false;
        }
    
        post.LIKES = post.likes; // Set this to the database value
        likeCounter.innerHTML = post.LIKES;

        barImage1.setAttribute("title", "Like");

        barImage1.addEventListener("click", () => {
            console.log("liked",post.LIKED);
            if (post.LIKED == true) {
                post.LIKES--;
                post.LIKED = false;
                barImage1.setAttribute("src", "/public/assets/icons/heart-inverted.png");
                socket.emit("liked", {likes: post.LIKES, id: post.id, liked: false});
            } else if (post.LIKED == false) {
                post.LIKES++;
                post.LIKED = true;
                barImage1.setAttribute("src", "/public/assets/icons/heart-fill.png");
                socket.emit("liked", {likes: post.LIKES, id: post.id, liked: true});
            }
            likeCounter.innerHTML = post.LIKES;
        })


        barImage2.setAttribute("src", "/public/assets/icons/archive-box-inverted.png");
        barImage2.setAttribute("title", "Save Design");

        barImage2.addEventListener("click", () => {
            socket.emit("savePostedDesign", {design: post.id, creator: post.user});
            alert("Design Saved!\nEnter a Collaboration Room and load the design to get started!");
        })
        
        barImage3.setAttribute("src", "/public/assets/icons/chat-circle-inverted.png");
        barImage3.setAttribute("title", "Comment");

        barImage3.addEventListener("click", () => {
            showComments(postImage);
        });

        

        div1.appendChild(barImage1);
        div1.appendChild(likeCounter);
        div2.appendChild(barImage2);
        div3.appendChild(barImage3);

        postBar.appendChild(div1);
        postBar.appendChild(div2);
        postBar.appendChild(div3);

        gridItem.appendChild(postImage);
        postTop.appendChild(profilePic);
        postTop.appendChild(name);
        postTop.appendChild(flagDiv);
        profilePic.appendChild(profileImage);
        postDiv.appendChild(postTop);
        postDiv.appendChild(gridItem);
        postDiv.appendChild(postBar);

        if (forLiked == undefined || !forLiked) {
            const feed = document.getElementById("_feed");
            postDiv.style.left = "0";
            postDiv.style.top = "0";
            feed.prepend(postDiv); // This is prepend as we want the newest posts at the top of the feed
        } else if (forLiked == true){
            console.log("trying")
            likedPostsList.prepend(postDiv);
        }
        
        // Flagging event
        flagImg.addEventListener("click", () => {
            socket.emit("postFlagged", {postID: post.id})
        })
    }

    socket.on("postAlreadyExists", (postName) => {
        alert("a post with the name " + postName + "already exists");
    })

    const postImages = document.querySelectorAll(".post_img");
    // Adds required listeners to each post image
    for (let image of postImages) {
        image.addEventListener("mouseenter", mouseover(image));

        // ANIMATION FOR OPENING COMMENTS
        console.log("click for " + image);
        image.addEventListener("click", () => {
            showComments(image);
        })

        
    }

    // This is the function called when a mouse is hovering over a post
    // Use helper function instead of anonymised functions so events can be easily removed
    function mouseover(image) {
        let post = image.parentElement.parentElement;
        let child = post.children

        // Remove the event before setting it to prevent event listener stacking when this is called multiple times
        image.removeEventListener("mouseenter", helpForMouseEnter);
        image.addEventListener("mouseenter", function() {helpForMouseEnter(post, child[0])});
        post.removeEventListener("mouseleave", helpForMouseLeave);
        post.addEventListener("mouseleave", function() {helpForMouseLeave(post, child[0])});
    }

    function helpForMouseEnter(post, child) {
        post.style.transition = "transform 1s";
        post.style.transitionDelay = "1s"
        post.style.transform = "scale(1.15, 1.15)";
        post.style.boxShadow = "0 0 2em white;"

        // Remove the event before setting it to prevent event listener stacking when this is called multiple times
        post.removeEventListener("transitionend", postTransition);
        post.addEventListener("transitionend", postTransition(child, false));
    }

    function helpForMouseLeave(post, child) {
        post.style.transform = "scale(1,1)";

        // Remove the event before setting it to prevent event listener stacking when this is called multiple times
        post.removeEventListener("transitionend", postTransition);
        post.addEventListener("transitionend", postTransition(child, true));
    }


    // If fade is true, that means that the animation is to play in reverse as the user has moved their mouse out of the post
    function postTransition(child, fade) {
        child.style.transition = "opacity 1s ease-in-out";
        if (fade) {
            child.style.opacity = "0";
        } else {
            child.style.opacity = "1";
        }
        // child.parentNode.removeEventListener("transitionend", postTransition);
    }


    socket.on("returnComments", data => {
        // TODO: WRITE THE COMMENTS TO THE SCREEN, CURRENTLY DUPLICATING COMMENTS ON EACH VISIT

        // Reset the commented tracker and empty the comments section element
        // This is necessary because the form is reused for all posts
        // If this wasn't in place there are issues with comments being duplicated and assigned to wrong posts
        commented = [];
        commentSection.innerHTML = "";

        // Build up a comment container for each comment for the post
        for (let comment of data.comments) {
            let commentDiv = document.createElement("div");
            let profilePicDiv = document.createElement("div");
            let profilePicImg = document.createElement("img");
            let commentContent = document.createElement("p");
            commentContent.innerHTML = comment.comment;
            commentDiv.classList.add("comment");
            commentDiv.appendChild(profilePicDiv);
            profilePicDiv.appendChild(profilePicImg);
            profilePicDiv.classList.add("profile-pic");

            if (data.pfp != null) {
                // We would need to attatch the profile pic of the person who comments with each comment to be able to set the pictures of the comments that have already been posted
                // profilePicImg.setAttribute("src", data.pfp);
                
                commentFormImg.setAttribute("src", data.pfp);
            } else {
                profilePicImg.setAttribute("src", "assets/icons/empty-profile-picture.jpeg");
            }

            commentDiv.appendChild(commentContent);
            if (!commented.includes(comment.comment)) {
                commentSection.prepend(commentDiv);
            }
            commented.push(comment.comment);
        }
        console.log("commented", commented);
    })

    // Helper function for events, makes it so event can be removed to prevent stacking events
    function cancelTransition(post, gridWidth) {
        const postWidth = post.offsetWidth;
        const postHeight = post.offsetHeight;

        if (post.style.left == ((gridWidth - postWidth) / 2) - 10 + "px") {

            post.style.animation = "shrink 1s";
            post.style.animationFillMode = "forwards";

            commentsContainer.style.display = "flex";
            commentsContainer.style.animation = "opacity .75s";
            commentsContainer.style.animationFillMode = "forwards";
            commentsContainer.style.animationDelay = "1s";

            const commentImage = document.getElementById("commentImage");

            let postImage = post.children[1].children[0];

            commentImage.setAttribute("src", postImage.src);
            commentImage.style.width = "100%";
            commentImage.style.height = "100%";
            
            const close = document.getElementById("closeComments");

            close.addEventListener("click", (callback) => {
                commentsContainer.style.animation = "opacity-reverse 1.75s" // Could try use animationDirection but this is easier
                commentsContainer.style.display = "none";

                post.style.animation = "grow 1s";
                post.style.left = -((postWidth) / postWidth) + 1;
                post.style.top = -(postHeight / postHeight) + 1;
                post.style.transition = "all 2s";

            });
        }
    }

    // Helper function for events, makes it so event can be removed to prevent stacking events
    // type modifies the movements needed depending on which column the post is moving from
    function endTransition(post, type, gridWidth, callback) {
        const clientY = window.innerHeight / 2;
        const scrollTop = window.scrollY;
        const postWidth = post.offsetWidth;
        const postTop = post.offsetTop;
        
        // This is called if the post being transformed is in the left lane
        if (type == "mid") {
            if (post.style.top == scrollTop + (clientY - postTop) - 160 + "px") {
                post.style.animation = "shrink 1s";
                post.style.animationFillMode = "forwards";

                commentsContainer.style.display = "flex";
                commentsContainer.style.animation = "opacity .75s";
                commentsContainer.style.animationFillMode = "forwards";
                commentsContainer.style.animationDelay = "1s";

                const commentImage = document.getElementById("commentImage");
                let postImage = post.children[1].children[0];

                // Set the image of the post
                commentImage.setAttribute("src", postImage.src);
                commentImage.style.width = "100%";
                commentImage.style.height = "100%";

                const close = document.getElementById("closeComments");
                // Remove the event before setting it to prevent event listener stacking when this is called multiple times
                // Call the helper funciton for the close comments button, specify the post is in the middle lane
                close.removeEventListener("click", closeCommentsListeners);
                close.addEventListener("click", function () {closeCommentsListeners("mid", post)});
            }
        } else if (type == "left"){
            // If the post is in the middle of the screen then play the animation
            if (post.style.left == ((gridWidth - postWidth) / 2) - 10 + "px") {
                post.style.animation = "shrink 1s";
                post.style.animationFillMode = "forwards";

                commentsContainer.style.display = "flex";
                commentsContainer.style.animation = "opacity .75s";
                commentsContainer.style.animationFillMode = "forwards";
                commentsContainer.style.animationDelay = "1s";

                const commentImage = document.getElementById("commentImage");
                let postImage = post.children[1].children[0];
                
                // Set the image of the post
                commentImage.setAttribute("src", postImage.src);
                commentImage.style.width = "100%";
                commentImage.style.height = "100%";

                const close = document.getElementById("closeComments");
                // Remove the event before setting it to prevent event listener stacking when this is called multiple times
                // Call the helper funciton for the close comments button, specify the post is in the left lane                close.removeEventListener("click", closeCommentsListeners);
                close.addEventListener("click", function () {closeCommentsListeners("left", post)});
            }
        } else if (type == "right") {
            // This is called if the post being transformed is in the right lane
            if (post.style.left == -((gridWidth - postWidth) / 2) + 10 + "px") {
                post.style.animation = "shrink 1s";
                post.style.animationFillMode = "forwards";

                commentsContainer.style.display = "flex";
                commentsContainer.style.animation = "opacity .75s";
                commentsContainer.style.animationFillMode = "forwards";
                commentsContainer.style.animationDelay = "1s";

                const commentImage = document.getElementById("commentImage");
                let postImage = post.children[1].children[0];
                
                // Set the image of the post
                commentImage.setAttribute("src", postImage.src);
                commentImage.style.width = "100%";
                commentImage.style.height = "100%";

                const close = document.getElementById("closeComments");
                // Remove the event before setting it to prevent event listener stacking when this is called multiple times
                // Call the helper funciton for the close comments button, specify the post is in the right lane
                close.removeEventListener("click", closeCommentsListeners);
                close.addEventListener("click", function () {closeCommentsListeners("right", post)});
            }
        }
    }

    // Helper function for the close comments button, takes in the post and the left/right/mid lane the post is in
    function closeCommentsListeners(type, post) {
        const postWidth = post.offsetWidth;
        const postHeight = post.offsetHeight;

        if (type=="left") {
            commentsContainer.style.animation = "opacity-reverse 1.75s" // Could try use animationDirection but this is easier
            commentsContainer.style.display = "none";

            post.style.animation = "grow 1s";
            post.style.left = -((postWidth) / postWidth) + 1;
            post.style.top = -(postHeight / postHeight) + 1;
            post.style.transition = "all 2s";
        } else if (type=="mid") {
            commentsContainer.style.animation = "opacity-reverse 1.75s";
            commentsContainer.style.display = "none";

            post.style.animation = "grow 1s";
            post.style.top = (postHeight / postHeight) - 1;
            post.style.transition = "all 2s";
        }else if (type=="right") {
            commentsContainer.style.animation = "opacity-reverse 1.75s" // Could try use animationDirection but this is easier
            commentsContainer.style.display = "none";

            post.style.animation = "grow 1s";
            post.style.left = -((postWidth) / postWidth) + 1;
            post.style.top = -(postHeight / postHeight) + 1;
            post.style.transition = "all 2s";
        }
    }


    function showComments(image, callback) {
        let post = image.parentElement.parentElement;
        let child = post.children;

        // Get the post id and use substring to get the acutal db id of the post
        var postId = new String(post.id);
        postId = postId.substring(postId.indexOf("-")+1);
       

        // Use the id to update the postComment onclick to send the correct post id   
        postComment.addEventListener("click", () => {
            let commentValue = commentText.value;
            // commentText.value = "";
            socket.emit("postComment", {comment: commentValue, postID: postId});

            socket.on("commentPosted", data => {
            
                let commentDiv = document.createElement("div");
                let profilePicDiv = document.createElement("div");
                let profilePicImg = document.createElement("img");
                let commentContent = document.createElement("p");
                commentContent.innerHTML = data.comment;
                commentDiv.classList.add("comment");
                commentDiv.appendChild(profilePicDiv);
                profilePicDiv.appendChild(profilePicImg);
                profilePicDiv.classList.add("profile-pic");
                
                if (data.pfp != null) {
                    profilePicImg.setAttribute("src", data.pfp);
                    commentFormImg.setAttribute("src", data.pfp);
                } else {
                    profilePicImg.setAttribute("src", "assets/icons/empty-profile-picture.jpeg");
                }
    
                // console.log("datacomment", data.comment);
    
                commentDiv.appendChild(commentContent);
                if (!commented.includes(data.comment)) {
                    commentSection.prepend(commentDiv);
                }
                commented.push(data.comment);
            })
        })

        
            


        // Retrieve the comments on click
        socket.emit("getComments", {postID: image.getAttribute("alt")});
        // If we don't do socket.on for the comments here, then they don't show on the first opening of a post
        
        // Careful this will not work if there is no post in the second column of the feed!
        const col2 = document.querySelector(".feed > :nth-child(3n-1");
        const col1 = document.querySelector(".feed > :nth-child(3n-2");
    
        const col1All = document.querySelectorAll(".feed > :nth-child(3n-2");
        const col2All = document.querySelectorAll(".feed > :nth-child(3n-1");
        const col3All = document.querySelectorAll(".feed > :nth-child(3n)");
    
        let col = null;
        // Find column of post
        for (let p of col1All) {
            if (p == post) {
                col = true;
            }
        }
        // Only loop through the 3rd column if our post isnt in the first
        if (col == null) {
            for (let p of col3All) {
                if (p == post) {
                    col = false
                }
            }
        }
    
        const clientY = window.innerHeight / 2;
        const scrollTop = window.scrollY;
        
        const gridWidth = feed.offsetWidth;
        const postWidth = post.offsetWidth;
        const postLeft = post.offsetLeft
        const postTop = post.offsetTop;
    
        // If column is == 1 then move it to centre and if col is == 3 move to centre
        // Using if as we need to minus coords if the post is in col 3
        if (col == true) {
            if (postLeft != col2.offsetLeft) {
                post.style.left = ((gridWidth - postWidth) / 2)- 10;
                post.style.top = scrollTop + (clientY - postTop) - 160; // Calculates the centre of the screen (kinda) with scrolling included
                post.style.transition = "all 2s ease-in-out";

                post.removeEventListener("transitioncancel", cancelTransition);
                post.addEventListener("transitioncancel", cancelTransition(post, gridWidth, callback));
    
                // Only play the animation after we have transitioned to the middle of the screen
                post.removeEventListener("transitionend", endTransition);
                post.addEventListener("transitionend", endTransition(post, "left", gridWidth, callback));
            }
        } else if (col == false) {
            if (postLeft != col2.offsetLeft || postLeft != col2.offsetLeft + 1) {
                post.style.left = -((gridWidth - postWidth) / 2) + 10;
                post.style.top = scrollTop + (clientY - postTop) - 160; // Calculates the centre of the screen (kinda) with scrolling included
                post.style.transition = "all 2s";
    
                // Only play the animation after we have transitioned to the middle of the screen
                post.removeEventListener("transitionend", endTransition);
                post.addEventListener("transitionend", endTransition(post, "right", gridWidth,callback));
            }
        } else if (col == null) {
            if (postLeft == col2.offsetLeft) {
                post.style.top = scrollTop + (clientY - postTop) - 160; // Calculates the centre of the screen (kinda) with scrolling included
                post.style.transition = "all 2s";

                post.removeEventListener("transitionend", endTransition);
                post.addEventListener("transitionend", endTransition(post, "mid", gridWidth,callback));
            }
        }
    }
}

socket.on('roomNotFound', (roomName) => {
    alert('Room "' + roomName + '" not found. Please close form and reopen');
})

socket.on("returnModAndAdminStatus", data => {
    if (data.isMod == 0) {
        let mods = document.getElementById("mods");
        mods.style.display = "none";
        // modNav.style.display = "grid";
    }
})
// Gets the users session username and returns it so we can redirect the user to their profile
const profile = document.getElementById("profile");
profile.onclick = () => {
    socket.emit("getUsersProfile");
}

socket.on("returnUsersProfile", (user) => {
    console.log("users", user.user)
    window.location.href = "/profile/" + user.username;
})

const friendsBtn = document.getElementById("friends");
let friends = document.getElementById("_friends");
let friendRecommendations = document.getElementById("_friend-recommendations");
let friendReqs = document.getElementById("_friend-requests");
const friendsContainer = document.getElementById("_friends-container");
friendsBtn.onclick = () => {
    if (friendsContainer.style.display == "flex") {
        friendsContainer.style.display = "none";
        history.replaceState("", document.title, window.location.pathname);
    } else {
        // Placing the emit here means it only runs when we are opening the container
        socket.emit("getFriendsAndPotential");
        socket.emit("getFriendRequests");
        friendsContainer.style.display = "flex";
    }  
}
    // ANIMATION FOR FRIENDS NOT WORKING RIGHT NOW
    
    // console.log("height", friendsDiv.style.height)
    // // friendsDiv.style.height = "90%";
    // friendsDiv.style.animation = "friends 2s";
    // friendsDiv.style.animationFillMode = "forwards";
    
    

    // friendsDiv.addEventListener("animationend", () => {
    //     friends.addEventListener("click", () => {
    //         friendsDiv.style.animation = "friends-reverse 2s";
    //         friendsDiv.style.animationFillMode = "forwards";
    //         // friendsDiv.style.height = "0";
    //         // friendsDiv.style.display = "none";
    //         document.body.removeChild(friendsDiv);
    //         window.location.href = "/home";
    //     })
    // })

let friendsAppended = new Array();
let recommendedFriends = new Array();
socket.on("returnFriends", friendsList => {

    console.log("friends listtttt", friendsAppended);
    console.log("recommended Friends", recommendedFriends);
    
    for (let f of friendsList) {
        let friendBar = document.createElement("div");
        let friend = document.createElement("button");
    
        friendBar.classList.add("friend-content");
        // friendContent.classList.add("friend-content");
        friend.classList.add("roundBtn_noBorder");
        friend.classList.add("no-round");

        if (friendsAppended.includes(f.friendName)) {
            console.log("Friends Appended Contains", f.friendName);
            continue;
        }
        friend.innerHTML = f.friendName;
        friendBar.setAttribute("id", "friend" + f.friendName);
        friendsAppended.push(f.friendName);
        friendBar.appendChild(friend);
        friends.appendChild(friendBar);
        friend.addEventListener("click", () => {
            window.location.href = "/profile/" + f.friendName;
            socket.emit("moving");
        })

        let removeFriend = document.createElement("button");
        let message = document.createElement("button");

        message.classList.add("addFriend");
        removeFriend.classList.add("decline");

        message.innerHTML = "message";
        removeFriend.innerHTML = "Remove Friend";

        friendBar.appendChild(message);
        friendBar.appendChild(removeFriend);
        // Accepts a friend request from a user
        message.addEventListener("click", () => {
            console.log("messaging:", f.friendName);
            // socket.emit("friendDeclined", {user: f.friendName});
        })
        // Declines a friend request from a user
        removeFriend.addEventListener("click", () => {
            
            console.log("removing friend", f.friendName);
            socket.emit("removeFriend", {user: f.friendName});
            
            let id = document.getElementById("friend"+f.friendName);

            friends.removeChild(id);

            friendsAppended.filter(name => {
                return name != f.friendName;
            })

        })
    }

    // Add search bar to friends list -> search for new friends and already added friends
    let searchBar = document.createElement("input");
    let searchBtn = document.createElement("input");
    let searchDiv = document.createElement("div");

    searchBar.setAttribute("type", "search");
    searchBtn.setAttribute("type", "button");

    searchBar.classList.add("search-bar");
    searchBtn.classList.add("search-btn");
    searchDiv.classList.add("search-div");

    searchBtn.value = "Search";
    searchBar.placeholder = "Search for a friends username...";

    searchDiv.appendChild(searchBtn);
    searchDiv.prepend(searchBar);

    // friendsContainer.prepend(searchDiv);
    // friendsDiv.prepend(searchBar);
    
    searchBtn.addEventListener("click", () => {
        let searchName = searchBar.value;

        console.log("searchName", searchName);
        socket.emit("searchForCurrentFriend", ({name: searchName}));

        searchBar.value = "";
    })
})
    
// Potential friends section, start with listing all usernames from the users table
// Later if we had time we could add conditions to show friends of friends as recommended friends
socket.on("returnPotentialFriends", (potentialFriends) => {
    
    for (let p of potentialFriends) {
        let friendBar = document.createElement("div");
        let friend = document.createElement("button");
    
        friendBar.classList.add("friend-content");
        friend.classList.add("roundBtn_noBorder");
        friend.classList.add("no-round");

        
        
        // friendsDiv.appendChild(add);
        console.log("recommmmmmm", recommendedFriends);
        if (recommendedFriends.includes(p.username)) {
            console.log("recommended friends already has name", p.username);
            continue;
        }
        if (friendRequests.includes(p.username)) {
            continue;
        }
        recommendedFriends.push(p.username);
        friend.innerHTML = p.username;
        friendBar.setAttribute("id", "recommended"+p.username);
        friendBar.appendChild(friend);
        friendRecommendations.appendChild(friendBar);
        // friendsContent.appendChild(add);

        friend.addEventListener("click", () => {
            window.location.href = "/profile/" + p.username;
            
        })

        let addFriend = document.createElement("button");
        let decline = document.createElement("button");

        addFriend.classList.add("addFriend");
        decline.classList.add("decline");

        addFriend.innerHTML = "Add";
        decline.innerHTML = "Decline";

        friendBar.appendChild(addFriend);
        friendBar.appendChild(decline);
        // Send a friend request to someone
        addFriend.addEventListener("click", () => {
            console.log("requesting to be friends with", p.username);

            
            recommendedFriends = recommendedFriends.filter(x =>{
                return x != p.username
            });
            
            let id = document.getElementById("recommended"+p.username);

            friendRecommendations.removeChild(id);

            friendRequests.push(p.username);


            socket.emit("friendRequested", {user: p.username});

            socket.on("moveToRequests", user => {

                // friendBar.classList.add("friend-content");
                // friend.classList.add("roundBtn_noBorder");
                // friend.classList.add("no-round");

                // addFriend.innerHTML = "N/A";
                // decline.innerHTML = "N/A";

                // friendBar.setAttribute("id", "request"+user.user);
                // console.log("jaskdhfjklasdfhasjdf", user);
                // console.log("jaskdhfjklasdfhasjdf", user.user);
                // friend.innerHTML = user.user;
                // friendBar.appendChild(friend);
                // friendBar.appendChild(addFriend);
                // friendBar.appendChild(decline);

                // friendRequests.push(user);

                // friendReqs.appendChild(friendBar);
            })
        })
    }
})

let friendRequests = new Array();
socket.on("returnFriendRequests", (requests) => {
    console.log("reqrasidhgaiosdgadsfg", requests);
    for (let request of requests) {
        // If the person is our friend then skip the request -> This shouldnt be needed, but safe to have
        if (friendsAppended.includes(request.requestorName)) {
            console.log("hello")
            continue;
        }
        console.log("requests", requests);
        let friendBar = document.createElement("div");
        let friend = document.createElement("button");
    
        friendBar.classList.add("friend-content");
        friend.classList.add("roundBtn_noBorder");
        friend.classList.add("no-round");

        friendBar.setAttribute("id", "request"+request.requestorName);

        friendBar.appendChild(friend);

        if (friendRequests.includes(request.requestorName)) {
            continue;
        }

        friendRequests.push(request.requestorName);

        friend.innerHTML = request.requestorName;
        
        friendReqs.appendChild(friendBar);
        // friendsContent.appendChild(add);

        friend.addEventListener("click", () => {
            window.location.href = "/profile/" + request.requestorName;
            
        })

        let accept = document.createElement("button");
        let decline = document.createElement("button");

        accept.classList.add("addFriend");
        decline.classList.add("decline");

        accept.innerHTML = "Accept";
        decline.innerHTML = "Decline";

        friendBar.appendChild(accept);
        friendBar.appendChild(decline);
        // Accepts a friend request from a user
        accept.addEventListener("click", () => {
            console.log("accepting request from", request.requestorName);



            // Remove from the requests array
            friendRequests = friendRequests.filter(name => {
                return name != request.requestorName;
            });

            console.log("what is this array now", friendRequests)
            let id = document.getElementById("request"+request.requestorName);

            friendReqs.removeChild(id);
            socket.emit("friendAccepted", {user: request.requestorName});

            socket.on("moveToFriends", user => {
                // friendBar.classList.add("friend-content");
                // friend.classList.add("roundBtn_noBorder");
                // friend.classList.add("no-round");


                // friendBar.setAttribute("id", "request"+user.user);
                // friend.innerHTML = user.user;
                // friendBar.appendChild(friend);
                // friendBar.appendChild(accept);
                // friendBar.appendChild(decline);

                // accept.innerHTML = "Message";
                // decline.innerHTML = "Remove Friend";

                // friendsAppended.push(user.user);
                // console.log("friends List", friendsAppended);

                // friends.appendChild(friendBar);
            })
        })
        // Declines a friend request from a user
        decline.addEventListener("click", () => {
            console.log("declining request from", request.requestorName);
            let id = document.getElementById("request"+request.requestorName);
            friendReqs.removeChild(id);


            socket.emit("friendDeclined", {user: request.requestorName});
        })

        if (recommendedFriends.includes(request.requestorName)) {
            let id = document.getElementById("recommended"+request.requestorName);
            console.log("idasdasd", id);
            if (id != null) {
                friendRecommendations.removeChild(id);
            }
            
        }
    }
})


