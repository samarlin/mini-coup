const express = require("express");
const coup = require("./game.js");

const port = process.env.PORT || 3000;

const app = express();
const WebSocket = require("ws");

const cors = require("cors");
const path = require("path");
const http = require("http").createServer(app);
const wss = new WebSocket.Server({ server: http });

app.use(cors());
app.use(express.json());

let rooms = {};

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(msg) {
    let message = JSON.parse(msg);
    switch(message.type) {
      // socket is created and JOIN_ROOM is sent after POST /create-room -> GET /rooms/:id (admin: true),
      //  POST /join-room -> GET /rooms/:id 
      //  or just GET /rooms/:id for an existing & open id (admin: false)
      case 'JOIN_ROOM':
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
    if(ws.hasOwnProperty(room) && ws.hasOwnProperty(name)) {
      delete rooms[ws.room].players[ws.name];
      if(Object.keys(rooms[ws.room].players).length === 0) {
        delete rooms[ws.room];
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

app.use(express.static('client/public'));
/*
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client/public', 'index.html'));
});
*/

app.post("/create-room", (req, res) => {
  let id = Math.floor(1000 + Math.random() * 9000);
  while(id in rooms) {
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

http.listen(port, () => {
  console.log(`Example app listening at on ${port}`);
});