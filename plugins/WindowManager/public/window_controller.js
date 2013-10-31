'use strict';

var app = angular.module('WindowManager', []);

app.controller('ProfileController', function ProfileController($scope, $http) {
	$scope.profiles = _init_profiles;
	
	$scope.add_profile = function(event) {
		var profile_name = $('#profile_name_input').val();
		console.log(profile_name);
		$scope.profiles.push(profile_name);
		$('#profile_name_input').val('');
	}

	$scope.load_profile = function(event) {
		var profile_name = $(event.target).data('profile');
		if(typeof(profile_name) != 'undefined') {
			$http.post('/WindowManager/load_profile', {
				name: profile_name
			}).success(function(result) {
			});
		}
	}

	$scope.save_profile = function(event) {
		var profile_name = $(event.target).data('profile');
		if(typeof(profile_name) != 'undefined') {
			$http.post('/WindowManager/save_profile', {
				name: profile_name
			}).success(function(result) {
			});	
		}
	}

	$scope.delete_profile = function(event) {
		var profile_name = $(event.target).data('profile');
		if(typeof(profile_name) != 'undefined') {
			$http.post('/WindowManager/delete_profile', {
				name: profile_name
			}).success(function(result) {
				// Remove it from the scope
				var idx = _.indexOf($scope.profiles, profile_name);
				$scope.profiles.splice(idx, 1);
			});
		}
	}
});
