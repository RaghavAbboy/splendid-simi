var map = angular.module('parkAssist.map');
var Q = require('q');

map.factory('Comm', ['$http', function ($http) {

  var getspots = function (tuple, range) {
    console.log('services.js says: getspots called, tuple:', tuple);

    //Former Method: make a POST request to the server
    return $http({
      method: 'POST',
      url: '/api/getspots',
      data: {
        location: tuple,
        range: range
      }
    })
    .then(function(resp) {
      console.log('services.js says: POST successful. response:',resp);
      return [resp.data[0].latitude, resp.data[0].longitude];
    });
  }

  var createUser = function (tuple, range) {
    console.log('services.js says: createUser called, creating a new user');
    
    //Create a new user on firebase
    var fb = new Firebase('https://burning-fire-1110.firebaseio.com/');
    var reference = fb.child('Users').push({ latitude: tuple[0], longitude: tuple[1], range: range });
    return reference;
  }

  var testLog = function () {
    console.log('Comm called.');

  }

  return {
    getspots: getspots,
    testLog : testLog,
    createUser : createUser
  };

}]);
