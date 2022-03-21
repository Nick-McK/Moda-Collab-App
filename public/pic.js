const socket = io();
const imgDiv = document.querySelector('profile_pic');
const img = document.querySelector('#photo');
const file = document.querySelector('#file');
const uploadBtn = document.querySelector('#uploadBtn');

const finishBtn = document.getElementById("finishBtn");

const div = document.createElement("h1");
let data;




const selectImage = document.getElementById("selectImage");
const upload = document.getElementById("upload");
const postButton = document.getElementById("post");
const postName = document.getElementById("_postName");
const postCaption = document.getElementById("_postCaption");
const posts = document.querySelectorAll(".post");

const commentsContainer = document.getElementById("commentsContainer");
const commentsContent = document.getElementById("commentsContent");
const commentSection = document.getElementById("_comments")
const commentText = document.getElementById("comment");

const feed = document.getElementById("_feed");


function getUser() {
    let path = decodeURI(location.pathname);        // Decode URI sorts out any special characters like spaces
    let user = path.split("/")[2]
    return user;
}
// These are defined so that we dont duplicate posts or comments
let posted = [];
let commented = [];

window.onload = () => {
    // Gets the username from the URL to send to the server and get all the relevant details
    let user = getUser();

    console.log("THIS IS OUR USER", user);
    // Sends a socket to get all the details for the user specified
    socket.emit("details", {user: user}); 
    

    socket.on("accountDetails", posts => {


        console.log("posts", posts);
        for (let post of posts) {
            let username = post.user;

            console.log("this is username", username);
            
            
            div.innerHTML = username;
            div.classList.add("username");
            document.body.prepend(div);
            console.log("username", post.user);

            for (let post of posts) {
                if (posted[post.id] == post.caption) {
                    continue;
                }
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
        
            socket.on("postAlreadyExists", (postName) => {
                alert("a post with the name " + postName + "already exists");
            })
            // Adds event listeners to all the images so that we don't have growing posts
        
            const postImages = document.querySelectorAll(".post_img");
            const postTop = document.querySelectorAll(".post-top");
            const postBar = document.querySelectorAll(".post-bar")
            // console.log("sfasdf", postImages)
            for (let image of postImages) {
                // console.log("image", image);
                let post = image.parentElement.parentElement;
                let child = post.children;
                let postTop = child[0].children;
                // console.log("posts", post);
                // console.log("psot1", child);
                // console.log("postTop", postTop);
                image.addEventListener("mouseenter", mouseover(image))//() => {
                //     post.style.transition = "transform 1s";
                //     post.style.transitionDelay = "1s"
                //     post.style.transform = "scale(1.15, 1.15)";
                //     post.style.boxShadow = "0 0 2em white;"
                //     post.style.left = "0";
                //     post.style.top = "0";
        
                //     // console.log("ethiasdhgtasd", post.getBoundingClientRect().left);
        
                //     post.addEventListener("transitionend", () => {
                //         child[0].style.transition = "opacity 1s ease-in-out";
                //         child[0].style.opacity = "1";
                //     })
                // })
                // image.addEventListener("mouseleave", () => {
                //     post.style.transform = "scale(1,1)";
                //     post.addEventListener("transitionend", () => {
                //         child[0].style.transition = "opacity 1s ease-in-out";
                //         child[0].style.opacity = "0";
                //     })
                    
                // });
                
                let imageOldLeft = post.offsetLeft;
                let newLeftOffset = imageOldLeft - 384;
        
                // ANIMATION FOR OPENING COMMENTS
                
                image.addEventListener("click", () => {
                    image.removeEventListener("mouseenter", mouseover(image));
                    post.removeEventListener("transitionend", () => {
                        child[0].style.transition = "opacity 1s ease-in-out";
                        child[0].style.opacity = "1";
                        console.log("removed transition");
                    })
                    showComments(image, mouseover(image));
                    // callback(image);
                })
        
                
            }
            function mouseover(image) {
                console.log("mousing over now");
                let post = image.parentElement.parentElement;
                let child = post.children
                image.addEventListener("mouseenter", () => {
                    post.style.transition = "transform 1s";
                    post.style.transitionDelay = "1s"
                    post.style.transform = "scale(1.15, 1.15)";
                    post.style.boxShadow = "0 0 2em white;"
        
                    // console.log("ethiasdhgtasd", post.getBoundingClientRect().left);
        
                    post.addEventListener("transitionend", function postTransition() {
                        console.log("finished expanding");
                        child[0].style.transition = "opacity 1s ease-in-out";
                        child[0].style.opacity = "1";
                        // child[0].style.transitionDirection
                        // post.removeEventListener("transitionend", postTransition)
                    })
                })
                post.addEventListener("mouseleave", () => {
                    post.style.transform = "scale(1,1)";
                    post.addEventListener("transitionend", () => {
                        child[0].style.transition = "opacity 1s ease-in-out";
                        child[0].style.opacity = "0";
                    })
                    
                });
            }
        
            function showComments(image, callback) {
        
                let post = image.parentElement.parentElement;
                let child = post.children;
        
        
                // Retrieve the comments on click
                socket.emit("getComments", {postID: image.getAttribute("alt")});
                // If we don't do socket.on for the comments here, then they don't show on the first opening of a post
                socket.on("returnComments", data => {
                    // TODO: WRITE THE COMMENTS TO THE SCREEN, CURRENTLY DUPLICATING COMMENTS ON EACH VISIT
                    console.log("here");
                    if (data.comments.length == 0) {
                        commentSection.innerHTML = "";
                    }
                    for (let comment of data.comments) {
                        console.log("comment", comment);
                        let commentDiv = document.createElement("div");
                        let profilePicDiv = document.createElement("div");
                        let profilePicImg = document.createElement("img");
                        let commentContent = document.createElement("p");
                        commentContent.innerHTML = comment.comment;
                        commentDiv.classList.add("comment");
                        commentDiv.appendChild(profilePicDiv);
                        profilePicDiv.appendChild(profilePicImg);
                        profilePicDiv.classList.add("profile-pic");
                        profilePicImg.setAttribute("src", "/public/assets/icons/empty-profile-picture.jpeg");
                        commentDiv.appendChild(commentContent);
                        if (!commented.includes(comment.comment)) {
                            commentSection.prepend(commentDiv);
                            console.log("doesnt include");
                            commented.push(comment.comment);
                        }
                        
                        
                        
                    
                    }
                })
                // Careful this will not work if there is no post in the second column of the feed!
                const col2 = document.querySelector(".feed > :nth-child(3n-1");
                const col1 = document.querySelector(".feed > :nth-child(3n-2");
            
                const col1All = document.querySelectorAll(".feed > :nth-child(3n-2");
                const col2All = document.querySelectorAll(".feed > :nth-child(3n-1");
                const col3All = document.querySelectorAll(".feed > :nth-child(3n)");
            
                // columnNumber = getCols(post);
                console.log("column 2", col2All);
                console.log("column 3", col3All);
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
            
                
                console.log("this is col value", col);
                const clientY = window.innerHeight / 2;
                const scrollY = document.documentElement.scrollTop;
                const clientH = document.documentElement.clientTop;
            
                const scrollTop = window.scrollY;
                
                const feed = document.getElementById("_feed"); // not sure why we need to redecalre this but if its not here it breaks
            
                const gridWidth = feed.offsetWidth;
                const gridHeight = feed.offsetHeight;
                const postWidth = post.offsetWidth;
                const postLeft = post.offsetLeft
                const postHeight = post.offsetHeight;
                const postTop = post.offsetTop;
            
                // If column is == 1 then move it to centre and if col is == 3 move to centre
                // Using if as we need to minus coords if the post is in col 3
                if (col == true) {
                    if (postLeft != col2.offsetLeft) {
                        // post.style.right = "0";
                        // post.style.bottom = "0";
                        post.style.left = ((gridWidth - postWidth) / 2)- 10;
                        // post.style.top = ((gridHeight - postHeight) / 2) - 10;
                        // console.log("clientHeight: ", (clientY - postTop) - 160)
                        post.style.top = scrollTop + (clientY - postTop) - 160; // Calculates the centre of the screen (kinda) with scrolling included
                        // post.style.top = (scrollY - clientH) / 2;
                        post.style.transition = "all 2s ease-in-out";
        
                        
                        
                        post.addEventListener("transitioncancel", () => {
                            console.log("transition cancelled");
        
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
                                    // commentsContainer.style.animationDelay = "1s";
                                    commentsContainer.style.display = "none";
            
                                    post.style.animation = "grow 1s";
            
                                    post.style.left = -((postWidth) / postWidth) + 1;
                                    post.style.top = -(postHeight / postHeight) + 1;
                                    post.style.transition = "all 2s";
                                    mouseover(image);
            
                                });
                                
                                // post.style.animation = "grow 1.5s";
                                // post.style.animationDelay = "0.25s";
                                // post.style.animationDirection = "forwards";
                            }
                        })
            
            
                        // Only play the animation after we have transitioned to the middle of the screen
                        post.addEventListener("transitionend", () => {
                            
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
                                
            
                                commentImage.setAttribute("src", postImage.src);
                                commentImage.style.width = "100%";
                                commentImage.style.height = "100%";
        
                                const close = document.getElementById("closeComments");
            
                                close.addEventListener("click", (callback) => {
                                    
                                    commentsContainer.style.animation = "opacity-reverse 1.75s" // Could try use animationDirection but this is easier
                                    // commentsContainer.style.animationDelay = "1s";
                                    commentsContainer.style.display = "none";
            
                                    post.style.animation = "grow 1s";
            
                                    post.style.left = -((postWidth) / postWidth) + 1;
                                    post.style.top = -(postHeight / postHeight) + 1;
                                    post.style.transition = "all 2s";
                                    mouseover(image);
            
                                });
                                
                                // post.style.animation = "grow 1.5s";
                                // post.style.animationDelay = "0.25s";
                                // post.style.animationDirection = "forwards";
                            }
                        });
                    }
                    // if (postLeft == col2.offsetLeft) {
                    //     post.style.left = -((postWidth) / postWidth) + 1;
                    //     post.style.top = -(postHeight / postHeight) + 1;
                    //     post.style.transition = "all 2s";
                    //     post.style.zIndex = "1000";
                        
                    // }
                } else if (col == false) {
                    if (postLeft != col2.offsetLeft || postLeft != col2.offsetLeft + 1) {
                        post.style.left = -((gridWidth - postWidth) / 2) + 10;
                        // post.style.top = ((gridHeight - postHeight) / 2) + 10;
                        post.style.top = scrollTop + (clientY - postTop) - 160; // Calculates the centre of the screen (kinda) with scrolling included
                        post.style.transition = "all 2s";
            
                        
            
                        // Only play the animation after we have transitioned to the middle of the screen
                        post.addEventListener("transitionend", () => {
                            // If the post is in the middle of the screen then play the animation grow
                            if (post.style.left == -((gridWidth - postWidth) / 2) + 10 + "px") {
            
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
            
                                close.addEventListener("click", () => {
                                    commentsContainer.style.animation = "opacity-reverse 1.75s" // Could try use animationDirection but this is easier
                                    // commentsContainer.style.animationDelay = "1s";
                                    commentsContainer.style.display = "none";
            
                                    post.style.animation = "grow 1s";
            
                                    post.style.left = -((postWidth) / postWidth) + 1;
                                    post.style.top = -(postHeight / postHeight) + 1;
                                    post.style.transition = "all 2s";
                                    callback(image);
                                });
                            }
                        });
                    }
                    // if (postLeft == col2.offsetLeft || postLeft == col2.offsetLeft + 1) {
                    //     post.style.left = ((postWidth) / postWidth) - 1;
                    //     post.style.top = (postHeight / postHeight) - 1;
                    //     post.style.transition = "all 2s";
            
                    // }
                } else if (col == null) {
                    if (postLeft == col2.offsetLeft) {
                        post.style.top = scrollTop + (clientY - postTop) - 160; // Calculates the centre of the screen (kinda) with scrolling included
                        post.style.transition = "all 2s";
            
                        post.addEventListener("transitionend", () => {
                            if (post.style.top == scrollTop + (clientY - postTop) - 160 + "px") {
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
            
                                close.addEventListener("click", () => {
                                    commentsContainer.style.animation = "opacity-reverse 1.75s";
            
                                    commentsContainer.style.display = "none";
            
                                    post.style.animation = "grow 1s";
            
                                    post.style.top = (postHeight / postHeight) - 1;
                                    post.style.transition = "all 2s";
                                    callback(image);
                                })
                            }
                        })
                    }
                }
                // image.addEventListener("mouseenter", () => {
                //     post.style.transition = "transform 1s";
                //     post.style.transitionDelay = "1s"
                //     post.style.transform = "scale(1.15, 1.15)";
                //     post.style.boxShadow = "0 0 2em white;"
                //     post.style.left = "0";
                //     post.style.top = "0";
        
                //     // console.log("ethiasdhgtasd", post.getBoundingClientRect().left);
        
                //     post.addEventListener("transitionend", () => {
                //         child[0].style.transition = "opacity 1s ease-in-out";
                //         child[0].style.opacity = "1";
                //     })
                // })
        
                
            }




            socket.emit("getProfile", {username: post.user});
        }
    })
    socket.on("returnProfile", (data) => {
        // let newimg = document.createElement("img");
        // let div1 = document.getElementById("testing");
        // newimg.setAttribute("src", data.picture);
    
        // div1.appendChild(newimg);
    
        img.setAttribute("src", data.picture);
    })

}



file.addEventListener('change', function(){
    
    const chosenFile = this.files[0];

    if (chosenFile && (chosenFile.type=="image/jpeg" || chosenFile.type=="image/png")) {

        const reader = new FileReader(); 

        reader.addEventListener('load', function(){
            img.setAttribute('src', reader.result);

            console.log("reader", reader.result);
        });

        

        reader.readAsDataURL(chosenFile);

        // Once the picture is loaded emit to the server to save in database
        // reader.onload = () => {

        //     console.log("data", data);
        //     socket.emit("NewProfilePic", data);
        // } 
    } else {
        alert("File not chosen or incompatible file type, please upload PNG or JPEG only.")
    }
});



// finishBtn.onclick = () => {
//     const imageURL = img.getAttribute("src");
//     console.log("imageURL", imageURL);
//     socket.emit("testing", {image: imageURL});
//     // console.log("-----------------------------------------------------------", img.getAttribute("src"));
//     socket.emit("setProfilePic", {profileImg: img.getAttribute("src"), username: div.innerHTML});
// } 
