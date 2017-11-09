var noditor = require('../noditor');
var restify = require('restify'),
    fs = require('fs');

// https://stackoverflow.com/questions/12871565/how-to-create-pem-files-for-https-web-server
var https_options = {
  key: fs.readFileSync('./ssl/www.noditor.com.key'), // key: fs.readFileSync('./ssl/key.pem'),
  certificate: fs.readFileSync('./ssl/www.noditor.com.crt'), // certificate: fs.readFileSync('./ssl/cert.pem'),
  requestCert: false,
  rejectUnauthorized: false
};


// Restify
var http_server = restify.createServer();
var https_server = restify.createServer(https_options);

// CORS
http_server.use(restify.CORS());
https_server.use(restify.CORS());

http_server.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  console.warn('Demo server > HTTP Request -',req.connection.remoteAddress, req.header['x-forwarded-for'], req.url);
  next();
});
https_server.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  console.warn('Demo server > HTTPS Request -',req.connection.remoteAddress, req.headers['x-forwarded-for'], req.url);
  next();
});

// Static routes
http_server.get(/(^\/$)|(\.(html|js|css|png|jpg)$)/, restify.serveStatic({
  directory: 'static',
  default: 'index.html'
}));
https_server.get(/(^\/$)|(\.(html|js|css|png|jpg)$)/, restify.serveStatic({
  directory: 'static',
  default: 'index.html'
}));

// Setup query parsers
http_server.use(restify.queryParser());
https_server.use(restify.queryParser());

// Add the Noditor endpoint
http_server.get('/noditor/:path/:passcode/:command', noditor.commands);
https_server.get('/noditor/:path/:passcode/:command', noditor.commands);

// Start http service
http_server.listen(8000, function () {
    http_server.name = "HTTP";
    console.log('Demo server > '+http_server.name+' - '+http_server.url+' started @'+new Date());

});

// Start https service
https_server.listen(8443, function () {
  https_server.name = "HTTPS";
  console.log('Demo server > '+https_server.name+' - '+https_server.url+' started @'+new Date());
});

// Noditor
var options = {"stats_frequency":15, "stats_size":20, "quiet":false};
noditor.start(options);


// Place a load on the server
setInterval(function(){ loadMemory(Math.floor((Math.random() * 500000) + 20000)); }, 5000);
var arr;
var txt = 'This is meant to be a long string to place a load on the server memory footprint.';
function loadMemory(size) {
  arr = [];
  for (var i = 0; i<size; i++){
    arr.push(txt);
  }
}