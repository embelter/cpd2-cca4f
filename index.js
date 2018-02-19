var http = require('http');
var firebase = require('firebase');
var fs = require('fs');

firebase.initializeApp({
	apiKey: 'AIzaSyBlfPXpbD7C_bcpvNQFjYOTqmPEHRZy-ws',
	authDomain: 'cs-595-cpd.firebaseapp.com',
	databaseURL: 'https://cs-595-cpd.firebaseio.com',
	projectId: 'cs-595-cpd',
	storageBucket: 'cs-595-cpd.appspot.com',
	messagingSenderId: '192816903778'
});

http.createServer(function(req, res){
	console.log("ENTRY");
	fs.readFile('./index.html', function(err, data){
		console.log("READING PAGE");
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write(data);
		return res.end();
	});
	console.log("EXIT");
}).listen(8080);
