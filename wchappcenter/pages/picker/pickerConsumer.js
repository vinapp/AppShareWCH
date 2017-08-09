var assetPicker = (function(window, undefined) {

"use strict";

var showAssets = function wchLoginAndLaunchPicker(myhandler, pickerUrl) {
    var requestOptions = {
        xhrFields: { withCredentials: true },
        url: wchLoginURL,
        headers: { "Authorization": "Basic " + btoa(username + ":" + password) }
    };

    $.ajax(requestOptions).done(function(data, textStatus, request) {
        // These cookies received on successful login : 'x-ibm-dx-user-auth', x-ibm-dx-tenant-id'
        // Now that you are logged in and have the cookies, open the picker
        launchPicker(myhandler, pickerUrl);

    }).fail(function(request, textStatus, err) {
        alert("Content Hub Login returned an error: " + err + ". Please check your credentials.");
    });
}


// 1. 'addEventListener' is for standards-compliant web browsers and 'attachEvent' is for IE Browsers
var eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
var eventer = window[eventMethod];
// 2. if 'attachEvent', then we need to select 'onmessage' as the event
// else if 'addEventListener', then we need to select 'message' as the event
var messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';


function launchPicker(myhandler, url) {
    $('#pickerDialog').dialog({
        autoOpen: false,
        show: 'fade',
        hide: 'fade',
        modal: false,
        height: window.innerHeight - 50,
        resizable: true,
        minHeight: 500,
        width: 240,
        position: { my: 'right bottom', at: 'right bottom', of: window},
        open: function() {
            $('#pickerIframe').attr('src', url);
        },
        title: 'Find',
    });

    // Listen to message from child iFrame window
    eventer(messageEvent, myhandler, false);
    //open the dialog
    $('#pickerDialog').dialog('open');
}

//handle how the chosen image is displayed on the page
var rethdlr = function resultHandler(e) {
    $('#pickerDialog').dialog('close');

    var result = JSON.parse(e.data);
    //construct the resource url
    var authUrl = baseTenantAPIURL + '/authoring/v1/resources/' + result.resource;
    var deliveryUrl = baseTenantAPIURL + '/delivery/v1/resources/' + result.resource;
    var akamaiUrl = baseTenantAPIURL.replace('/api','') + result.path;

    //var resultUrl = '<div>'+akamaiUrl+'</div><div>'+authUrl+'</div><div>'+deliveryUrl+'</div>';

    //pretty print the json
    /*var json = JSON.stringify(result, '', 4);
    var resultResource;
    if (result.assetType == 'image'){
        resultResource = '<div>'+resultUrl+'</div><img width="150"  src="'+ deliveryUrl +'"><div><pre>' + json + '</div>'
    } else if (result.assetType == 'video'){
        resultResource = '<div>'+resultUrl+'</div><video width="200"  type="'+ result.mediaType +'" controls  src="'+ deliveryUrl +'"></video><div><pre>' + json + '</div>'
    } else if (result.assetType == 'file'){
        resultResource = '<div>'+resultUrl+'</div><a href="'+ deliveryUrl +'">'+ result.name +'</a><div><pre>' + json + '</div>'
    } else {
        resultResource = '<div>'+resultUrl+'</div><div><pre>' + json + '</div>'
    }*/
    var ahrefurl = '<a style="margin:10px" href=' + "'" + akamaiUrl + "'" + '>' + "Download - " + akamaiUrl.substring(akamaiUrl.lastIndexOf("/") + 1) + '</a>';
    //alert(ahrefurl);
    //$('#result').html(resultResource);
    $("#result").html(ahrefurl);

}
return {
            returnHandler: rethdlr,
            displayAssets: showAssets

        };
})(this);// 'this' is a reference to 'window' here
