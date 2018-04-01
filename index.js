var firebase = require("firebase");
var http = require('http');
var path = require('path');
var bcrypt = require("bcrypt");

var express = require('express');
var app = express();

app.use(express.static("public"));

app.listen(8080, function()	{
	console.log("App rendered at localhost:8080");
});
