//import {Profile} from "./Profile.js";

const socket = io();
let tagList = [];

function updateTag(tagName){
    if(!tagList.includes(tagName)){
        tagList.push(tagName);
        document.getElementById(tagName).innerHTML = "checked";
    }else{
        tagList.splice(tagList.indexOf(tagName), 1);
        document.getElementById(tagName).innerHTML = tagName;
    }
    console.log(tagList);
}

function sendTagData(){
    socket.emit('sendTagData', tagList);
}

socket.on('tagDataResponse', (response) => {
    if(response == true){
        window.location.href = "/home";
    }else{
        alert("Please select at least one tag");
    }
});



//let tagList = new Array();
//let profileMap = new Map();
//let profileTags = new Array();

//document.onpageload = populateTags();
//document.onpageload = dummyProfiles()
// document.onpageload = randomTags();

//class CustomSelect {
//  constructor(originalSelect) {
//    this.originalSelect = originalSelect;
//    this.customSelect = document.createElement("div");
//    this.customSelect.classList.add("select");
//
//    this.originalSelect.querySelectorAll("option").forEach((optionElement) => {
//      const itemElement = document.createElement("div");
//
//      itemElement.classList.add("select__item");
//      itemElement.textContent = optionElement.textContent;
//      this.customSelect.appendChild(itemElement);
//
//      if (optionElement.selected) {
//        this._select(itemElement);
//      }
//
//      itemElement.addEventListener("click", () => {
//        if (
//          this.originalSelect.multiple &&
//          itemElement.classList.contains("select__item--selected")
//        ) {
//          this._deselect(itemElement);
//        } else {
//          this._select(itemElement);
//        }
//      });
//    });
//
//    this.originalSelect.insertAdjacentElement("afterend", this.customSelect);
//    this.originalSelect.style.display = "none";
//  }
//
//  _select(itemElement) {
//    const index = Array.from(this.customSelect.children).indexOf(itemElement);
//
//    if (!this.originalSelect.multiple) {
//      this.customSelect.querySelectorAll(".select__item").forEach((el) => {
//        el.classList.remove("select__item--selected");
//      });
//    }
//
//    this.originalSelect.querySelectorAll("option")[index].selected = true;
//    itemElement.classList.add("select__item--selected");
//  }
//
//  _deselect(itemElement) {
//    const index = Array.from(this.customSelect.children).indexOf(itemElement);
//
//    this.originalSelect.querySelectorAll("option")[index].selected = false;
//    itemElement.classList.remove("select__item--selected");
//  }
//}
//
//document.querySelectorAll(".custom-select").forEach((selectElement) => {
//  new CustomSelect(selectElement);
//});

//This code is all from a youtube it genuinely doesnt work as far as I know but I have legit no clue why all this does nothing

//let streetBtn = document.getElementById("Streetwear");

/*
function populateTags() {
    tagList.push("animals");
    tagList.push("photography");
    tagList.push("games");
    return tagList;
}

function dummyProfiles() {
    for(let i = 0; i < 10; i++) {
        profileMap.set(i, new Profile(i, profileTags));
    }
}
function randomTags() {
    for (let i = 0; i < 2; i++) {
        let rand = Math.random();
        let randInt = Math.floor(rand * 3);

        profileTags.push(tagList[randInt]);
    }
    let y = 0;
    profileMap.set(y, new Profile(y, profileTags));
    y++;
}

console.log("profileMap: ", profileMap);

let animal = document.getElementById("animal");

console.log("profile tags", profileTags);

animal.addEventListener("click", addToProfileTagList, false)

function addToProfileTagList() {
    profileTags.push("animal");
    let curProfile = profileMap.get(0);
    let curProf = profileMap.get(1);

    console.log("curProf", curProfile);
    console.log("curProf2", curProf);
}



// class Profile {
//     constructor(username, tags) {
//         this.username = username;
//         this.tags = tags;
//         // this.tag1 = tag1;
//         // this.tag2 = tag2;
//     }

//     getTags() {
        
//         console.log("This is our profiles keys: ", Object.keys(Profile));
//         // For each element of the taglist check if the profile has that tag assigned to it
//         for (let tag of tagList) {
//             // Object.keys(Profile);
//             // if (this)
//         }
//     }

// }

*/
