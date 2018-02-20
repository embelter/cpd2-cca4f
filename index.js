var firebase = require("firebase");
var http = require('http');
var  fs = require('fs');
var path = require('path');

var express = require('express');
var app = express();

var config = {
  apiKey: "AIzaSyBlfPXpbD7C_bcpvNQFjYOTqmPEHRZy-ws",
  authDomain: "cs-595-cpd.firebaseapp.com",
  databaseURL: "https://cs-595-cpd.firebaseio.com",
  projectId: "cs-595-cpd",
  storageBucket: "cs-595-cpd.appspot.com",
  messagingSenderId: "192816903778"
};
firebase.initializeApp(config);
// Switched to express(app) in order to more easily access static files 
app.get('/', function (req, res) {
	// Should resolve the static css dir
	app.use(express.static(path.join(__dirname + '/css')));
	res.sendFile(path.join(__dirname + "/index.html"));
	});

app.listen(8080, function()	{
	console.log("App rendered at localhost:8080");
	});
