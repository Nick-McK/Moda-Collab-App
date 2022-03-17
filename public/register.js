var socket;

window.onload = () => {
    socket = io();        // Initialise socket connection


    console.log("this is called")
    document.getElementById('user').focus();        // Forces focusout to trigger username validation
}

function checkPassMatch() {
    var submit = document.getElementById('submit');

    if (document.getElementById('pass1').value == document.getElementById('pass2').value) {
        submit.disabled = false;
    } else {
        submit.disabled = true;
        window.alert("Passwords do not match");
    }
  }


  // Phone Num regex acquired from:
  // https://stackoverflow.com/questions/26211225/validating-phone-numbers-using-javascript
  function checkPhoneNumber() {
    var submit = document.getElementById('submit');

    console.log("aaaaaaaa")

    var regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im
    var num = document.getElementById('contactNo').value;
    var phoneNum = num.replace(/[^\d]/g, '');
    if (regex.test(phoneNum)) {
        
    }
    if(phoneNum.length > 6 && phoneNum.length < 11) {
        submit.disabled = false;
    } else {
        submit.disabled = true;
        // confirm("Invalid Phone Number\nNumber must be between 6-11 digits long");
    }
  }

  function checkDuplicateUsername() {
    var submit = document.getElementById('submit');
    var user = document.getElementById('user').value;

    socket.emit('usernameValidationRequest', (user), function(duplicated) {
        if (duplicated) {
            document.getElementById('user').value = '';
            alert("Username is taken\nPlease choose another");
            submit.disabled = true;
        } else {
            submit.disabled = false;
        }
    });
  }    