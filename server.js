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
      // socket is created and JOIN_LOBBY is sent after POST /create-room -> GET /rooms/:id (admin: true),
      //  POST /join-room -> GET /rooms/:id 
      //  or just GET /rooms/:id for an existing & open id (admin: false)
      case 'JOIN_LOBBY':
        if (message.name in rooms[message.room].players) {
          ws.send(JSON.stringify({type: "JOIN_FAILED", reason: 'name'}));
        } else {
          let isAdmin = Object.keys(rooms[message.room].players).length === 0;
          rooms[message.room].players[message.name] = {admin: isAdmin, name: message.name, connection: ws};
          ws.send(JSON.stringify({type: "ROOM_JOINED", admin: isAdmin, players: Object.keys(rooms[message.room].players)}));
          ws.room = message.room; ws.name = message.name;

          if(!isAdmin) {
            // broadcast join to other members of room
            Object.keys(rooms[message.room].players).forEach(player => {
              if(player !== message.name) {
                rooms[message.room].players[player].send(JSON.stringify({type: 'PLAYER_JOINED', name: message.name}));
              }
            });
          }
        }
        break;

      case 'START_GAME':
        // send GAME_STARTED to all other players in room
        Object.keys(rooms[message.room].players).forEach(player => {
          if(player !== ws.name) {
            rooms[ws.room].players[ws.name].send(JSON.stringify({type: 'GAME_STARTED'}));
          }
        });
        setTimeout(() => {
          rooms[ws.room].game = new coup.Game(rooms[ws.room].players);
        }, 500);
        break;

      case 'PING':
        // keeping connection alive for Heroku
        break;
      
      default:
        rooms[ws.room].game.onMessage(message);
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
    rooms[id] = {game: null, room: id, open: true, players: {}};
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

  rooms[id] = {game: null, open: true, room: id, players: {}};
  res.json({room: id})
});

app.post("/join-room", (req, res) => {
  let body = req.body;
  if(body.room in rooms) {
    res.json({exists: true, open: rooms[body.room].open});
  } else {
    res.json({exists: false});
  }
});