const assert = require("assert");
const State = require("./state.js");

function send(con, obj) {
    con.write(`data: ${JSON.stringify(obj)}`);
    con.write("\n\n");
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

function mission(numPlayers, failsRequired) {
    return {
        type: "MISSION",
        numPlayers: numPlayers,
        status: "NONE",
        failsRequired: failsRequired
    };
}

function isBad(role) {
    switch (role) {
        case "OBERON":
            return true;
        default:
            return false;
    }
}

module.exports = class Game {
    constructor(host) {
        this.host = host;
        this.players = new Map();
        this.state = { gameState : "WAITING" };
        this.addPlayer(host);
    }

    addPlayer(name) {
        if (this.state.gameState != "WAITING") {
            return false;
        }
        this.players.set(name, { con: null });
        this.broadcast();
        return true;
    }

    removePlayer(name) {
        assert(this.players.has(name));
        if (this.host === name) {
            return false;
        }
        this.players.delete(name);
        this.broadcast();
        return true;
    }

    broadcast() {
        this.players.forEach((playerObj, name) => {
            if (playerObj.con) {
                send(playerObj.con, this.stateForPlayer(name));
            }
        })
    }

    newCon(name, res) {
        let player = this.players.get(name);
        assert(player);
        player.con = res;
        send(res, this.stateForPlayer(name));
    }

    dropCon(name) {
        let player = this.players.get(name);
        if (player) {
            player.con = null;          
        }
    }

    acceptingPlayers() {
        return (this.state.gameState === "WAITING");
    }

    generateEvents() {
        return [
            mission(2, 1),
            { type: "LADY" },
            mission(2, 2),
            { type: "LADY" },
            mission(2, 1)
        ];
    }

    assignRoles() {
        let roleMap = new Map();
        this.players.forEach((playerObj, name) => {
            roleMap.set(name, "OBERON");
        });
        return roleMap;
    }

    assignOrder() {
        let players = [ ...this.players.keys() ];
        shuffle(players);
        return players;
    }

    start(name) {
        if (name !== this.host) return false;
        const order = this.assignOrder();
        this.state = {
            events: this.generateEvents(),
            playerRoles: this.assignRoles(),
            order: this.assignOrder(),
            turnIdx: 1,
            lady: order[0],
            eventIdx: 0,
            messages: new Map(),
            gameState: "PROPOSING",
            proposalNum: 1,
            maxProposals: 2
        };
        this.state.waiting = [ this.state.order[this.state.turnIdx] ];
        this.players.forEach((playerObj, name) => {
            const role = this.state.playerRoles.get(name);
            this.state.messages.set(name, "your role is " + role);
        });
        return true;
    }

    handleProposal(proposer, proposal) {
        const turn = this.state.order[this.state.turnIdx];
        if (turn !== proposer || this.state.gameState !== "PROPOSING") return false;
        const mission = this.state.events[this.state.eventIdx];
        console.log(mission);
        if (mission.type !== "MISSION" || mission.status !== "NONE") return false;

        mission.status = "VOTING";
        mission.votesReceived = 0;
        mission.votesFor = 0;
        mission.proposal = proposal;
        this.state.gameState = "VOTING";
        this.state.waiting = [...this.state.order];

        this.state.order.forEach((player) => {
            const proposalStr = "mission proposal: " + proposal.toString();
            this.state.messages.set(player, proposalStr);
        })

        return true;
    }

    nextEvent(){
        const missions = this.state.events.filter(event => event.type === "MISSION");
        const passes = missions.filter(mission => mission.status === "PASSED").length;
        const fails = missions.filter(mission => mission.status === "FAILED").length;
        const thresh = missions.length / 2;
        const goodWins = passes > thresh;
        const badWins = fails > thresh;
        if (goodWins) {
            this.state.gameState = "GOODWINS";
            return;
        }
        if (badWins) {
            this.state.gameState = "BADWINS";
            return;
        }
        this.state.eventIdx += 1;
        const newEvent = this.state.events[this.state.eventIdx];
        if (newEvent.type === "MISSION") {

            this.state.turnIdx = (this.state.turnIdx + 1) % this.state.order.length;
            this.state.gameState = "PROPOSING";
            const newProposer = this.state.order[this.state.turnIdx];
            this.state.waiting = [ newProposer ];
            this.state.proposalNum = 1;

        } else {
            assert(newEvent.type === "LADY"); // temp, but needed

            const lady = this.state.lady;
            this.state.waiting = [lady];
            this.state.gameState = "LADYING";
        }
    }

    handleVote(voter, vote) {
        const mission = this.state.events[this.state.eventIdx];
        if (mission.type !== "MISSION" || mission.status != "VOTING") return false;
        if (!this.state.waiting.includes(voter)) return false;
        mission.votesReceived += 1;
        if (vote === "YES") mission.votesFor += 1;
        this.state.waiting = this.state.waiting.filter(player => player !== voter);

        if(this.state.waiting.length !== 0) { // need more votes
            return true;
        }
        const happening = mission.votesFor > (mission.votesReceived / 2);
        const autoFail = this.state.proposalNum === this.state.maxProposals;
        if (!happening && autoFail) {
            mission.status = "FAILED";
            mission.fails = this.state.order.length;
            this.state.order.forEach((player) => {
                this.state.messages.set(player,
                    `the proposal only got ${mission.votesFor}/${mission.votesReceived} votes... mission fail!`
                );
            });
            delete mission.proposal;
            delete mission.votesReceived;
            delete mission.votesFor;
            this.nextEvent();
        } else if(!happening) {
            this.state.proposalNum += 1;
            this.state.turnIdx = (this.state.turnIdx + 1) % this.state.order.length;
            this.state.gameState = "PROPOSING";
            this.state.order.forEach((player) => {
                this.state.messages.set(player, 
                    `the proposal only got ${mission.votesFor}/${mission.votesReceived} votes`);
            });
            mission.status = "NONE";
            delete mission.proposal;
            delete mission.votesReceived;
            delete mission.votesFor;
            this.state.waiting = this.state.order[this.state.turnIdx];
        } else {
            this.state.gameState = "MISSION";
            mission.status = "HAPPENING";
            this.state.order.forEach((player) => {
                this.state.messages.set(player, 
                    `the proposal is happening with ${mission.votesFor}/${mission.votesReceived} votes`);
            });
            this.state.waiting = [...mission.proposal];
            mission.missionResponses = 0;
            mission.fails = 0;
            delete mission.votesReceived;
            delete mission.votesFor;
        }
        return true;
    }

    handlePassFail(missionGoer, missionResponse){
        const mission = this.state.events[this.state.eventIdx];
        if (mission.type !== "MISSION" || mission.status != "HAPPENING") return false;
        if (!this.state.waiting.includes(missionGoer)) return false;
        mission.missionResponses += 1;
        if (missionResponse === "FAIL") mission.fails += 1;

        this.state.waiting = this.state.waiting.filter(player => player !== missionGoer);

        console.log(this.state.waiting);

        if(this.state.waiting.length !== 0) return true;

        const failed = mission.fails >= mission.failsRequired;
        let message = "";
        if (failed) {
            mission.status = "FAILED";
            message = `the mission failed with ${mission.fails} fails`;
        } else {
            mission.status = "PASSED";
            message = `the mission passed with ${mission.fails} fails!`;
        }

        console.log(mission.status);

        this.state.order.forEach((player) => {
            this.state.messages.set(player, message);
        });

        this.nextEvent();
        return true;
    }

    handleLady(lady, ladyTarget){
        const ladyEvent = this.state.events[this.state.eventIdx];
        if (ladyEvent.type !== "LADY" || ladyEvent.status === "DONE") return false;
        if (!this.state.waiting.includes(lady)) return false;
        if (lady === ladyTarget) return false;
        if (!this.state.order.includes(ladyTarget)) return false;

        ladyEvent.status = "DONE";
        const bad = isBad(this.state.playerRoles.get(ladyTarget));
        const message = bad ? `${ladyTarget} is bad` : `${ladyTarget} is good`;
        this.state.messages.set(lady, message);
        this.nextEvent();
        this.state.lady = ladyTarget;
        return true;
    }

    handleAction(name, body, res) {
        console.log(name);
        console.log(body);
        let success = true;
        switch (body.type) {
            case "START":
                success = this.start(name);
                break;
            case "PROPOSAL":
                success = this.handleProposal(name, body.arg);
                break;
            case "VOTE":
                success = this.handleVote(name, body.arg);
                break;
            case "PASSFAIL":
                success = this.handlePassFail(name, body.arg);
                break;
            case "LADY":
                success = this.handleLady(name, body.arg);
                break;
        }
        console.log("next state " + this.state.gameState);
        if (success){
            this.broadcast()
            res.sendStatus(200);            
        } else {
            res.sendStatus(400);
        }

    }

    stateForPlayer(name) {
        if (this.state.gameState === "WAITING") {
            return { 
                host: this.host, 
                players: [ ...this.players.keys() ], 
                state: this.state.gameState
            };
        } else {
            return {
                host: this.host,
                players: this.state.order,
                state: this.state.gameState,
                turnIdx: this.state.turnIdx,
                lady: this.state.lady,
                eventIdx: this.state.eventIdx,
                message: this.state.messages.get(name),
                events: this.state.events,
                waiting: this.state.waiting,
                proposalNum: this.state.proposalNum,
                maxProposals: this.state.maxProposals
            };
        }
    }
};