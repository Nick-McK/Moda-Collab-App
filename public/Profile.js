class Profile {
    constructor(username, tags) {
        this.username = username;
        this.tags = tags
    }
    
    getTags() {
        return this.profile;
    }
}
<<<<<<< Updated upstream

con.query("SELECT (whatever) FROM posts WHERE userUD = ?", [username], (err, result) => {

});

=======
con.query("SELECT (whatever) FROM posts WHERE userUD = ?", [username], (err, result) => {
    const postImages = document.querySelectorAll(".post_img");
    const postTop = document.querySelectorAll(".post-top");
    const postBar = document.querySelectorAll(".post-bar")
});
>>>>>>> Stashed changes
export {Profile};