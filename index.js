/*
 ~~~~ Board Result Notifier ~~~~~~
 by chargE github.com/arush15june
*/

var http = require('http');
var request = require('request');
var express = require('express');
var app = express();

var pg = require('pg');

//CONSTANTS
var CBSE_URL = "http://cbseresults.nic.in";
var CURRENT_RESULT_STATE = false;
var authKey = ""; //FCM Auth Key
var WEBSITE_URL = ""; //URL where the site is hosted
var NOTIF_URL = 'https://fcm.googleapis.com/fcm/send'; // FCM API Endpoint

//Verifiers

function checkResult(source) {

	// source is the HTML plaintext.
	var result = false;

	var pattern = new RegExp('(Class XII).*(Announced)','g'); // dosen't even find elements;just searches the regEx...
	var pattern_match = pattern.exec(source);
	if(pattern_match !== null)
		result = true;

	return result;
}

function checkURLForPattern(URL,callback) {
	//Load The CBSE Website;Apply Regex;return status
	request(URL,function(error,response,body) {
		var result = checkResult(body);
		console.log("Result :",result);
		callback(result); 
	})
}
function updateResultState(){
	//get the status;update the constant CURRENT_RESULT_STATE
	//This should probably be a promise, eh.
	checkURLForPattern(CBSE_URL,function(result) {
		CURRENT_RESULT_STATE = result;
	});
}


function sendNotification(notification,authKey) {
	// Notification is not an object. hehe. But the JSON text for the 
	// notification generated by generateNotificationJSON()
	// I should probably make notiifcation a class...
	console.log(notification);
	console.log(authKey);
	var notifLength = Buffer.byteLength(JSON.stringify(notification),'utf8');
	console.log(notifLength);
	var notifPromise = new Promise(function(resolve,reject) {
		request({
			method : "POST",
			json : notification,
			headers : {'Content-Type' : 'application/json','Authorization' : "key="+authKey,'Content-Length' : notifLength},
			url : NOTIF_URL,

		}, function(err,res,body) {
			if(err) {
				console.log(err);
				reject(err);
			}
			else{
				console.log(body);
				resolve(body);	
			} 
		})
	});
}

function generateNotificationJSON(tokenId,notifTitle,body,icon,click_action) {

	var notification = {
		'to' : tokenId,

		'data' : {
			'status' : CURRENT_RESULT_STATE 
		},

		'notification' : {
			"title" : notifTitle,
			"body" : body,
			"icon" : icon,
			"click_action" : click_action
		},
		"time_to_live" : 3600,
		"priority" : "high"
	};

		return notification;

}

function generateResultNotificationJSON(tokenId) {
	// Cause the result notification is not gonna be very dynamic
	var year = new Date;
	year = year.getFullYear();
	var notifTitle = "CBSE Board Result "+year;
	var body = (CURRENT_RESULT_STATE ? "YES! GO TO cbseresults.nic.in" : "Nope, still not out");
	var click_action = WEBSITE_URL;
	var icon = "";
	var notification = generateNotificationJSON(tokenId,notifTitle,body,icon,click_action);

	return notification;
}

function sendResultNotificationToAll()
{
	// Because i add everyone to topic "result", i can send everyone a notification just 
	// by sending 1 request to /topics/result. GGWP.
	var tokenId = "/topics/result";
	console.log("sending notification to "+tokenId);
	var notification = generateResultNotificationJSON(tokenId);
	sendNotification(notification,authKey); 
}

updateResultState();

//I need to really learn express.

app.set('port', (process.env.PORT || 80));
app.set('view engine', 'html'); 
app.use(express.static(__dirname + '/public'));

/* ~~~~~~~~~~~~~~~~~~~~~~~~ You Need This if your site and server are hosted at different places ~~~~~~~~~~~~~~~~~*/
app.all('*', function(req, res, next) {
     var origin = req.get('origin'); 
     res.header('Access-Control-Allow-Origin', origin);
     res.header("Access-Control-Allow-Headers", "X-Requested-With");
     res.header('Access-Control-Allow-Headers', 'Content-Type');
     next();
});
/* ~~~~~~~~~~~~~~~~~~~~~~~~ */



app.get('/', function(request, response) {
  response.render('index.html');
});
/**/
app.post('/addToken', function(req,res){

	//The site POST's a new token (like a id for notifying you) and emails, and
	// adds it to heroku's PostgreSQL Database.
	// and it handles redundant tokens and emails.
		let email = req.query.email;
		email = email.replace("%40","@");
		let tokenId = req.query.tokenId;
		console.log('[new token added] '+email+' : '+tokenId);	
		pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('INSERT INTO tokens VALUES(\''+email+'\',\''+tokenId+'\') ON CONFLICT (email) DO UPDATE SET tokenId=\''+tokenId+'\'', function(err, result) {
		      done();
		      if (err) { 
		      	console.error(err); res.send("Error " + err); 
		      }
		      else { 
		      	var notification = generateNotificationJSON(tokenId,"Board Result Notifier","Subscribed For Notification","",WEBSITE_URL);
		      	console.log('[new subscription] '+email+" "+ tokenId);
		      	// Send Registration Notification (but the user will not see it, because hes still on the page).
		      	sendNotification(notification,authKey);
		      	//SUBSCRIBE TO TOPIC
		      	// So i could either subscribe it at the front end or via the server.
		      	// just personal opinion.
		      	let topicName = "result"
				var notifPromise = new Promise(function(resolve,reject) {
				request({
						method : "POST",
						headers : {'content-type' : 'application/json','Authorization' : "key="+authKey},
						url : "https://iid.googleapis.com/iid/v1/"+tokenId+"/rel/topics/"+topicName
					}, function(err,resp,body) {
						console.log("[subscribing to topic] "+email);
						console.log(body);
						if(err) reject(err);
						else resolve(body);
					})
				}).then(function(body) {
					res.send({"success":true});
				}).catch(function(err) {
					res.send({"succes" : false});
				})
		       }
		    });
	  });
	

});

app.post('/sendNotification', function(req,res){

	//Send Arbitrary Notifications

		let tokenId = req.query.tokenId ? req.query.tokenId : "";
		let notifTitle = req.query.title ? req.query.title : "";
		let body = req.query.body ? req.query.body : "";
		let icon = req.query.icon ? req.query.icon : "";
		let authKey = req.query.authKey;

		let notification = generateNotificationJSON(tokenId,notifTitle,body,icon)
		console.log('[sending notification] '+tokenId+'\n '+notifTitle+' '+body+'\n '+icon+'\n '+authKey);
		if(sendNotification(notification,authKey));
			res.status(200).send({'success' : true});
		
});



app.get('/resultStatus', function(req,res){
	//Returns a simple true or false status json.
	updateResultState();

	res.send({'status' : CURRENT_RESULT_STATE})
})

app.get('/NotifyAll', function(req,res){

	// So i can notify everyone whenever i want. 
	// I should have some security on it probably...
	sendResultNotificationToAll();
	res.status(200).json({"succes" : "1"})
})


app.get('/db', function (request, response) {
	//Used this to check the current userbase.
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM tokens', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.json(result.rows); }
    });
  });
});
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
