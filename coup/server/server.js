const express = require("express");
const coup = require("./game.js");

const app = express();
const WebSocket = require("ws");

const cors = require("cors");
const body_parser = require("body-parser");
const http = require("http").createServer(app);
const wss = new WebSocket.Server({ server: http, port: 9000 });

const port = 3000;
app.use(cors());
app.use(body_parser.json());
let game;

let state = {
  players: {},
};
const defaultState = JSON.parse(JSON.stringify(state));

app.get("/reset", (_, res) => {
  state = defaultState;
  res.send("Done!");
});

app.get("/stats", (_, res) => {
  res.json(state);
});

app.post("/join-game", (req, res) => {
  let body = req.body;
  let admin = false;
  if (Object.keys(state.players).length == 0) {
    admin = true;
  }

  state.players[body.name] = { admin, name: body.name };

  res.json({ admin });
});

app.post("/start-game", (req, res) => {
  // start game,
  // send message to all clients w/ game init info
  let playernames = Object.keys(state.players);
  game = new coup.Game(playernames, wss);
});

http.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
