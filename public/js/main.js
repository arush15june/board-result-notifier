var subButton;
var allowPermissionText = "Please Allow Us To Send You Notifications By Clicking 'Allow'.<br> Only Works In Chrome 42+.";
var allowPermissionSpan;
var resultStatus;
var serverURL = "";

/* ANALYTICS */
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-99588570-1', 'auto');
ga('send', 'pageview');
/* 			*/

//initialize firebase
// You'll get this at firebase.
var config = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: ""
  };
firebase.initializeApp(config);

//init firebase messaging
const messaging = firebase.messaging();

function updateUI(status)
{
	if(status) //Push Permission Enabled 
	{
		let formHTML = '<button type = "submit" class = "button btn-lg btn-block sub-button bold" id ="subButton" disabled>Subscribed!</button>'; 
		//update UI now that user is subscribed
	  	$("#subFormFieldset").html(formHTML);
	  	allowPermissionSpan.html("");
	  	console.log("Updated UI For Already Subscribed");
	}
	else if(!status)
	{
		let formHTML = '<label for="email">Email</label> \
						<input class = "form-control" name = "email" type="text" id="emailInput"></input> \
						<br> \
						<button type="button" class = "button btn-lg btn-block sub-button bold" id ="subButton" onClick="requestPermission()">Subscribe For Notifications</button>';
		//update UI now that user is subscribed
		$("#subFormFieldset").html(formHTML);
	  	allowPermissionSpan.html(allowPermissionText);
	  	console.log("Updated UI For New Subscriber");

	}
}

function setResultStatus(status)
{
	console.log("Setting Status : "+status)
	if(status)
		resultStatus.html("Yes! <a href='http://cbseresults.nic.in' style = 'font-weight:bold'>CBSE Results</a>");
	else if(!status) 
		resultStatus.html("Nope!");
}

function addEmailAndTokenToDB(email,tokenId) {
			email = email.replace("@","%40")
			
			let addTokenEndpoint = serverURL+"/addToken?email="+email+"&tokenId="+tokenId;
			var request = new XMLHttpRequest();
			request.open("POST",addTokenEndpoint,true);
			request.responseType = "json";
			request.onload = function() {
				console.log(request);
				if(request.status === 200) {
						return request.response.success;
				} 
				else {
					return Error("Couldn't acces result status, ERROR : "+request.statusText);
				}
			};
			request.send();


}


//Executing this function will enable asking for notification permissions.
function requestPermission()
	{
		let emailInput = document.getElementById("emailInput").value;
		// obviously stolen from the internet.
		if(!emailInput.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/gi))
		{
			document.getElementById("emailInput").placeholder = "Invalid Input";
			console.log("Invalid Email");
			return;
		} 
		console.log(emailInput);
		subButton.disabled = true;
		//get notification permissions
		messaging.requestPermission()
		.then(function() {
		  console.log('Notification permission granted.');
		  //get Instance ID(IID),this makes a network call for the
		  // first time, then it is cached in the system
		  messaging.getToken()
		  .then(function(newToken) {
		  	console.log("Token Granted : ",newToken);
		  	//save IID to the database
		  	addEmailAndTokenToDB(emailInput,newToken);
		  	//Update UI
		  	updateUI(true);
		  	console.log("UI Updated");

		  })
		  .catch(function(err) {
		  	console.log("Error occured while getting token.",err);
		  });
		})
		.catch(function(err) {
		  console.log('Unable to get permission to notify.', err);
		});	
	}


$(document).ready(function(){

	resultStatus = $("#resultStatus");
	subButton = $("#subButton");
	allowPermissionSpan = $("#allowPermissionSpan");
	updateUI(0);

	messaging.requestPermission()
	.then(function() {
	  console.log('Notification permission granted.');
	})
	.catch(function(err) {
	  console.log('Unable to get permission to notify.', err);
	});


	//check result status promise
	function checkResultStatus() { 
		var statusPromise = new Promise((resolve,reject) => {
			let statusEndpoint = "https://quiet-plateau-43471.herokuapp.com/resultStatus";
			var request = new XMLHttpRequest();
			request.open("GET",statusEndpoint,true);
			request.responseType = "json";
			request.onload = function() {
				console.log(request);
				if(request.status === 200) {
						resolve(request.response.status);
				}
				else {
					reject(Error("Couldn't acces result status, ERROR : "+request.statusText))
				}
			};
			/*request.onerror = function(err) {
				reject(Error("Network Error "+err));
			};*/
			request.send();
		})
		return statusPromise
	}
	checkResultStatus()
	.then(function(status)
	{	
		setResultStatus(status);
	})
	.catch(function(err)
	{
		console.log(err);
	});

	//update token if token refreshes.
	messaging.onTokenRefresh()
	.then(function() {
		let emailInput = document.getElementById("emailInput").value;
		if(!emailInput.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/gi))
		{
			document.getElementById("emailInput").placeholder = "Invalid Input";
			console.log("Invalid Email");
			return;
		} 
		console.log(emailInput);
		console.log("Token Refresh! Getting New Token");
		 messaging.getToken()
	  .then(function(refreshedToken) {
	  	console.log("Token Granted : ",refreshedToken);
	  	addEmailAndTokenToDB(emailInput,newToken);
	  	updateUI(true);
	  })
	  .catch(function(err) {
	  	console.log("Error occured while refreshing token",err);
	  });
	})
	.catch(function(err) {
	  console.log('Unable to refresh token', err);
	});

	//Handle Incoming Messages
	messaging.onMessage(function(payload) {
  		console.log("Message received. ", payload);
  		if(payload.status !== null) 
  		{
  			if(payload.data.status === true || payload.data.status === false)
  				setResultStatus(status);
  		}
	});



});



