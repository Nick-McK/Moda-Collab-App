class Profile {
    constructor(username, tags) {
        this.username = username;
        this.tags = tags
    }
    
    getTags() {
        return this.profile;
    }
}

con.query("SELECT (whatever) FROM posts WHERE userUD = ?", [username], (err, result) => {

});

export {Profile};