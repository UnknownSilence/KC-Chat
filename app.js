const mongo = require("mongodb").MongoClient;
const client = require("socket.io");
const express = require("express");

var MONGODB_URI =
  "mongodb://UnknownSilence1:assassingamingmc123@ds247944.mlab.com:47944/kc-chat";

var port = process.env.PORT || 3000;

var app = express();
var server = app.listen(port, function() {
  console.log("listening on port 3000");
});

app.use(express.static("public"));

var io = client(server);

// Connect to mongo
mongo.connect(
  MONGODB_URI,
  function(err, db) {
    if (err) {
      throw err;
    }

    console.log("MongoDB connected...");

    // Connect to Socket.io
    io.on("connection", function(socket) {
      let chat = db.collection("chats");

      // Create function to send status
      sendStatus = function(s) {
        io.emit("status", s);
      };

      // Get chats from mongo collection
      chat
        .find()
        .limit(100)
        .sort({
          _id: 1
        })
        .toArray(function(err, res) {
          if (err) {
            throw err;
          }

          // Emit the messages
          io.emit("output", res);
        });

      // Handle input events
      socket.on("input", function(data) {
        let name = data.name;
        let message = data.message;

        // Check for name and message
        if (name == "" || message == "") {
          // Send error status
          sendStatus("Please enter a name and message");
        } else {
          // Insert message
          chat.insert(
            {
              name: name,
              message: message
            },
            function() {
              io.emit("output", [data]);

              // Send status object
              sendStatus({
                message: "Message sent",
                clear: true
              });
            }
          );
        }
      });

      // Handle clear
      socket.on("clear", function(data) {
        // Remove all chats from collection
        chat.remove({}, function() {
          // Emit cleared
          io.emit("cleared");
        });
      });
    });
  }
);
