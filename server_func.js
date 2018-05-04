var admin = require("firebase-admin");
//var bcrypt = require("bcrypt");

// Admin initialization
admin.initializeApp({
  credential: admin.credential.cert(require('./admin_key.json')),
  databaseURL: "https://cs-595-cpd.firebaseio.com"
});

var fdb = admin.database();


var invalidCharacters = {".": true, "#": true, "$": true, "[": true, "]": true};
function validString(str){
	for(k in invalidCharacters){
		if(str.includes(k)){
			return false;
		}
	}
	return true;
}

// Admin function
fdb.ref('Requests').on('child_added', function(reqSnapshot){
	var reqData = reqSnapshot.val();
	if(reqData.from && validString(reqData.from)){
		var fromEntry = 'Users/'+reqData.from;
		var dataType = typeof reqData.data;
		if(dataType == 'number'){
			fdb.ref(fromEntry).once('value', function(snapshot){
				if(snapshot.val() == null){
					snapshot.ref.set({"balance": 0})
				}
				fdb.ref('Logs').orderByChild('timestamp').startAt(Date.now() - 3600000).once('value', function(logs){
					var sendData = [];
					if(logs){
						logs.forEach(function(e){
							e = e.val();
							if(e && (e.to === reqData.from || e.from === reqData.from)){
								sendData.push({
									"amount": e.amount || null,
									"from": e.from || null,
									"to": e.to || null
								});
							}
						});
					}
					snapshot.ref.child('firstLog').set(sendData);
					snapshot.ref.child('token').set(reqData.data);
				});
			});
		}
		else if(dataType == 'string'){
			fdb.ref(fromEntry).once('value', function(fromSnapshot){
				var transactData = reqData.data;// bcrypt.decrypt(reqData.data, fromSnapshot.child('privateKey'));
				if(transactData){  // Check if bcrypt decrypted successfully
					try{
						transactData = JSON.parse(transactData);
						if(transactData.type && typeof transactData.type == 'number' && transactData.amount && typeof transactData.amount == 'number' && transactData.amount > 0){
							switch(transactData.type){
								case 1:  // Deposit
									if(transactData.amount < 100000){
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
												fromSnapshot.ref.child('updateLog').set({
													"amount": transactData.amount,
													"to": reqData.from
												});
											}
											fromSnapshot.ref.child('notices').push({
												"status": success,
												"timestamp": timestamp,
												"type": 1
											});
										});
									}
									break;
								case 2:  // Send
									if(fromSnapshot.child('balance').val() >= transactData.amount && transactData.to && typeof transactData.to == 'string' && validString(transactData.to)){
										var toEntry = 'Users/'+transactData.to;
										if(fromEntry != toEntry){
											fdb.ref(toEntry).once('value', function(toSnapshot){
												if(toSnapshot.val() != null){
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
																	var updateLog = {
																		"amount": transactData.amount,
																		"from": reqData.from,
																		"to": transactData.to
																	};
																	fromSnapshot.ref.child('updateLog').set(updateLog);
																	toSnapshot.ref.child('updateLog').set(updateLog);
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
						}
					}catch(e){}
				}
			});
		}
	}
	reqSnapshot.ref.remove();
});
