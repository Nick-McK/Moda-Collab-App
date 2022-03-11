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
    * [ ] Liked posts menu

* [ ] Tags
    * [X] ~~*Select tags*~~ [2022-03-09]
    * [X] ~~*Assign tags to profile*~~ [2022-03-09]
    * [ ] Only see posts with tags you've flagged -> Daniel
    * [ ] communities? -> lets you browse for different styles

* [ ] Rooms
    * [ ] Add collaborators to rooms with button
    * [ ] Search room names
    * [ ] Add required fields to name and password
    * [X] ~~*Delete rooms after 5 minutes with nobody in them*~~ [2022-03-04]

* [ ] Profile page
    * [ ] Sort routing for profile page, go to /account/:username
    * [ ] Add your posts to the page -> carousel of most recent posts
    * [ ] Adding picture to your profile -> socket.io file upload instead of express file upload

* [ ] Moderation
    * [ ] Add a flagged status -> If a post is flagged its removed from homepage and placed on a mod page where it is decided if it should be removed
    * [ ] If a post is removed after its flagged then add a strike to the users account


* [ ] Friends?
    * [ ] Messaging
    * [ ] Searching for new friends

* [ ] Misc
    * [ ] Give focus to the saved designs scroll before the browser
    * [ ] Styling
    * [ ] Encryption on database
    * [ ] Error handling -> stops server from crashing
    * [ ] Break shit
    * [ ] 

Bugs:
* [ ] If you update a design in the collab room then it will automatically update on the feed -> Feature

* [ ] when leaving a room last, if you then go on the room menu it will not be deleted. If you try access the room it will crash the server
    * [ ] Rereshing fixes this, possibly only way to fix is to put error handling on rooms that have been deleted when people try join

* [ ] If you mouse over the image of a post when clicking on the comment button then the animation resets
    * [ ] This also happens when click on the image of a post but you need to remove the mouse from the image and mouse over again
* [ ] Clicking on comments and having the animation fail will duplicate comments


