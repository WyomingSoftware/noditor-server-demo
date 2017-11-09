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


// Only run HTTP in development.
// Heroku and node-26 will use http_server.
// Each will have a port number set for process.env.PORT.
// node-26 must be started with a PORT param.
var http_server = restify.createServer();
var https_server;
if(!process.env.PORT){
  // node-26 needs the cert
  https_server = restify.createServer(https_options);
}
else{
  // Heroku has its own cert
  https_server = restify.createServer(); // Heroku
}


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

// Start http service only for developement
if(!process.env.PORT){
  http_server.listen(8000, function () {
      http_server.name = "HTTP";
      console.log('Demo server > '+http_server.name+' - '+http_server.url+' started @'+new Date());
  });
}

// Start https service
var port = process.env.PORT || 8443;
https_server.listen(port, function () {
  https_server.name = "HTTPS";
  console.log('Demo server > '+https_server.name+' - '+https_server.url+' started @'+new Date());
});

// Noditor
var passcode = process.argv[2];
console.log('++++++++++++++++++++++');
console.log('index 0:', process.argv[0]);
console.log('index 1:', process.argv[1]);
console.log('index 2 > Passcode:', process.argv[2]);
console.log('++++++++++++++++++++++');
var options = {"stats_frequency":15, passcode: passcode,"stats_size":20, "quiet":false};
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
