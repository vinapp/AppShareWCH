//load the const variables used by other js files
$.getScript('pages/common.js', function()
{
    // script is now loaded and executed.
    // put your dependent JS here.
});

// create the module and name it appCenterApp
var appCenterApp = angular.module('appCenterApp', ['ngRoute']);

// configure our routes
appCenterApp.config(function($routeProvider) {
  $routeProvider

    // route for the home page
    .when('/', {
      templateUrl : 'pages/about.html',
      controller  : 'mainController'
    })

    // route for the about page
    .when('/upload', {
      templateUrl : 'pages/upload/upload.html',
      controller  : 'uploadController'
    })

    // route for the contact page
    .when('/assetpicker', {
      templateUrl : 'pages/picker/picker.html',
      controller  : 'pickerController'
    });
});

// create the controller and inject Angular's $scope
appCenterApp.controller('mainController', function($scope) {
  // create a message to display in our view
  $scope.message = '';
});

appCenterApp.controller('uploadController', function($scope) {
  angular.element(document).ready(function () {
        $.getScript('pages/upload/upload.js', function()
        {
            upload.contentHubLogin(username, password);
            // script is now loaded and executed.
            // put your dependent JS here.
        });
    });

    $scope.appUpload = function() {
      upload.uploadMobileApp();
    }

});

appCenterApp.controller('pickerController', function($scope) {

  $scope.searches = [
      {name : "All Files", value : "https://www.digitalexperience.ibm.com/content-picker/picker.html?q=q=*:*&fl=*&fq=classification:(content OR asset)&fq=tags:(android or ios)&fq=assetType:file"},
      {name : "APK Files", value : "https://www.digitalexperience.ibm.com/content-picker/picker.html?q=q=*:*&fl=*&fq=classification:(content OR asset)&fq=tags:(android)&fq=assetType:file"},
      {name : "IPA Files", value : "https://www.digitalexperience.ibm.com/content-picker/picker.html?q=q=*:*&fl=*&fq=classification:(content OR asset)&fq=tags:(ios)&fq=assetType:file"}
  ];

  angular.element(document).ready(function () {
        $.getScript('pages/picker/pickerConsumer.js', function(){
            // script is now loaded and executed.
            // put your dependent JS here.
            $scope.launch = function() {
                    assetPicker.displayAssets(assetPicker.returnHandler, $scope.selectedSearchCriteria);
                }
        });
  });

});
