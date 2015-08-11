var express = require('express');
var middleware = require('./config/middleware.js');
var http = require('http');
var request = require('request');
var Firebase = require('firebase');

var app = express();
middleware(app,express);


app.set('port',process.env.PORT || 8000);

app.use(express.static(__dirname + './../client'));

//Set up a Firebase
var firedb = new Firebase("https://px7n504ycdj.firebaseio-demo.com");
//remove
// console.log('server.js says: firebase setup.');

//Handle a POST request with coordinates tuple [latitude, longitude]
//POST /api/getspots
app.post('/api/getspots', function(req,res) {
	console.log('server.js says: POST request received! body:', req.body);
	var userLocation = req.body.location;

	//dummy coordinates
	var dummyCoordinates = [{
		latitude : 34.0219, 
		longitude : -118.4814
	}];
	res.send(200, dummyCoordinates);

/*
	//Make a GET request to the storage in database
	firedb.child("Metered Parking Spots").on("value", function (snapshot) {
		//console.log("Fetched all spots:",snapshot.val());
		
		//Make a result of feasible parking spots
		var radius = req.body.range;						//proximity radius in miles (DEFAULTED for now to 1 mile)
		var pSpots = snapshot.val();		//All the parking spots
		var closeSpots = [];				//Ones that are within the euclidean distance
		var freeSpots = [];					//Ones that are currently available to park

		//Get list of all spots within euclidean distance
		for( var key in pSpots) {
			//console.log("Metered Parking Spot:", pSpots[key]);
			if(isWithinRange(userLocation[0],userLocation[1],pSpots[key].latitude, pSpots[key].longitude, radius)) {
				closeSpots.push(pSpots[key]);
			}
		}

		//retain spots that are currently free from closeSpots
		var active_url = 'https://parking.api.smgov.net/meters/';   //append :meter_id
		
		var busy_url_1 = 'https://parking.api.smgov.net/meters/';	//attach :meter_id between the two parts
		var busy_url_2 = '/events/latest';
		var numChecks = 0;
		var totalCloseSpots = closeSpots.length;
    var done = false;

    //remove
    console.log('Total number of closeSpots:', closeSpots.length);

		for(var i=0; i<closeSpots.length; i++) {
			//for(var i=0; i<1; i++) {

//check for whether the spot is active, followed by whether it is free
//console.log('*************************')
//console.log('Testing for parking spot:', closeSpots[i].meter_id);
var meterID = closeSpots[i].meter_id;

//Check whether the meter is available
var filterAvailableOnes = function (obj, res) {
request(busy_url_1 + obj.meter_id + busy_url_2, function (error, response, body) {
if(error) { console.log('Error while checking for meter:available'); }
if(!error && response.statusCode === 200) {
var body = JSON.parse(body);
console.log('Data from SMGov API (meter:available):', body);

if(body.event_type === 'SE') { //body.event_type = SS(move in) / SE(move out)
//add the spot to freespots
freeSpots.push(obj);
if(!done) {
res.send(200, freeSpots);
done = true;
}
} 
}
}); //meter:available request ends here
}

//uncomment
//filterAvailableOnes(closeSpots[i],res);

} //end of for loop

//----------------------------------------------------------------------------------------------
// var checkParkingSpot = function(obj,res) {
// //request to check for meter:'active'
// request(active_url+obj.meter_id, function (error, response, body) {
// if(error) { console.log('Error while checking whether meter:active'); }
// if (!error && response.statusCode === 200) {
// body = JSON.parse(body);
// console.log('Data from SMGov API (meter:active):', body);

// if(body.active) {
// //if active, check for meter:'available'
// request(busy_url_1 + body.meter_id + busy_url_2, function (error, response, body) {
// if(error) { console.log('Error while checking for meter:available'); }
// if(!error && response.statusCode === 200) {
// body = JSON.parse(body);
// //console.log('Data from SMGov API (meter:available):', body);
// //body.event_type = SS(move in) / SE(move out)
// if(body.event_type === 'SE') {
// //add the spot to freespots
// freeSpots.push(obj);
// // res.send(200, freeSpots);
// }
// }
// }); //meter:available request ends here
// }
// }
// numChecks++;
// if(numChecks === totalCloseSpots) {
// res.send(200, freeSpots);
// }

// }); //meter:active request ends here
// }//checkParkingSpot function ends here

//checkParkingSpot(closeSpots[i],res);
//----------------------------------------------------------------------------------------------
	

	}); //firebase query ends here
*/
});	//api/getspots ends here


