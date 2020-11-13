const express = require("express");

const app = express();
const WebSocket = require("ws");

const cors = require("cors");
const body_parser = require("body-parser");
const http = require("http").createServer(app);
const wss = new WebSocket.Server({ server: http, port: 9000 });

wss.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("message", (message) => {
    //log the received message and send it back to the client
    console.log("received: %s", message);
    socket.send(`Hello, you sent -> ${message}`);
  });
});

const port = 3000;
app.use(cors());
app.use(body_parser.json());

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
});

http.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
