var map = angular.module('parkAssist.map');
var mapOptions = require('./mapOptions');

map.directive('map', ['Comm', 'User', 'UserMarker', 'MeterMarkers', 'DirectionsDisplay', function(Comm, User, UserMarker, MeterMarkers, DirectionsDisplay) {
  var map, center, mapCanvas, loading, loadingText, tuple, range;

  var findSpot = function(tuple) {
    loadingText.text('Finding you the best parking spot...');

    //Create a user and get the key
    var ref = Comm.createUser(tuple, range);
    // console.log('User created. Key:', ref.key());

    //variables to help navigate to the best parking space
    var first = false;
    var queue = [];

    //Setup a listener for recommendations, ordered by distance
    ref.child('Recommendations').orderByChild('distance').on('child_added', function(snapshot){
      var pSpot = snapshot.val();
      //console.log(pSpot); 

      if(!first) { //if the first spot hasn't already been recommended to the user, then we recommend it here
        first = true;
        var spot = [pSpot.latitude, pSpot.longitude];
        // console.log('mapDirective.js says: spot:', spot);
        
        // meter location
        var meterLoc = new google.maps.LatLng(spot[0],spot[1]);

        MeterMarkers.addMarker(map,true,meterLoc);
        User.setDestination(meterLoc);

        User.watchPosition(map)
        .then(function(userLocation) {
          map.panTo(userLocation);
          loadingText.text('Spot Found! Calculating Route...');
          return User.calcRoute();
        })
        .then(function(directions) {
          loading.removeClass('show');
        });
      }
      else {
        queue.push(pSpot);
      }

    });

    //*********** to be removed on rebase **********
    // Comm.getspots(tuple,range)
    // .then(function(spot) {
    //   console.log('mapDirective.js says: spot:', spot);
      
    //   // meter location
    //   var meterLoc = new google.maps.LatLng(spot[0],spot[1]);

    //   MeterMarkers.addMarker(map,true,meterLoc);
    //   User.setDestination(meterLoc);

    //   User.watchPosition(map)
    //   .then(function(userLocation) {
    //     map.panTo(userLocation);
    //     loadingText.text('Spot Found! Calculating Route...');
    //     return User.calcRoute();
    //   })
    //   .then(function(directions) {
    //     loading.removeClass('show');
    //   });
    // });

  };

  var initialize = function() {
    map = new google.maps.Map(mapCanvas, mapOptions);
    DirectionsDisplay.setMap(map);

    google.maps.event.addDomListener(map, 'idle', function() {
      center = map.getCenter();
    });

    google.maps.event.addDomListener(window, 'resize', function() {
      map.setCenter(center);
    });

    loadingText.text('Finding your location...');
    loading.addClass('show');

    window.navigator.geolocation.getCurrentPosition(function(pos) {
      tuple = [pos.coords.latitude, pos.coords.longitude];
      range = 0.2;

      findSpot(tuple);
    }, null);
  };

  var loadMap = function(scope, element, attrs) {
    mapCanvas = element.children()[0];
    loading = angular.element(element.children()[1]);
    loadingText = loading.find('p');

    google.maps.event.addDomListener(window, 'load', initialize);
  };

  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'src/map/mapTemplate.html',
    link: loadMap
  };
}]);

// Redirect:
// setTimeout(function(){
//   var meterLoc = new google.maps.LatLng(34.069409,-118.442925);
//   MeterMarkers.addMarker(map,true,meterLoc);
//   loadingText.text('Bummer! Spot taken. Redirecting you...');
//   loading.addClass('show');
//   User.setDestination(meterLoc).then(function(directions) {
//     loading.removeClass('show');
//   });
// },15000);