//Helper Functions
//Function to check whether the euclidean distance between a pair of coordinate pairs falls within a desired range
var isWithinRange = function(latU, longU, latP, longP, radius) {
	var threshold = radius;
	var euDistance = Math.sqrt(Math.pow((latP - latU)*69.1128,2) + Math.pow((longP - longU)*57.2807,2));
	//console.log('User Location: [',latU, ',', longU, '] ', 'Parking Location: [', latP, ',', longP, '] ', 'Absolute Distance in miles:', euDistance );
	return euDistance < threshold;
}

var distance = function (latU, longU, latP, longP) {
	return Math.sqrt(Math.pow((latP - latU)*69.1128,2) + Math.pow((longP - longU)*57.2807,2));
}

//----------------------------------
//Initialize Firebase with information on all the metered spots in santa monica
//GET /api/init 
app.post('/api/init', function(req,res) {
	console.log('server.js says: POST request for init received.');
	// firedb.child("Parking Spots").push( {meter_id: 100, lat:10, long:10});

	//Store all the metered parking spot information on the database
	//Make a GET request
	var url = 'https://parking.api.smgov.net/meters';
	request(url, function (error, response, body) {
  		if(error) { console.log('Error getting data. Error:', error); }
  		if (!error && response.statusCode == 200) {
  			body = JSON.parse(body);
  			//console.log('Data from SMGov API:', typeof body);

  			//One time update of the database with the metered spots info
  			for(var key in body) {
  				//console.log("Value at",key, " is",body[key]);
  				var obj = body[key];
  				firedb.child("Metered Parking Spots").push({meter_id: obj.meter_id, latitude: obj.latitude, longitude: obj.longitude});
  			}
  			res.send(200);
  		}
  	});	
}); // /api/init ends here

//-----------------------------------------------------------------------------------------------------------------------------------------------------------
//Listen for a user session - Entry on firebase
var firecloud = new Firebase('https://burning-fire-1110.firebaseio.com/');
var usersRef = firecloud.child('Users');
usersRef.on('child_added', function (childSnapshot, prevChildKey) {
	console.log('******************* NEW USER ********************')
	var user = childSnapshot.val();
	var userKey = childSnapshot.key();
	console.log('User\'s details:',user, typeof user, 'currChildKey:', childSnapshot.key());
	console.log('*************************************************');

	//Use the user's coordinates to get a list of feasible spots
	var radius = user.range;
	var tuple = [user.latitude, user.longitude];

	//getspots
	firecloud.child('MeteredParkingSpots').once('value', function (snapshot) {
		var pSpots = snapshot.val();
		var closeSpots = [];
		var freeSpots = {};

		for(var key in pSpots) {
			//console.log('A parkSpot:',pSpots[key]);
			var displacement = distance(tuple[0], tuple[1], pSpots[key].latitude, pSpots[key].longitude);
			if(displacement < radius) {
				//closeSpots.push(pSpots[key]);
				console.log('Close spot found: ',pSpots[key]);

				pSpots[key].distance = displacement;
				if(pSpots[key].mostRecentEvent === 'SE') {
					freeSpots[key] = pSpots[key];
				}

				//check whether free, and push to recommendations
				// firecloud.child('MeteredParkingSpots').child(key).once('value', function (closeSpotRef) {
				// 	var closeSpot = closeSpotRef.val();
				// 	if(closeSpot.mostRecentEvent === 'SE') {
				// 		//console.log('A Free Spot:', closeSpot);
				// 		closeSpot.distance = distance(tuple[0], tuple[1], closeSpot.latitude, closeSpot.longitude);
				// 		freeSpots.push(closeSpot);						
				// 		firecloud.child('Users').child(userKey).child('Recommendations').push(closeSpot);
				// 	}
				// });

			} // end if condition to check within range
		} // end of for loop for pSpots
		firecloud.child('Users').child(userKey).child('Recommendations').set(freeSpots);


		// console.log('Number of freeSpots:', freeSpots.length);
		// console.log('Number of closeSpots:', closeSpots.length);
	});
});


//-----------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports = app;






























