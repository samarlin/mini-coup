const express = require("express");
const coup = require("./game.js");

const port = process.env.PORT || 3000;
const index = '/client/public/index.html';

const app = express()
  .use((req, res) => res.sendFile(index, {root: __dirname}))
  .listen(port, () => console.log(`Listening on ${port}`));
const WebSocket = require("ws");

const cors = require("cors");
const body_parser = require("body-parser");
const wss = new WebSocket.Server({ server: app });

app.use(cors());
app.use(body_parser.json());

let game;
let state = {
  players: {},
};
const defaultState = JSON.parse(JSON.stringify(state));

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(msg) {
    let message = JSON.parse(msg);
    if (message.type === "ASSOCIATE") {
      state.players[message.id].connection = ws;
    } else {
      game.onMessage(message);
    }
  });
});

app.get("/reset", (_, res) => {
  state = defaultState;
  res.send("Done!");
});

app.get("/stats", (_, res) => {
  let sanitized = {
    ...state,
    players: Object.entries(state.players).map(([name, player]) => {
    const {connection, ...rest} = player;
    return rest;
    })};
  res.json(sanitized);
});

app.get("/events", (_, res) => {
  res.json(game.event_log);
});

app.post("/join-game", (req, res) => {
  let body = req.body;
  let admin = false;
  if (Object.keys(state.players).length == 0) {
    admin = true;
  }

  state.players[body.name] = { admin: admin, name: body.name };

  res.json({ admin });
});

app.post("/start-game", (req, res) => {
  // start game,
  // send message to all clients w/ game init info
  game = new coup.Game(state.players);
});