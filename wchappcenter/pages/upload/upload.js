var upload = (function(window, undefined){
"use strict";
// Empty elements for Article content type
var emptyElements = {
    "title": {
        "elementType": "text",
        "value": ""
    },
    "packagename": {
        "elementType": "text",
        "value": ""
    },
    "version": {
        "elementType": "number",
        "value": ""
    },
    "image": {
        "elementType": "image",
        "renditions": {},
        "asset": {}
    },
    "mobileApplication": {
        "elementType": "file",
        "asset": {}
    },
    "manifestFileIos": {
        "elementType": "file",
        "asset": {}
    }
};

var ipa_manifestfile ="<?xml version='1.0' encoding='UTF-8'?><!DOCTYPE plist PUBLIC '-//Apple//DTD PLIST 1.0//EN' 'http://www.apple.com/DTDs/PropertyList-1.0.dtd'><plist version='1.0'><dict><key>items</key><array><dict><key>assets</key><array><dict><key>kind</key><string>software-package</string><key>url</key><string>YOUR-IPA-FILE.ipa</string></dict></array><key>metadata</key><dict><key>bundle-identifier</key><string>com.yourCompany.productName</string><key>bundle-version</key><string>1.0.0</string><key>kind</key><string>software</string><key>title</key><string>YOUR APP NAME</string></dict></dict></array></dict></plist>";

var elements = JSON.parse(JSON.stringify(emptyElements));
var $xml = "";

var login = function wchLogin(username, password) {
    //alert("U: " + username + " P: " + password + " URL: " + wchLoginURL);
    var requestOptions = {
        xhrFields: { withCredentials: true },
        url: wchLoginURL,
        headers: { "Authorization": "Basic " + btoa(username + ":" + password) }
    };
    $.ajax(requestOptions).done(function(data, textStatus, request) {
    }).fail(function(request, textStatus, err) {
        let errMsg = (request && request.responseJSON && request.responseJSON.errors && request.responseJSON.errors[0].message) ?
            request.responseJSON.errors[0].message : err;
        alert("Content Hub Login returned an error: " + errMsg + " Please Try Again.");
    });
}

// Login, upload resource, create asset, and create content item
function createContentItem(contentTypeName, contentName, file, textData, fileType, osName) {
    // start with a copy of the empty elements structure for article content type
    if (!file) {
        return Promise.reject('No image file specified');
    }
    return wchCreateResource(file, fileType, osName) // Upload resource and create asset
        .then(function(resourceJson) {
            var id = resourceJson.id;
            // console.log("resource: ", resourceJson);
            // Populate all the text fields in the elements
            Object.keys(textData).forEach(function(key) {
                elements[key].value = textData[key];
            });
            // 3. Create asset using ID from resource upload
            if (fileType==="manifest") {
              return wchCreateAssetFromResource(id, file, osName);
            } else {
              return wchCreateAssetFromResource(id, file.name, osName);
            }
        })
        .then(function(assetJson) {
            // console.log("asset: ", assetJson);

            if (fileType==="image") {
                // set image properties in contentElements
                var image = elements.image;
                image.elementType = "image";
                image.asset = {
                    id: assetJson.id
                };
                image.renditions["default"] = {
                        renditionId: assetJson.renditions["default"].id
                };
            } else if (fileType === "manifest") {
              // set file/app properties in contentElements
              var mobileApp = elements.manifestFileIos;
              mobileApp.elementType = "file";
              mobileApp.asset = {
                  id: assetJson.id
              };
            } else {
              // set file/app properties in contentElements
              var mobileApp = elements.mobileApplication;
              mobileApp.elementType = "file";
              mobileApp.asset = {
                  id: assetJson.id
              };
            }

            if ((fileType==="manifest") || (osName === "android" && fileType === "app")) {
              // 4. search for content type by name
              var searchParams = "q=*:*&fl=name,id&wt=json&fq=classification:content-type&fq=name:" + contentTypeName;
              return wchSearch(searchParams);
            }
        })
        .then(function(searchResults) {
            if ((fileType==="manifest") || (osName === "android" && fileType === "app")) {
              if (searchResults.numFound == 0) {
                  return Promise.reject('Content type not found: ' + contentTypeName);
              }
              var id = searchResults.documents[0].id;
              var contentTypeId = id.substring(id.indexOf(":") + 1);

              // 5. create content item
              return wchCreateContentItem(contentName, contentTypeId, elements, osName);
            } else {
              return "ok here";
            }
        });
};


// Upload a file to create a resource. Must have done login already.
function wchCreateResource(file, fileType, osName) {
    var createResourceUrl = baseTenantAPIUrl + '/' + resourceService + "?name=" + file.name;
    if (fileType==="manifest") {
      createResourceUrl = baseTenantAPIUrl + '/' + resourceService + "?name=" + file;
    }

    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open("post", createResourceUrl, true);

        // Sets the contentype header
        if (fileType === 'manifest') {
          xhr.setRequestHeader("Content-Type", "application/xml");
        } else {
          if (file.type === "") {//For apk/ipa file the html file component returns file.type as null
            //application/octet-stream -- this is for ions
            if (fileType === "app" && osName === "ios") {
              xhr.setRequestHeader("Content-Type", "application/octet-stream");
            }
            else if (fileType === "app" && osName === "android") {
              xhr.setRequestHeader("Content-Type", "application/vnd.android.package-archive");
            }
          } else {
            xhr.setRequestHeader("Content-Type", file.type);
          }
        }
        xhr.onload = function() {
            if (this.status >= 200 && this.status < 300) {
                console.log('OK');
                resolve(JSON.parse(xhr.response));
            } else {
                console.log('bad HTTP status');
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function() {
            console.log('error');
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        //create a manifest file if its ios
        if (fileType === "manifest") {
          //http://stackoverflow.com/questions/22647651/convert-xml-document-back-to-string-with-jquery
          //var $xml = $(ipa_manifestfile);
          var newxmlstring = $xml.appendTo('<x></x>').parent().html();
          var data = (new window.DOMParser()).parseFromString(newxmlstring, "text/xml");
          xhr.send(data);
        } else if (fileType === "app" && osName === "ios") { //only for ios we have manifest file. Manifest file is required for downloading & installing the ipa file
          $xml = $($.parseXML(ipa_manifestfile).documentElement);
          $xml.find('string:contains("1.0.0")').text(elements["version"].value);
          $xml.find('string:contains("YOUR APP NAME")').text(elements["title"].value);
          $xml.find('string:contains("com.yourCompany.productName")').text(elements["packagename"].value);
          $xml.find('string:contains("YOUR-IPA-FILE.ipa")').text(serverBaseUrl + "/" + tenantid + "/dxdam/appcenter/" + osName + "/" + elements["version"].value + "/" + file.name);
          xhr.send(file);
        } else {
          xhr.send(file);
        }
    });
}

// Creates an asset from a resource ID
function wchCreateAssetFromResource(resourceId, filename, osName) {
    var createAssetUrl = baseTenantAPIUrl + '/' + assetService;
    var reqOptions = {
        xhrFields: {
            withCredentials: true
        },
        dataType: "json",
        type: "POST",
        data: JSON.stringify({ resource: resourceId, tags: {values: [osName]}, path: '/dxdam/appcenter/' + osName + "/" + elements["version"].value + "/" + filename, name: filename }),
        contentType: "application/json",
        // mediaType: mimeType,
        url: createAssetUrl
    };

    //alert("asset url is "+ JSON.stringify({ resource: resourceId, path: '/appcenter/' + filename, name: filename }));
    // Post to assets service
    return $.ajax(reqOptions).done(function(json) {
        return json;
    });
}

// Search - callback has search results object
function wchSearch(searchParams) {
    // console.log('searchParams: ', searchParams);
    var searchURL = baseTenantAPIUrl + '/' + searchService + "?" + searchParams;
    var reqOptions = {
        xhrFields: {
            withCredentials: true
        },
        dataType: "json",
        url: searchURL,
    };
    return $.ajax(reqOptions).then(function(json) {
        return json;
    });
}

// create content item - callback has new content item object
function wchCreateContentItem(name, contentTypeId, contentElements, osName) {
    // console.log('createContentItem baseTenantAPIUrl: ', baseTenantAPIUrl);
    var createContentUrl = baseTenantAPIUrl + '/' + contentService;
    var data = {
        "name": name,
        "typeId": contentTypeId,
        "tags": [osName],
        "status": "draft",
        "links": {},
        "elements": contentElements
    };
    var reqOptions = {
        xhrFields: {
            withCredentials: true
        },
        dataType: "json",
        contentType: "application/json",
        type: "POST",
        data: JSON.stringify(data),
        url: createContentUrl
    };
    console.log("Content (Item) Json -- "+ JSON.stringify(data));
    //clear
    $xml = "";
    elements = JSON.parse(JSON.stringify(emptyElements));
    // alert("final (JSON)) "+ JSON.stringify(data));
    // console.log(JSON.stringify(reqOptions, "", 4));
    // Post to Content service
    return $.ajax(reqOptions).done(function(json) {
        return json;
    });
}

function promoteContentItem(contentId) {
  var promoteUrl = baseTenantAPIUrl + '/' + contentService + '/' + contentId + '/ready';
  var reqOptions = {
      xhrFields: {
          withCredentials: true
      },
      type: "POST",
      url: promoteUrl
  };
  return $.ajax(reqOptions).done(function(json) {
      return json;
  });
}

var uploadApp = function doUpload() {
    var selectedImageFile = document.getElementById('sample-create-image').files[
        0];
    var selectedFile = document.getElementById('sample-create-file').files[
            0];

    var fileExtension = selectedFile.name.split('.').pop();
    var osName = "android";
    if (fileExtension === "ipa") {
      osName = "ios";
    }

    var array = $('#sample-create-form').serializeArray();
    var json = {};

    $.each(array, function() {
        if (this.name === 'version') {
          json[this.name] = parseFloat(this.value) || 0.0
        } else {
          json[this.name] = this.value || '';
        }
    });
    // Set "name" same as title & version
    var contentName = json["title"] + "-" + json["version"];
    console.log(JSON.stringify(json));
    $("#sample-message").text("Please wait .. Upload in progress ...");
    createContentItem('"Upload a Mobile Application"', contentName, selectedImageFile, json, "image", osName)
        .then(function(resultJson) {
            console.log('image upload done: ', resultJson);
            $("#sample-message").text("Success - image uploaded");
              createContentItem('"Upload a Mobile Application"', contentName, selectedFile, json, "app", osName)
                  .then(function(resultJson) {
                      console.log('done app upload: ', resultJson);
                      $("#sample-message").text("Success - app uploaded");
                      if (selectedFile.name.indexOf(".ipa") !== -1) { //only of ipa/ios files
                        createContentItem('"Upload a Mobile Application"', contentName, "ipa_manifest.plist", json, "manifest", osName)
                            .then(function(resultJson) {
                                console.log('done plist upload: ', resultJson);
                                $("#sample-message").text("");
                                promoteContentItem(resultJson.id).then(function(resultJson) {
                                    console.log('done content promote: ', resultJson);
                                    alert("Upload successful and mobile app published");
                                })
                                .catch(function(e) {
                                  if (e.statusText) {
                                    e = e.statusText;
                                  }
                                  $("#sample-message").text('Error ' + e);
                                });
                            })
                            .catch(function(e) {
                              if (e.statusText) {
                                e = e.statusText;
                              }
                              $("#sample-message").text('Error ' + e);
                            });
                      } else { // promote the content item
                          promoteContentItem(resultJson.id).then(function(resultJson) {
                              console.log('done content promote: ', resultJson);
                              alert("Upload successful and mobile app published");
                              $("#sample-message").text("");
                              $("#sample-create-title").val("");
                              $("#sample-create-package").val("");
                              $("#sample-create-version").val("");
                              $("#sample-create-image").val("");
                              $("#sample-create-file").val("");
                          })
                          .catch(function(e) {
                            if (e.statusText) {
                              e = e.statusText;
                            }
                            $("#sample-message").text('Error ' + e);
                          });
                      }
                  })
                  .catch(function(e) {
                    if (e.statusText) {
                      e = e.statusText;
                    }
                    $("#sample-message").text('Error ' + e);
                  });
        })
        .catch(function(e) {
          alert(e);
          if (e.statusText) {
            e = e.statusText;
          }
          $("#sample-message").text('Error ' + e);
        });
    }
    return {
                contentHubLogin: login,
                uploadMobileApp: uploadApp
            };
})(this);// 'this' is a reference to 'window' here
