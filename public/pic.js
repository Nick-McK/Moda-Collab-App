const socket = io();
const imgDiv = document.querySelector('profile_pic');
const img = document.querySelector('#photo');
const file = document.querySelector('#file');
const uploadBtn = document.querySelector('#uploadBtn');

const finishBtn = document.getElementById("finishBtn");

const div = document.createElement("h1");
let data;


window.onload = () => {
    socket.emit("details");
    

    socket.on("accountDetails", data => {
        let username = data.username;
        
        
        div.innerHTML = username;
        div.classList.add("username");
        document.body.appendChild(div);
        console.log("username", data.username);
        socket.emit("getProfile", {username: data.username});
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
