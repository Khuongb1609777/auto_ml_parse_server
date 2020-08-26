// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require("express");
var ParseServer = require("parse-server").ParseServer;
var path = require("path");
var cors = require("cors");
var busboy = require("connect-busboy");
var fs = require("fs-extra");
let PostgresStorageAdapter = require("parse-server/lib/Adapters/Storage/Postgres/PostgresStorageAdapter")
  .PostgresStorageAdapter;
let FSFilesAdapter = require("@parse/fs-files-adapter");

var databaseUri = "postgres://admin:admin%40123@172.16.1.229:5432/mining";
// var databaseUri = 'postgres://poadmin:poadmin@localhost:5432/mining';

if (!databaseUri) {
  console.log("DATABASE_URI not specified, falling back to localhost.");
}

var api = new ParseServer({
  // databaseURI: databaseUri || "postgres://admin:admin%40123@172.16.1.229:5432/mining",
  databaseAdapter: new PostgresStorageAdapter({
    uri: databaseUri,
  }),
  cloud: __dirname + "/cloud/main.js",
  appId: "myAppId",
  restAPIKey: "api_key",
  clientKey: "client_key",
  masterKey: "master_KEY", //Add your master key here. Keep it secret!
  serverURL: "http://localhost:1337", // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["Posts", "Comments"], // List of classes to support for query subscriptions
  },
  filesAdapter: new FSFilesAdapter({
    // filesSubDirectory: "./file-storage",
  }),
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

// parse-dashboard --dev --appId myAppId --masterKey master_KEY --serverURL "http://localhost:1337/parse" --appName appmining
// npm start

var app = express();

// Serve static assets from the /public folder
app.use(cors());
app.use(busboy());
app.use("/public", express.static(path.join(__dirname, "/public")));
app.use(express.static(path.join(__dirname, "public")));

// Serve the Parse API on the /parse URL prefix
var mountPath = "/parse";
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get("/", function (req, res) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app

// app.get('/test', function(req, res) {
//   res.sendFile(path.join(__dirname, '/public/test.html'));
// });

// app.post('/uploadFile', function(req, res, next) {
//   var fstream;
//   req.pipe(req.busboy);
//   req.busboy.on('file', function (fieldname, file, filename){
//     console.log("Uploading: " + filename);
//     // fstream = fs.createWriteStream(__dirname + filename);
//     // file.pipe(fstream);
//     // fstream.on('close', function(){
//     //   console.log("Upload Finished of " + filename);
//     //   res.redirect('back');
//     // });
//   });
// });

var port = process.env.PORT || 1337;
var httpServer = require("http").createServer(app);
httpServer.listen(port, function () {
  console.log("parse-server-example running on port " + port + ".");
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
