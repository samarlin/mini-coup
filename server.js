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

let rooms = {}, interval;

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(msg) {
    let message = JSON.parse(msg);
    switch(message.type) {
      // socket is created and JOIN_ROOM is sent after POST /create-room -> GET /rooms/:id (admin: true),
      //  POST /join-room -> GET /rooms/:id 
      //  or just GET /rooms/:id for an existing & open id (admin: false)
      case 'JOIN_ROOM':
        if (!(message.room in rooms)) { // this shouldn't be able to happen...
          ws.send(JSON.stringify({type: "JOIN_FAILED", reason: 'room'}));
        } else if (message.name in rooms[message.room].players) {
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
                rooms[message.room].players[player].connection.send(JSON.stringify({type: 'PLAYER_JOINED', name: message.name}));
              }
            });
          }

          if(Object.keys(rooms[message.room].players).length === 6)
            rooms[message.room].open = false;
        }
        break;

      case 'START_GAME':
        // send GAME_STARTED to all other players in room
        rooms[ws.room].open = false;
        Object.keys(rooms[ws.room].players).forEach(player => {
          if(player !== ws.name) {
            rooms[ws.room].players[player].connection.send(JSON.stringify({type: 'GAME_STARTED'}));
          }
        });
        setTimeout(() => {
          rooms[ws.room].game = new coup.Game(rooms[ws.room].players);
        }, 1000);
        break;

      case 'PING':
        // keeping connection alive for Heroku
        ws.send(JSON.stringify({type: 'PONG'}));
        break;
      
      default:
        rooms[ws.room].game.onMessage(message);
        break;
    }
  });

  ws.on('close', function() {
    if(ws.hasOwnProperty('room') && ws.hasOwnProperty('name') && ws.room in rooms) {
      if(rooms[ws.room].game !== null && Object.keys(rooms[ws.room].players).length > 1) {
        rooms[ws.room].game.playerLeft(ws.name);
      }

      if(ws.name in rooms[ws.room].players) {
        let wasAdmin = rooms[ws.room].players[ws.name].admin;
        delete rooms[ws.room].players[ws.name];

        if(Object.keys(rooms[ws.room].players).length === 0) {
          delete rooms[ws.room];
        } else {
          if(rooms[ws.room].game === null) {
            if(wasAdmin) {
              rooms[ws.room].players[Object.keys(rooms[ws.room].players)[0]].admin = true;
            }
            Object.keys(rooms[ws.room].players).forEach(player => {
              rooms[ws.room].players[player].connection.send(JSON.stringify({type: 'PLAYER_LEFT', name: ws.name, updated_admin: rooms[ws.room].players[player].admin}));
            });
            if(Object.keys(rooms[ws.room].players.length < 6))
              rooms[ws.room].open = true;
          } 
        }
      }
    }
  })
});

let forcessl = function (req, res, next) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  return next();
};
app.use(forcessl);

app.use(express.static(path.resolve(__dirname, 'client/public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  },
}));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client/public', 'index.html'));
});

app.post("/create-room", (req, res) => {
  clearInterval(interval);
  let id = Math.floor(1000 + Math.random() * 9000);
  while(id in rooms) {
    id = Math.floor(1000 + Math.random() * 9000);
  }

  rooms[id] = {game: null, open: true, room: id, players: {}};
  interval = setInterval(() => {
    Object.keys(rooms).forEach(room => {
      if(Object.keys(rooms[room].players).length === 0) {
        console.log('culling room ' + room);
        delete rooms[room];
      }
    });
    if(Object.keys(rooms).length === 0) {
      clearInterval(interval);
    }
  }, 300000);
  res.json({room: id})
});

// return 404 if room doesn't exist
app.post("/join-room", (req, res) => {
  let body = req.body;
  if(body.room in rooms) {
    res.json({exists: true, open: rooms[body.room].open, curr_players: Object.keys(rooms[body.room].players)});
  } else {
    res.json({exists: false});
  }
});

http.listen(port, () => {
  console.log(`App listening on ${port}`);
});