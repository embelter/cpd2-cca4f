var fdb = firebase.database();

function retrieveLogs() {
    fdb.ref('Logs').orderByChild('timestamp').startAt(Date.now() - 600000).once('value', function(logs){
        if(logs.hasChildren() == 0){
            // Set dialog to say there are no recent transactions
        }
        else{
            var userId = window.userId;
            logs.forEach(function(e){
                // Append a dialog with e.amount based on:
                if(e.to === userId){
                    if(e.from){
                        // To user from another
                    }
                    else{
                        // Deposit
                    }
                }
                else if(e.from === userId){
                    if(e.to){
                        // To another from user
                    }
                    else{
                        // Withdraw
                    }
                }
            });
        }
    },
    function(e){
        //e.code
        //e.message
        //e.stack
    });
}
