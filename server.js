const express = require("express");
const coup = require("./game.js");

const port = process.env.PORT || 3000;

const app = express();
const WebSocket = require("ws");

const cors = require("cors");
const http = require("http").createServer(app);
const wss = new WebSocket.Server({ server: http });

app.use(cors());
app.use(express.json());

let rooms = {};

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(msg) {
    let message = JSON.parse(msg);
    switch(message.type) {
      /* This has been moved to a POST route 
      case 'CREATE_LOBBY':
        let id = Math.floor(1000 + Math.random() * 9000);
        while(id in lobbies) {
          id = Math.floor(1000 + Math.random() * 9000);
        }

        lobbies[id] = {game: null, lobby: id, players: {}};
        lobbies[id].players[message.name] = {connection: ws, name: message.name, admin: true};
        ws.send(JSON.stringify({type: "LOBBY_CREATED", lobby: id, admin: true}));
        ws.lobby = id; ws.name = message.name;
        break;
      */

      case 'JOIN_LOBBY':
        if (message.name in rooms[message.room].players) {
          ws.send(JSON.stringify({type: "JOIN_FAILED", reason: 'name'}));
        } else {
          rooms[message.room].players[message.name] = {admin: false, name: message.name, connection: ws};
          ws.send(JSON.stringify({type: "ROOM_JOINED", admin: false, room: message.room, players: Object.keys(rooms[message.room].players)}));
          ws.room = message.room; ws.name = message.name;
        }
        break;

      case 'START_GAME':

        break;

      case 'PING':
        // keeping connection alive for Heroku
        break;
      
      default:
        lobbies[ws.lobby].game.onMessage(message);
        break;
    }
  });

  ws.on('close', function() {
    if(ws.hasOwnProperty(lobby) && ws.hasOwnProperty(name)) {
      delete lobbies[ws.lobby].players[ws.name];
      if(Object.keys(lobbies[ws.lobby].players).length === 0) {
        delete lobbies[ws.lobby];
      }
    }
  })
});

/*
// rewrite for '/rooms/:id'?
app.get("/rooms/:id/reset", (req, res) => {
  if(req.params.id in rooms) {
    rooms[id] = {game: null, room: id, players: {}};
    res.send({reset: true});
  } else {
    res.send({reset: false});
  }
});

app.get("/rooms/:id/events", (req, res) => {
  if(req.params.id in rooms) {
    res.json(rooms[req.params.id].game.event_log);
  }
});
*/

app.get("/rooms/:id", (req, res) => {
  if(req.params.id in rooms) {
    let isEmpty = Object.keys(rooms[req.params.id].players).length === 0;
    res.send({exists: true, empty: isEmpty, open: rooms[req.params.id].open, room: req.params.id});
  } else {
    res.send({exists: false});
  }
});

let clientDir = __dirname + "/client/public/";
app.use(express.static(clientDir));
app.get('*', (req, res) => {
  res.sendFile(clientDir + "index.html");
});

app.post("/create-room", (req, res) => {
  let id = Math.floor(1000 + Math.random() * 9000);
  while(id in lobbies) {
    id = Math.floor(1000 + Math.random() * 9000);
  }

  rooms[id] = {game: null, room: id, players: {}};
  res.json({room: id})
});
