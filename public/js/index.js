function onSignIn() {
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    firebase.auth().signInWithPopup(provider).then(function(result) {
        window.location = "/member.html";
      }).catch(function(error) {
    });
}

firebase.auth().onAuthStateChanged(function(user) {
    if(user != null) {
        window.location = "/member.html";
    }
});