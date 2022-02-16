const socket = io();
const imgDiv = document.querySelector('profile_pic');
const img = document.querySelector('#photo');
const file = document.querySelector('#file');
const uploadBtn = document.querySelector('#uploadBtn');

file.addEventListener('change', function(){
    
    const chosenFile = this.files[0];

    if (chosenFile) {

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
    }
});