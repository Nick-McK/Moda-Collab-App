const socket = io();

class Profile {
    constructor(username, tags) {
        this.username = username;
        this.tags = tags
    }
    
    getTags() {
        return this.profile;
    }
}

document.onload = () => {
    console.log("getting posts");
    socket.emit('getProfilePosts');
}

let posted = {};
let commented = [];
socket.on("posts", posts => {
    console.log("posts", posts);
    console.log("what isthis", posts[0].id);
    displayPost(posts);
});
/**
 * 
 * @param {Array} posts An array of objects that contains details about each post to be displayed to the screen
 * This is abstracted to reduce code duplication. This method takes all posts in the array and creates an element
 * for them on screen, conforming to the post layout determined in the commented out post class in the Homepage
 * 
 * We also add event listeners to play for our animations to work.
 */
function displayPost(posts) {
    for (let post of posts) {
        if (posted[post.id] == post.caption) {
            continue;
        }
        console.log(posts[0].postName);
        posted[post.id] = post.caption;
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
        
        let likeCounter = document.createElement("sup"); // Creates a superscript tag to show the number of likes
        let flagDiv = document.createElement("div");
        let flagImg = document.createElement("img");

        flagDiv.classList.add("flag");

        flagImg.setAttribute("src", "assets/icons/flag-fill.png");
        flagDiv.appendChild(flagImg);

        

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

        postImage.setAttribute("src", post.design);
        postImage.setAttribute("alt", post.id);

        barImage1.setAttribute("src", "/public/assets/icons/heart-inverted.png");

        socket.on("likedByUsers", data => {
            let likes = data.likes;

            // Need this for when the post has just been added, as we create the userIDs part if the post has more than 0 likes
            // And because it makes it work, kinda not sure why because it worked without it
            if (likes[post.id] == undefined) {
                LIKED = false;
            } else if (likes[post.id].userIDs[post.sessionID] == post.sessionID) {
                console.log("I exist!");
                var LIKED = true;
                barImage1.setAttribute("src", "/public/assets/icons/heart-fill.png");
            } else {
                LIKED = false;
                console.log("values");
            }
        
            let LIKES = post.likes; // Set this to the database value
            const LIKES_BEFORE = post.likes;

            likeCounter.innerHTML = LIKES;
            
            barImage1.addEventListener("click", () => {
                if (LIKED == true) {
                    LIKES--;
                    LIKED = false;
                    // likeCounter.style.color = 
                    barImage1.setAttribute("src", "/public/assets/icons/heart-inverted.png");
                    socket.emit("liked", {likes: LIKES, id: post.id, liked: LIKED});
                } else if (LIKED == false) {
                    LIKES++;
                    LIKED = true;
                    barImage1.setAttribute("src", "/public/assets/icons/heart-fill.png");
                    socket.emit("liked", {likes: LIKES, id: post.id, liked: LIKED});
                }
                likeCounter.innerHTML = LIKES;
                
            })
        })
        barImage2.setAttribute("src", "/public/assets/icons/archive-box-inverted.png");

        barImage2.addEventListener("click", () => {
            socket.emit("savePostedDesign", {design: post.id, creator: post.user});
        })
        
        barImage3.setAttribute("src", "/public/assets/icons/chat-circle-inverted.png");

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
        const feed = document.getElementById("_feed");
        postDiv.style.left = "0";
        postDiv.style.top = "0";
        feed.prepend(postDiv); // This is prepend as we want the newest posts at the top of the feed

        const postComment = document.getElementById("postComment");

        postComment.onclick = () => {
            let commentValue = commentText.value;
            console.log("content", commentValue);
            commentText.value = "";
            console.log("does this work", post.id);
            socket.emit("postComment", {comment: commentValue, postID: post.id, name: post.name, caption: post.caption, user: post.user});
        }
        // Flagging event
        flagImg.addEventListener("click", () => {
            socket.emit("postFlagged", {postID: post.id})
        })
    }
}
export {Profile};