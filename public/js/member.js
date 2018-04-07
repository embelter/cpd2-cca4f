// Get a reference to the database service
var fdb = firebase.database();

function cleanEmail(str){
	return str.replace("@","%40").replace(".","%2E");
}

firebase.auth().onAuthStateChanged(function(user) {
    $("#nameSpan").text(user.displayName);
    //replace it because realdb doesn't support @ or .
    var userId = cleanEmail(user.email);
    window.userId = userId;

    //initalize the reference to our balance
    var balanceRef = fdb.ref('Users/' + userId + '/balance');

    //if a user has no value, then set it to 0
    balanceRef.once('value').then(function(snapshot) {
        if(snapshot.val() == null) {
			fdb.ref('Requests').push({
				"data": "",
				"from": userId
			});
        }
    }).then(function(){
        //automatically update the balance on the page if it changes.
        balanceRef.on('value', function(snapshot) {
            window.balance = snapshot.val();
            $("#balanceSpan").text(snapshot.val());
        });
		fdb.ref('Users/'+userId+'/notices').on('child_added', function(snapshot){
			var data = snapshot.val();
			var note = "NOTICE!\n"+(new Date(data.timestamp)).toString()+"\n";
			switch(data.type){
				case 1:
					if(data.status){
						note += "The deposit has been processed!";
					}
					else{
						note += "The deposit could not be completed!";
					}
					break;
				case 2:
					if(data.status){
						note += "The transfer has been processed!";
					}
					else{
						note += "The transfer could not be completed!"
					}
					break;
			}
			snapshot.ref.remove();
			alert(note);
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
    var toEmail = cleanEmail($("#emailField").val());
    var amount = parseInt($("#numberField").val());

    $("#numberField").val("");
    $("#emailField").val("");
    if(toEmail.length > 0 && amount > 0 && window.userId != toEmail){
		fdb.ref('Requests').push({
			"data": JSON.stringify({
				"amount": amount,
				"to": toEmail,
				"type": 2
			}),
			"from": window.userId
		});
    }
}


function depositMoney()	{
	var depositValue = parseInt($("#depositAmount").val());

	$("#depositAmount").val("");
	if(depositValue > 0){
		fdb.ref('Requests').push({
			"data": JSON.stringify({
				"amount": depositValue,
				"type": 1
			}),
			"from": window.userId
		});
	}
}
