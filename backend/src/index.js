//import dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

// define the Express app
const app = express();

function Game(host) {
    this.host = host
    this.players = [host]
};

var games = [];
var playerToGame = {};

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
    const gs = games.map(q => ({
        host: q.host,
        numPlayers: q.players.length
    }));
    res.send(gs);
});

app.post("/newgame", checkJwt, (req, res) => {
    games.push(new Game(req.user.nickname));
});

// start the server
app.listen(8081, () => {
  console.log('listening on port 8081');
});
