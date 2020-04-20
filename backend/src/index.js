//import dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const assert = require("assert");

// define the Express app
const app = express();

let games = new Map(); // host -> game (new games are stored here)
let playerToGame = new Map();
let globId = 0;

function send(con, obj) {
    con.write(`data: ${JSON.stringify(obj)}`);
    con.write("\n\n");
}

class Game {
    constructor(host) {
        this.host = host;
        this.players = new Map();
        this.players.set(host, {});
        this.id = globId++;
        this.status = "WAITING";
    }

    state(name) {
        const playerObj = this.players.get(name);
        assert(playerObj);
        return {
            host: this.host,
            players: [ ...this.players.keys() ],
            id: this.id,
            status: this.status,
            role: playerObj.role
        };
    }

    newCon(name, res) {
        // THE PLAYER IS NOT ADDED IN HERE!
        let player = this.players.get(name);
        assert(player);
        player.con = res;
        send(res, this.state(name));
    }


    dropCon(name) {
        let player = this.players.get(name);
        assert(player);
        player.con = null;
    }

    handleAction(requester, request, resp) {
        switch (request.type) {
            case "END":
                this.end(requester, request, resp);
                break;
            case "START":
                this.start(requester, request, resp);
                break;
            case "PROPOSE":
                this.propose(requester, request, resp);
                break;
            case "LADY":
                this.lady(requester, request, resp);
                break;
            case "VOTE":
                this.vote(requester, request, resp);
                break;
            case "MISSION":
                this.mission(requester, request, resp);
                break;
        }
    }

    end(requester, request, resp) {
        if (requester != this.host) {
            resp.send(401);
            return;
        }
        console.log("ending game hosted by " + this.host);
        this.players.forEach((playerObj, name) => {
            assert(playerToGame.get(name) === this);
            playerToGame.delete(name);
            playerObj.con.close();
        });
        assert(games.get(this.host) === this);
        games.delete(this.host);
        this.status = "CLOSED";
        // no trace left
    }

    issueRoles() {
        // TEMP
        this.players.forEach((playerObj, name) => {
            playerObj.role = "oberon";
        });
    }

    generateOrder() {
        this.order = []
    }

    start(requester, request, resp) {
        if (requester != this.host) {
            resp.send(401);
            return;
        }
        console.log("starting game hosted by " + this.host);
        this.issueRoles();
        this.generateOrder();
        this.missionIdx = 0;
        this.status = "PROPOSING";
        this.turn = order[0];
        this.lady = order[0]; // this is fake news
    }
};

// enhance your app security with Helmet
app.use(helmet());

// use bodyParser to parse application/json content-type
app.use(bodyParser.json());

// enable all CORS requests
app.use(cors());

// log HTTP requests
app.use(morgan('combined'));

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://bk-tmp.auth0.com/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  audience: 'PVafIu9Q5QN65DiPByAFvCCJryY7n432',
  issuer: `https://bk-tmp.auth0.com/`,
  algorithms: ['RS256']
});

// retrieve all questions
app.get("/games", checkJwt, (req, res) => {

    // TODO: check if player is currently in game... react appropriately
    let gs = []
    games.forEach((game, host) => {
        if (game.status = "WAITING") {
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
app.get("/mygame", checkJwt, (req, res) => {
    console.log("mygame");
    const name = req.user.nickname;
    const game = playerToGame.get(name);
    assert(game);

    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Content-Type", "text/event-stream");
    res.flushHeaders();
    
    res.on("close", () => {
        console.log(name + " dropped");
        game.dropCon(name);
        res.end();
    });

    game.newCon(name, res);
});

app.post("/action", checkJwt, (req, res) => {
    const name = req.user.nickname;
    let game = playerToGame.get(name);
    game.handleAction(name, req.body, res);
});

app.post("/newgame", checkJwt, (req, res) => {
    
    const name = req.user.nickname;
    assert(!playerToGame.has(name));
    assert(!games.has(name));

    const game = new Game(name);
    games.set(name, game);
    playerToGame.set(name, game);
    res.send();
});

// start the server
app.listen(8081, () => {
  console.log('listening on port 8081');
});
