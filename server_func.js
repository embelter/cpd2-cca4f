var admin = require("firebase-admin");
//var bcrypt = require("bcrypt");

// Admin initialization
admin.initializeApp({
  credential: admin.credential.cert(require('./admin_key.json')),
  databaseURL: "https://cs-595-cpd.firebaseio.com"
});

var fdb = admin.database();


// Admin function
fdb.ref('Requests').on('child_added', function(reqSnapshot){
//	console.log("Entered request...");
	var reqData = reqSnapshot.val();
	var fromEntry = 'Users/'+reqData.from;
	if(reqData.data.length == 0){
//		console.log("\tData for new account...");
		fdb.ref(fromEntry).once('value', function(snapshot){
//			console.log("\t\tRetrieved account reference...");
			if(snapshot.val() == null){
//				console.log("\t\t\tSetting new account");
				snapshot.ref.set({
					"balance": 0,
					"notices" : {},
					// "publicKey": "PUBLIC_KEY",
					// "privateKey": "PRIVATE_KEY"
				})
			}
//			console.log("\t\tNew account verified");
		});
	}
	else{
//		console.log("\tData for transaction...");
		fdb.ref(fromEntry).once('value', function(fromSnapshot){
//			console.log("\t\tRetrieved from account reference...");
			var transactData = reqData.data;// bcrypt.decrypt(reqData.data, fromSnapshot.child('privateKey'));
			if(transactData){  // Check if bcrypt decrypted successfully
//				console.log("\t\t\tSuccessfully has transaction data...");
				try{
					transactData = JSON.parse(transactData);
					if(transactData.type && typeof transactData.type == 'number' && transactData.amount && typeof transactData.amount == 'number' && transactData.amount > 0){
//						console.log("\t\t\t\tTransaction data is valid...");
						switch(transactData.type){
							case 1:  // Deposit
//								console.log("\t\t\t\t\tTransaction is deposit");
								fromSnapshot.ref.child('balance').transaction(function(balance){
									balance = balance == null ? fromSnapshot.child('balance').val() : balance;
									return balance + transactData.amount;
								}, function(err, success){
									var timestamp = Date.now();
									if(success){
										fdb.ref('Logs').push({
											"amount": transactData.amount,
											'timestamp': timestamp,
											"to": reqData.from
										});
									}
									fromSnapshot.ref.child('notices').push({
										"status": success,
										"timestamp": timestamp,
										"type": 1
									});
								});
								break;
							case 2:  // Send
//								console.log("\t\t\t\t\tTransaction is transfer...");
								if(fromSnapshot.child('balance').val() >= transactData.amount && transactData.to && typeof transactData.to == 'string'){
//									console.log("\t\t\t\t\t\tTransfer is valid...");
									var toEntry = 'Users/'+transactData.to;
									if(fromEntry != toEntry){
										fdb.ref(toEntry).once('value', function(toSnapshot){
											if(toSnapshot.val() != null){
//												console.log("\t\t\t\t\t\t\tTransfer completed");
												fromSnapshot.ref.child('balance').transaction(function(balance){
													balance = balance == null ? fromSnapshot.child('balance').val() : balance;
													if(balance >= transactData.amount){
														return balance - transactData.amount;
													}
												}, function(err, success){
													if(success){
														toSnapshot.ref.child('balance').transaction(function(balance){
															balance = balance == null ? toSnapshot.child('balance').val() : balance;
															return balance + transactData.amount;
														}, function(err, success){
															var timestamp = Date.now();
															if(success){
																fdb.ref('Logs').push({
																	"amount": transactData.amount,
																	"from": reqData.from,
																	"timestamp": timestamp,
																	"to": transactData.to
																});
															}
															fromSnapshot.ref.child('notices').push({
																"status": success,
																"timestamp": timestamp,
																"type": 2
															});
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
//						console.log("\t\t\t\tTransaction completed");
					}
				}catch(e){}
			}
		});
	}
	reqSnapshot.ref.remove();
//	console.log("Request end");
});
