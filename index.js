var firebase = require("firebase");
var http = require('http');
var  fs = require('fs');


var config = {
  apiKey: "AIzaSyBlfPXpbD7C_bcpvNQFjYOTqmPEHRZy-ws",
  authDomain: "cs-595-cpd.firebaseapp.com",
  databaseURL: "https://cs-595-cpd.firebaseio.com",
  projectId: "cs-595-cpd",
  storageBucket: "cs-595-cpd.appspot.com",
  messagingSenderId: "192816903778"
};
firebase.initializeApp(config);


http.createServer(function (req, res) {
  fs.readFile("index.html", function(err, data){
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    res.end();
  });
}).listen(8080);
