var express = require('express');
var app = express();
var path = require('path');

app.use(express.static('wchappcenter'));
/* serves all the static files in the public folder */
//app.use(express.static(path.join(__dirname, 'public')));

/*app.get('/', function (req, res) {
   console.log("dir name --- " + __dirname);
   res.sendFile( __dirname + "/" + "index.html" );
})*/

app.get('/appcenter', function (req, res) {
   res.sendFile( __dirname + "/wchappcenter/" + "index.html" );
})

app.get('/appcenter/installer', function (req, res) {
   res.sendFile( __dirname + "/wchappcenter/" + "installer.html" );
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("app listening at http://%s:%s", host, port)
});
