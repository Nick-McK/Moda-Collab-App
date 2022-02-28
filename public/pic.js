const socket = io();
const imgDiv = document.querySelector('profile_pic');
const img = document.querySelector('#photo');
const file = document.querySelector('#file');
const uploadBtn = document.querySelector('#uploadBtn');

window.onload = () => {
    socket.emit("details")

    socket.on("accountDetails", data => {
        let username = data.username;

        const div = document.createElement("h1");
        div.innerHTML = username;
        div.classList.add("username");
        document.body.appendChild(div);
        console.log("woooo");
    })
}
socket.on("username")

file.addEventListener('change', function(){
    
    const chosenFile = this.files[0];

    if (chosenFile && (chosenFile.type=="image/jpeg" || chosenFile.type=="image/png")) {

        const reader = new FileReader(); 

        reader.addEventListener('load', function(){
            img.setAttribute('src', reader.result);
        });

        

        reader.readAsDataURL(chosenFile);
        let data = reader.result
        // Once the picture is loaded emit to the server to save in database
        reader.onload = () => {
            socket.emit("NewProfilePic", data);
        } 
    } else {
        alert("File not chosen or incompatible file type, please upload PNG or JPEG only.")
    }
});