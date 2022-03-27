# Moda-Collab-App
Collaborative social media application

# Steps to install
1. Install nodejs https://nodejs.org/en/download/ (make sure to add node to your system path variable)
2. Navigate to the Moda-Collab-App directory where server.js is located
3. Run the command `npm install`
4. Navigate to the node_modules folder
5. Enter the fabic folder
6. Run `node build.js modules='ALL'`
7. Download MySQL Workbench from https://dev.mysql.com/downloads/workbench/
8. Run the setup launcher
9. Setup a local instance running on localhost:3306
10. Import the **Moda Collab MySQL Model** to the Workbench instance
11. Download MongoDB Compass
12. Add a New Conneciton with the connection string "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false"
13. Run `node server.js`

# Program Use
After running `node server.js`, Users can access the program at **localhost:3000** in any browser. This will allow the user to access the Landing Page of the website.
It should be noted that the program uses browser sessions to store login information, so if a user wanted to test the multiplayer aspect all on one local machine, they should use a different browser for each user.

- Users can register an account from the landing page and login
- Upon registering an account, users have the option to select which tags they want to have associated with their account (Streetware, Luxury, etc)
- After logging in, users are redirected to the Homepage. Here they can view posts from other users.
- To create designs, users should navigate to the phone icon in the footer of the Homepage. From there users can start their own Collaboration Room.
- Users should then set a name for the room, and a password if they wish
- Once in the Collaboration Room, other users can now join the room for real-time collaboration
- Users in a Collaboration Room can use a multitude of tools to create and manipulate object to build their designs
- Users can import clothing templates to provide guidance for their designs
- Users can Save their designs, they have both the option to save as a new design or overwrite an existing design
- Users can Load exsisting saved designs of theirs
- On the Homepage users can select the "plus" icon in the footer to create a post of their design
- Other users can comment on a post using the comment button appended to each post
- Users can save other users designs via the central button on each post
- Users can then build off of these designs in a Collaboration Room

# Primary Features
- Collaboration Room to create and save clothing designs with other users
- Posting designs for other users to view and build off of
- Homepage to view and save designs from other users
- Liked Posts form to view all posts you have liked
- Saved Designs form to view all designs you have saved
- Profile Page to view posts you have made and other relevant details about your account
- Users can flag posts for inappropriate content, Moderators can view and remove flagged posts from their Homepage
