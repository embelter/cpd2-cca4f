// Get a reference to the database service
var fdb = firebase.database();

function cleanEmail(str){
	return str.replace(/\./g, "%2E").replace(/#/g, "%23").replace(/\$/g, "%24").replace(/\[/g, "%5B").replace(/]/g, "%5D");
}
function reverseEmail(str){
	return str.replace(/%2E/g, ".").replace(/%23/g, "#").replace(/%24/g, "$").replace(/%5B/g, "[").replace(/%5D/g, "]");
}

var logTable = $("#transactTable tbody");
function addLog(data){
	var entry = "<tr><td>";
	if(data.to){
		entry += reverseEmail(data.to);
	}
	entry += "</td><td>";
	if(data.from){
		entry += reverseEmail(data.from);
	}
	entry += "</td><td>";
	if(data.amount){
		entry += "$"+data.amount;
	}
	entry += "</td></tr>";
	logTable.prepend(entry);
}

firebase.auth().onAuthStateChanged(function(user) {
    $("#nameSpan").text(user.displayName);
    //replace it because realdb doesn't support @ or .
    var userId = cleanEmail(user.email);
    window.userId = userId;

    //notify the server about login
	var curToken = Date.now();
	fdb.ref('Requests').push({
		"data": curToken,
		"from": userId
	});
    //automatically update the balance on the page if it changes.
	var userRef = fdb.ref('Users/'+userId);
	userRef.child('balance').on('value', function(snapshot){
		window.balance = snapshot.val();
		$("#balanceSpan").text(snapshot.val());
	});
	userRef.child('token').on('value', function(snapshot){
		var token = snapshot.val();
		if(token == curToken){
			curToken = -1;
			snapshot.ref.off();
			userRef.child('firstLog').once('value', function(snapshot){
				snapshot.ref.remove();
				var logs = snapshot.val();
				if(logs){
					logs.forEach(function(e){
						addLog(e);
					});
				}
				snapshot.ref.remove();
				userRef.child('updateLog').remove().then(function(){
					userRef.child('updateLog').on('value', function(snapshot){
						if(snapshot){
							snapshot.ref.remove();
							var log = snapshot.val();
							if(log){
								addLog(log);
							}
						}
					});
				});
			});
		}
	});
	userRef.child('notices').on('child_added', function(snapshot){
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
	if(depositValue > 0 && depositValue < 100000){
		fdb.ref('Requests').push({
			"data": JSON.stringify({
				"amount": depositValue,
				"type": 1
			}),
			"from": window.userId
		});
	}
}
