* [ ] posts
    * [X] ~~*Likes*~~ [2022-03-02]
    * [X] ~~*Comments*~~ [2022-03-10]
    * [ ] Notifications?
    * [X] ~~*Open post on click to view more details*~~ [2022-03-08]
        * [X] ~~*Move post from its position to centre screen*~~ [2022-03-08]
        * [X] ~~*slowly increase post size -> just before its full size, open container*~~ [2022-03-08]
        * [X] ~~*when we close container, reverse all animations*~~ [2022-03-08]
        * [X] ~~*place post back in its position*~~ [2022-03-08]
    * [X] ~~*Navbar*~~ [2022-03-02]
        * [ ] Add media control so phone users get burger menu's
    * [X] ~~*save designs from the posts menu*~~ [2022-03-10]
    * [X] ~~*Liked posts menu*~~ [2022-03-24]
    * [ ] Discover page? where you can see all posts not just posts with your tags
    * [ ] Delete posts -> Do this on the profile page, so we can easily tell if the post is yours

* [ ] Tags
    * [X] ~~*Select tags*~~ [2022-03-09]
    * [X] ~~*Assign tags to profile*~~ [2022-03-09]
    * [ ] Only see posts with tags you've flagged
    * [ ] communities? -> lets you browse for different styles

* [ ] Rooms
    * [ ] Search for adding collaborators using same method as searching for friends
    * [ ] Search room names
    * [ ] Remove success parameter from homepage URL once alert has been given
    * [ ] Add required fields to name and password
    * [X] ~~*Delete rooms after 5 minutes with nobody in them*~~ [2022-03-04]

* [ ] Profile page
    * [X] ~~*Sort routing for profile page, go to /account/:username*~~ [2022-03-21]
    * [X] ~~*Add your posts to the page -> carousel of most recent posts*~~ [2022-03-21]
    * [X] ~~*Adding picture to your profile -> socket.io file upload instead of express file upload*~~ [2022-03-21]
    * [ ] Change tags somewhere either in here on in a settings page for editing profile
    * [X] ~~*Remove the ability to change a persons picture on their profile if its not the users own profile -> check if the pathname == username in session data*~~ [2022-03-23]
    * [X] ~~*Clean up profile page*~~ [2022-03-23]
    * [X] ~~*Put a make mod button on each persons profile for moderators to see*~~ [2022-03-23]

* [ ] Settings page 
    * [ ] Change username
    * [ ] password
    * [ ] Bio
    * [ ] possible change real name
    * [X] ~~*Change profile pic -> move from just being on profile page maybe*~~ [2022-03-23]

* [ ] Moderation
    * [X] ~~*Add a flagged status -> If a post is flagged its removed from homepage and placed on a mod page where it is decided if it should be removed*~~ [2022-03-17]
    * [X] ~~*If a post is removed after its flagged then add a strike to the users account*~~ [2022-03-17]
    * [X] ~~*Add a method to apply for moderation status to the site -> currently only available to people if its hacked into the table itself*~~ [2022-03-23]


* [ ] Friends
    * [ ] Messaging
    * [ ] Searching for new friends
    * [X] ~~*Clean up friends css*~~ [2022-03-23]
    * [ ] Remove friends + Messaging + add profile pictures to the friends list
    * [ ] Browse for friends using a search bar -> just query the database and return the person with the username that the person searched for

* [ ] Misc
    * [ ] Give focus to the saved designs scroll before the browser
    * [ ] Styling
    * [ ] Encryption on database
    * [X] ~~*Error handling -> stops server from crashing*~~ [2022-03-23]
    * [ ] Break shit
    * [ ] Rename aarons socket fuck knows
    

Bugs:
* [ ] If you update a design in the collab room then it will automatically update on the feed -> Feature

* [ ] when leaving a room last, if you then go on the room menu it will not be deleted. If you try access the room it will crash the server
    * [ ] Rereshing fixes this, possibly only way to fix is to put error handling on rooms that have been deleted when people try join

* [ ] If you mouse over the image of a post when clicking on the comment button then the animation resets -> Kinda fixed can be better tho
    * [X] ~~*This also happens when click on the image of a post but you need to remove the mouse from the image and mouse over again*~~ [2022-03-17]
    * [X] ~~*Clicking on comments and having the animation fail will duplicate comments*~~ [2022-03-17]

* [X] ~~*If you like a post then refresh then you can like the post again, so 1 person can like a post as many times as they want*~~ [2022-03-17]

* [X] ~~*After leaving a room and joining, the room is still deleted then crashes server.*~~ [2022-03-17]

* [X] ~~*Error handling for flagging posts twice.*~~ [2022-03-17]
* [ ] If there are no posts in the second column of the feed then we get an error and the animation for viewing comments cannoy play

* [X] ~~*Drawings printing to the most recent room drawn*~~ [2022-03-19]
* [ ] If the session runs out and we are still in a collab room (anywhere else?) then server crashes
* [ ] If we post the placeholder image we crash the server as its not in mongo




* [ ] Final TODO

* [X] ~~*Tags on posts -> insert tags column and then only display posts with the same tags as the user selected*~~ [2022-03-24]
* [ ] Search for friends using the bar -> Add people to rooms with add collab
* [ ] Try get friends display working so that if I add a friend from recommendations it is removed from that list and added to requests

* [ ] Fix css for post page

Maybe:
* [ ] Delete posts