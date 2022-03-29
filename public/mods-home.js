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
const commentsContainer = document.getElementById("commentsContainer");
const commentsContent = document.getElementById("commentsContent");
const commentSection = document.getElementById("_comments")
const commentText = document.getElementById("comment");

const feed = document.getElementById("_feed");



this.onload = () => {
    socket.emit("getFlagged");
}
let posted = [];
let commented = [];
socket.on("returnFlagged", posts => {
    for (let post of posts) {
        // console.log("post", post);
        if (posted[post.name] == post.caption) {
            continue;
        }
        posted[post.name] = post.caption;
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
        postDiv.setAttribute("id", "id: "+post.id);

        flagImg.setAttribute("src", "/public/assets/icons/flag-fill.png");
        flagDiv.appendChild(flagImg);

        let confirmDiv = document.createElement("div")
        let denyDiv = document.createElement("div");
        let confirmImg = document.createElement("img");
        let denyImg = document.createElement("img");

        confirmDiv.classList.add("flag");
        denyDiv.classList.add("flag");

        confirmDiv.appendChild(confirmImg);
        denyDiv.appendChild(denyImg);

        confirmImg.setAttribute("src", "/public/assets/icons/check-inverted.png");
        denyImg.setAttribute("src", "/public/assets/icons/x-inverted.png");

        confirmImg.addEventListener("click", () => {
            socket.emit("unflagPost", {postID: post.id});
        })

        denyImg.addEventListener("click", () => {
            socket.emit("deleteAndStrike", ({postID: post.id, username: post.user}));

            
        })

        profileImage.setAttribute("src", "/public/assets/icons/empty-profile-picture.jpeg")
        
        
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
        let LIKES = post.likes; // Set this to the database value
        const LIKES_BEFORE = post.likes;

        likeCounter.innerHTML = LIKES;
        
        barImage1.addEventListener("click", () => {
            if (LIKES_BEFORE != LIKES) {
                LIKES--;
                // likeCounter.style.color = 
                barImage1.setAttribute("src", "/public/assets/icons/heart-inverted.png");
            } else {
                LIKES++;
                barImage1.setAttribute("src", "/public/assets/icons/heart-fill.png");
            }
            likeCounter.innerHTML = LIKES;
            socket.emit("liked", {likes: LIKES, id: post.id});
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
        postTop.appendChild(confirmDiv);
        postTop.appendChild(denyDiv);
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
            socket.emit("postComment", {comment: commentValue, postID: post.id, name: post.name, caption: post.caption});
        }
        // Flagging event
        flagImg.addEventListener("click", () => {
            socket.emit("postFlagged", {postID: post.id})
        })

        


    }

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
                if (!commented.includes(comment)) {
                    commentSection.prepend(commentDiv);
                }
                
                commented.push(comment);
                
            
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
                        console.log("commented", commented);
                        
                            
                            
                    
    
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
                        console.log("commented", commented);
                        
                            
                            
                    
    
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

    // for (let bar of postBar) {
    //     let barchildren = bar.children[2];
    //     console.log("barchildren", barchildren);
        
    //     barchildren.addEventListener("click", () => {
    //         showComments();
    //     })
    // }

});

socket.on("removePostFromMod", data => {

    let id = document.getElementById("id: "+data.postID);

    feed.removeChild(id);
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

// FRIENDS STUFF -> COPIED FROM HOMEPAGE
const friendsBtn = document.getElementById("friends");
let friends = document.getElementById("_friends");
let friendRecommendations = document.getElementById("_friend-recommendations");
let friendReqs = document.getElementById("_friend-requests");
const friendsContainer = document.getElementById("_friends-container");
friendsBtn.onclick = () => {
    if (friendsContainer.style.display == "flex") {
        friendsContainer.style.display = "none";
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