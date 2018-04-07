//var firebase = require("firebase");
var admin = require("firebase-admin");
//var http = require('http');
//var path = require('path');
//var bcrypt = require("bcrypt");

var express = require('express');
var app = express();

// Admin initialization
admin.initializeApp({
  credential: admin.credential.cert(require('./server/admin_key.json')),
  databaseURL: "https://cs-595-cpd.firebaseio.com"
});

var fdb = admin.database();


// Admin function
fdb.ref('Requests').on('child_added', function(reqSnapshot){
	console.log("Entered request...");
	var reqData = reqSnapshot.val();
	var fromEntry = 'Users/'+reqData.from;
	if(reqData.data.length == 0){
		console.log("\tData for new account...");
		fdb.ref(fromEntry).once('value', function(snapshot){
			console.log("\t\tRetrieved account reference...");
			if(snapshot.val() == null){
				console.log("\t\t\tSetting new account");
				snapshot.ref.set({
					"balance": 0,
					"notices" : {},
					// "publicKey": "PUBLIC_KEY",
					// "privateKey": "PRIVATE_KEY"
				})
			}
			console.log("\t\tNew account verified");
		});
	}
	else{
		console.log("\tData for transaction...");
		fdb.ref(fromEntry).once('value', function(fromSnapshot){
			console.log("\t\tRetrieved from account reference...");
			var transactData = reqData.data;// bcrypt.decrypt(reqData.data, fromSnapshot.child('privateKey'));
			if(transactData){  // Check if bcrypt decrypted successfully
				console.log("\t\t\tSuccessfully has transaction data...");
				try{
					transactData = JSON.parse(transactData);
					if(transactData.type && typeof transactData.type == 'number' && transactData.amount && typeof transactData.amount == 'number' && transactData.amount > 0){
						console.log("\t\t\t\tTransaction data is valid...");
						switch(transactData.type){
							case 1:  // Deposit
								console.log("\t\t\t\t\tTransaction is deposit");
								fromSnapshot.ref.child('balance').set(fromSnapshot.child('balance').val() + transactData.amount);
								var timestamp = Date.now();
								fdb.ref('Logs').push({
									"amount": transactData.amount,
									"timestamp": timestamp,
									"to": reqData.from
								});
								fromSnapshot.ref.child('notices').push({
									"status": true,
									"timestamp": timestamp,
									"type": 1
								});
								break;
							case 2:  // Send
								console.log("\t\t\t\t\tTransaction is transfer...");
								if(fromSnapshot.child('balance').val() >= transactData.amount && transactData.to && typeof transactData.to == 'string'){
									console.log("\t\t\t\t\t\tTransfer is valid...");
									var toEntry = 'Users/'+transactData.to;
									if(fromEntry != toEntry){
										fdb.ref(toEntry).once('value', function(toSnapshot){
											if(toSnapshot.val() != null){
												console.log("\t\t\t\t\t\t\tTransfer completed");
												fromSnapshot.ref.child('balance').set(fromSnapshot.child('balance').val() - transactData.amount);
												toSnapshot.ref.child('balance').set(toSnapshot.child('balance').val() + transactData.amount);
												var timestamp = Date.now();
												fdb.ref('Logs').push({
													"amount": transactData.amount,
													"from": reqData.from,
													"timestamp": timestamp,
													"to": transactData.to
												});
												fromSnapshot.ref.child('notices').push({
													"status": true,
													"timestamp": timestamp,
													"type": 2
												});
											}
											else{
												fromSnapshot.ref.child('notices').push({
													"status": false,
													"timestamp": Date.now(),
													"type": 2
												});
											}
										});
									}
								}
								break;
						}
						console.log("\t\t\t\tTransaction completed");
					}
				}catch(e){}
			}
		});
	}
	reqSnapshot.ref.remove();
	console.log("Request end");
});


app.use(express.static("public"));

app.listen(8080, function()	{
	console.log("App rendered at localhost:8080");
});

console.log("Init Complete!");
