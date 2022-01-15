import {Profile} from "./Profile.js";


let tagList = new Array();
let profileMap = new Map();
let profileTags = new Array();

document.onpageload = populateTags();
document.onpageload = dummyProfiles()
// document.onpageload = randomTags();

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
