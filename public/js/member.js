// Get a reference to the database service
var database = firebase.database();

firebase.auth().onAuthStateChanged(function(user) {
    $("#nameSpan").text(user.displayName);
    //replace it because realdb doesn't support @ or .
    var userId = user.email.replace("@","AT").replace(".","DOT");
    window.userId = userId;
        
    //initalize the reference to our balance
    var balanceRef = firebase.database().ref('Users/' + userId);

    //if a user has no value, then set it to 0
    balanceRef.once('value').then(function(snapshot) {
        if(snapshot.val() == null) {
            firebase.database().ref('Users/' + userId).set(0);
        }
    }).then(function(){ 
        //automatically update the balance on the page if it changes.
        balanceRef.on('value', function(snapshot) {
            window.balance = snapshot.val();
            $("#balanceSpan").text(snapshot.val());
        });
    });
});

function signOut() {
    firebase.auth().signOut().then(function() {
        window.location = "/";
      }).catch(function(error) {
        // An error happened.
        window.location = "/";
    });
}

function sendMoney() {
    var toEmail = $("#emailField").val().replace("@","AT").replace(".","DOT");
    var amount = parseInt($("#numberField").val());

    $("#numberField").val("");
    $("#emailField").val("");
    var finalFrom = window.balance - amount;
    if(finalFrom > 0 && amount > 0){
        firebase.database().ref('Users/' + window.userId).set(finalFrom);

        var toAccount = firebase.database().ref('Users/' + toEmail);

        toAccount.once('value').then(function(snapshot) {
            if(snapshot.val() == null) {
                toAccount.set(amount);
            } else {
                toAccount.set(amount+snapshot.val());
            }
        })
    }

}