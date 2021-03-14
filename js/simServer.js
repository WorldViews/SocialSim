//
var VERSION = "SocialSim server 0.0.1";

var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');

/////////////////////////////////////////////////////////////////////
//   Setup basic http server using express.

var serverSSL;
var app = express();
var server = http.createServer(app);

//app.use(express.static("./static"));
app.use(express.static("."));
app.use(bodyParser.json());

//app.use(fileupload());
app.use(cors());

app.get('/api/version', function (req, res) {
    res.send('Version ' + VERSION)
});

var port = 8000;
var addr = "0.0.0.0";
if (process.argv[3]) {
    port = process.argv[3];
}
console.log("simServer listening on address: " + addr + " port:" + port);
//app.listen(port, addr);
server.listen(port, addr);

