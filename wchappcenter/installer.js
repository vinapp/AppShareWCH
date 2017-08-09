"use strict";

// The API URL, along with the host and content hub id for your tenant, may be
// found in the "Hub Information" dialog off the "User menu" in the authoring UI
// Update the following two URLs with values from that Hub Information dialog.
const baseTenantAPIURL = "";

// Services used for this sample
const searchService = "/delivery/v1/search";

// search parameters for retrieving all content items of content type "Article"
const searchParams = "q=*:*&fl=document:[json],documents&wt=json&fq=type%3A%22Upload%20a%20Mobile%20Application%22&fq=classification:%28content%29&sort=lastModified%20desc";

var app = angular.module('installer', []);
app.controller('installerController', function($scope, $http, $location, $window) {
		$scope.isIos = false;
    if( /iPhone|iPad|iPod/i.test(navigator.userAgent) ) {
			$scope.isIos = true;
    }
		$scope.goToLink = function(url) {
			$window.location.href = url;
		};
    var searchUrl = baseTenantAPIURL +  searchService + "?" + searchParams;
    $http.get(searchUrl)
    .then(function (response) {
    		$scope.apps = response.data.documents;
    });
});
