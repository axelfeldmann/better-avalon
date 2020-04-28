//import dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const assert = require("assert");
const path = require("path");

const Game = require("./game.js");

// define the Express app
const app = express();

let games = new Map(); // host -> game (new games are stored here)
let playerToGame = new Map();

app.use(helmet());
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('combined'));

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://axelfeldmann.auth0.com/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  audience: 'fxwSJvednKT8LMzYjMXnKrdAhiaVH3o4',
  issuer: `https://axelfeldmann.auth0.com/`,
  algorithms: ['RS256']
});



// retrieve all questions
app.get("/api/games", checkJwt, (req, res) => {
    const name = req.user.nickname;
    console.log("games", name);
    const game = playerToGame.get(name);
    if (game) {
        res.send(400);
        return;
    }

    // TODO: check if player is currently in game... react appropriately
    let gs = []
    games.forEach((game, host) => {
        if (game.acceptingPlayers()) {
            gs.push({
                host: game.host,
                id: game.id,
                numPlayers: game.players.length 
            });
        }
    });
    res.send(gs);
});

// should establish a streaming connection with the server
app.get("/api/mygame", checkJwt, (req, res) => {
    const name = req.user.nickname;
    console.log("mygame", name);
    const game = playerToGame.get(name);
    if (!game) {
        res.send(400);
        return;
    }

    res.setHeader("Cache-Control", "no-transform");
    res.setHeader("Content-Type", "text/event-stream");
    res.flushHeaders();
    
    res.on("close", () => {
        console.log(name + " dropped");
        game.dropCon(name);
        res.end();
    });

    game.newCon(name, res);
});

app.post("/api/action", checkJwt, (req, res) => {
    const name = req.user.nickname;
    console.log("action", name);
    let game = playerToGame.get(name);
    game.handleAction(name, req.body, res);
    res.send();
});

app.post("/api/newgame", checkJwt, (req, res) => {
    const name = req.user.nickname;
    console.log("newgame", name);
    const nickname = req.body.nickname;
    assert(!playerToGame.has(name));
    assert(!games.has(name));

    const game = new Game(name);
    if (!game.addPlayer(name, nickname)){
        res.send(400);
    }
    games.set(name, game);
    playerToGame.set(name, game);
    res.send();
});

app.post("/api/joingame", checkJwt, (req, res) => {
    const host = req.body.host;
    const name = req.user.nickname;
    const nickname = req.body.nickname;
    const game = games.get(host);
    console.log("joingame", name);
    assert(game);
    assert(!playerToGame.has(name));
    if (game.addPlayer(name, nickname)) {
        playerToGame.set(name, game);
        res.send();
    } else {
        res.send(400);
    }
});

app.post("/api/endgame", checkJwt, (req, res) => {
    const host = req.user.nickname;
    console.log("endgame", host);
    const game = games.get(host);
    if (!game) {
        res.send(400);
    }

    game.players.forEach((playerObj, name) => {
        assert(playerToGame.has(name));
        playerToGame.delete(name);
        if (playerObj.con) {
            playerObj.con.end();
        }
    });
    games.delete(host);
    res.send();

});

app.post("/api/leavegame", checkJwt, (req, res) => {
    const name = req.user.nickname;
    const game = playerToGame.get(name);
    console.log("leavegame", name);
    if (!game || !game.removePlayer(name)) {
        res.send(400);
        return;
    }
    playerToGame.delete(name);
    res.send();
});

app.use(express.static(path.join(__dirname, "../../frontend/build")));

app.use((req, res) => {
    const p = path.join(__dirname, "../../frontend/build/index.html");
    res.sendFile(p);
});

// start the server
app.listen(80, () => {
  console.log('listening on port 80');
});
