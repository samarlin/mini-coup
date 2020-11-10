const express = require('express');

const app = express()

const cors = require('cors');
const web_socket = require('ws');
const body_parser = require('body-parser');
app.io = require('socket.io')();

const port = 3000
app.use(cors());
app.use(body_parser.json());

app.io.on('connection', function() { console.log("connection for player made"); });

let state = {
  "players": [],
  "connections": {}
};

app.post('/join-game', (req, res) => {
  let body = req.body;
  let admin = false;
  if (state.players.length == 0) {
    admin = true;
  }

  state.players.push(body.name); 

  //state.connections[body.name] = ws;

  res.json({admin});
})

app.post('/start-game', (req, res) => {
  // start game,
  // send message to all clients w/ game init info
  
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})