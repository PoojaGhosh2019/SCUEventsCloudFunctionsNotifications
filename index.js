const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const admin = require('firebase-admin');
admin.initializeApp();

//let eventTitle = null

exports.onEventVenueUpdate = functions.database
.ref('/Events/{eventId}/eventLocation')
.onUpdate((change,context)=>{
        const before = change.before.val()
        const after = change.after.val()
        console.log(context.params)
        const eventId = context.params.eventId
     
        console.log(before)
        console.log(after)
        
        if(before === after){
            console.log("Text didn't change")
            return null
        }

        return findEventName(eventId).then((eventName)=>{
            
            let msg = `event venue of ${eventName} changed and its now at ${after}`
            console.log(msg)
            
            return loadUsers(eventId).then(users => {
                let tokens = [];
                let userIds = [];
                for (let user of users) {
                    tokens.push(user.userToken);
                    userIds.push(user.userID)
                }
                console.log(tokens)
                let payload = {
                    notification: {
                        title: 'Event Update Notification',
                        body: msg,
                        sound: 'default',
                        badge: '1'
                    }
                };

                for(let userids of userIds){
                    let dbRef = admin.database().ref(`/Users/${userids}`);
                    dbRef.child("notification").push({
                        body: msg,
                        timeStamp: Date.now()
                    })
                }

                return admin.messaging().sendToDevice(tokens, payload);
        });
    })
});

function findEventName(eventId){
    let dbRef = admin.database().ref(`/Events/${eventId}/eventTitle`)
    let defer = new Promise((resolve,reject) => {
        dbRef.once('value',snapshot =>{
            let eventTitle = snapshot.val()
            console.log(eventTitle)
            resolve(eventTitle)
        },(err) => {
            reject(err)
        })
    })
    
    return defer
}

function loadUsers(eventId) {
    let dbRef = admin.database().ref(`/Events/${eventId}/registeredUsers`);
    //let dbRef = admin.database().ref('/Users');
    let defer = new Promise((resolve, reject) => {
        dbRef.once('value', (snap) => {
            let data = snap.val();
            let users = [];
            for (var property in data) {
                users.push(data[property]);
            }
            console.log(users)
            resolve(users);
        }, (err) => {
            reject(err);
        });
    });
    return defer;
}

exports.onEventDateUpdate = functions.database
.ref('/Events/{eventId}/eventDate')
.onUpdate((change,context)=>{
        const before = change.before.val()
        const after = change.after.val()
        const eventId = context.params.eventId
        
        console.log(before)
        console.log(after)

        if(before === after){
            console.log("Text didn't change")
            return null
        }

        return findEventName(eventId).then((eventName) => {
            let msg = `event date of ${eventName} changed and its now at ${after}`

            //prommise handled at loaUsers , if it fails then no notification is sent
            return loadUsers(eventId).then(users => {
                let tokens = [];
                let userIds = []
                for (let user of users) {
                    tokens.push(user.userToken);
                    userIds.push(user.userID)
                }
                console.log(tokens)
                let payload = {
                    notification: {
                        title: 'Event Update Notification',
                        body: msg,
                        sound: 'default',
                        badge: '1'
                    }
                };

                for(let userids of userIds){
                    let dbRef = admin.database().ref(`/Users/${userids}`);
                    dbRef.child("notification").push({
                        body: msg,
                        timeStamp: Date.now()
                    })
                }

                return admin.messaging().sendToDevice(tokens, payload);
            });
        })
    
})

exports.onEventCapacityUpdate = functions.database
.ref('/Events/{eventId}/totalSeats')
.onUpdate((change,context)=>{
        const before = change.before.val()
        const after = change.after.val()
        const eventId = context.params.eventId  
        
        console.log(before)
        console.log(after)

        if(before === after){
            console.log("Text didn't change")
            return null
        }

        console.log("before calling findEventName")
        return findEventName(eventId).then((eventName) => {
            console.log("after finding eventName ",eventName)
            let msg = `event capacity of ${eventName} changed and its now at ${after}`

            return loadUsers(eventId).then(users => {
                let tokens = [];
                let userIds = []
                for (let user of users) {
                    tokens.push(user.userToken);
                    userIds.push(user.userID)
                }
                console.log(tokens)
                let payload = {
                    notification: {
                        title: 'Event Update Notification',
                        body: msg,
                        sound: 'default',
                        badge: '1'
                    }
                };
    
                for(let userids of userIds){
                    let dbRef = admin.database().ref(`/Users/${userids}`);
                    dbRef.child("notification").push({
                        body: msg,
                        timeStamp: Date.now()
                    })
                }
    
                return admin.messaging().sendToDevice(tokens, payload);
            });
        });
})

exports.onEventDelete = functions.database
.ref('/Events/{eventId}')
.onDelete((snapshot,context)=>{

    const eventTitle = snapshot.val().eventTitle
    const registeredUsers = snapshot.val().registeredUsers

    //console.log(registeredUsers)

    let tokens = [];
    let userIds = []

    for (let user of Object.entries(registeredUsers)) {
        console.log("per user details ",user[1])
        tokens.push(user[1].userToken);
        userIds.push(user[1].userID)
    }

    console.log(userIds)
    console.log(tokens)


    let msg = `event ${eventTitle} is taking place no more!!`

    let payload = {
        notification: {
            title: 'Event Update Notification',
            body: msg,
            sound: 'default',
            badge: '1'
        }
    };
    for(let userids of userIds){
        let dbRef = admin.database().ref(`/Users/${userids}`);
        dbRef.child("notification").push({
            body: msg,
            timeStamp: Date.now()
        })
    }

    return admin.messaging().sendToDevice(tokens, payload);
})


