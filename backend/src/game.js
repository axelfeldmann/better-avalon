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

function getRoles(numPlayers){
    switch(numPlayers){
        case 1:
            return ["Merlin"];
        case 2:
            return getRoles(1).concat(["Morgana"]);
        case 3:
            return getRoles(2).concat(["Percival"]);
        case 4:
            return getRoles(3).concat(["Townie"]);
        case 5:
            return getRoles(4).concat(["Mordred"]);
        case 6:
            return getRoles(5).concat(["Townie"]);
        case 7:
            return ["Merlin", "Morgana", "Percival", "Mordred", "Guinevere", "Bad Lancelot", "Good Lancelot"];
        case 8:
            return getRoles(7).concat(["Townie"]);
        case 9:
            return getRoles(8).concat(["Oberon"]);
        case 10:
            return getRoles(9).concat(["Townie"]);
        case 11:
            return getRoles(10).concat(["Dean Kamen"]);
        case 12:
            return getRoles(11).concat(["Broberon"]);
        case 13:
            return getRoles(12).concat(["Townie"]);
        case 14:
            return getRoles(13).concat(["Bad Townie"]);
        case 15:
            return getRoles(14).concat(["Townie"]);
        default:
            return undefined;
    }
}

function mission(numPlayers, failsRequired) {
    return {
        type: "MISSION",
        numPlayers: numPlayers,
        status: "NONE",
        failsRequired: failsRequired
    };
}

const oneFail = (numPlayers) => mission(numPlayers, 1);
const twoFail = (numPlayers) => mission(numPlayers, 2);

function generateEvents(numPlayers) {
    switch(numPlayers){
        case 1:
            return [oneFail(1), oneFail(1), oneFail(1)];
        case 2:
            return [oneFail(1), oneFail(2), oneFail(2)];
        case 3:
            return [oneFail(1), oneFail(2), oneFail(2)];
        case 4:
            return [oneFail(1), oneFail(2), oneFail(2), oneFail(3), oneFail(3)];
        case 5:
            return [oneFail(1), oneFail(2), oneFail(2), twoFail(3), oneFail(3)];
        case 6:
            return [oneFail(2), oneFail(3), oneFail(3), twoFail(4), oneFail(4)];
        case 7:
            return [oneFail(2), oneFail(3), oneFail(3), twoFail(4), oneFail(4)];
        case 8:
            return [oneFail(3), oneFail(4), oneFail(4), twoFail(5), oneFail(5)];
        case 9:
            return [oneFail(3), oneFail(4), oneFail(4), twoFail(5), oneFail(5)];
        case 10:
            return [oneFail(3), oneFail(4), oneFail(4), twoFail(5), oneFail(5)];
        case 11:
            return [oneFail(4), oneFail(5), oneFail(5), twoFail(6), oneFail(6)];
        case 12:
            return [oneFail(4), oneFail(5), oneFail(5), twoFail(6), oneFail(6)];
        case 13:
            return [oneFail(4), oneFail(5), oneFail(5), twoFail(6), oneFail(6), twoFail(7), oneFail(7)];
        case 14:
            return [oneFail(4), oneFail(5), oneFail(5), twoFail(6), oneFail(6), twoFail(7), oneFail(7)];
        case 15:
            return [oneFail(4), oneFail(5), oneFail(5), twoFail(6), oneFail(6), twoFail(7), oneFail(7)];
        default:
            return undefined;
    }
}

function roleSees(role){
    switch(role){
        case "Merlin":
            return ["Morgana", "Bad Lancelot", "Oberon", "Broberon", "Bad Townie", "Dean Kamen"];
        case "Morgana":
            return ["Bad Lancelot", "Bad Townie", "Mordred"];
        case "Mordred":
            return ["Morgana", "Bad Lancelot", "Bad Townie"];
        case "Bad Lancelot":
            return ["Mordred", "Morgana", "Bad Townie"];
        case "Bad Townie":
            return ["Mordred", "Morgana", "Bad Lancelot"];
        case "Oberon":
            return ["Broberon"];
        case "Percival":
            return ["Merlin", "Morgana"];
        case "Guinevere":
            return ["Good Lancelot", "Bad Lancelot"];
        default:
            return [];
    }
}

class Nicknames {
    constructor(){
        this.toNickname = new Map();
        this.toUsername = new Map();
    }

    setNickname(username, nickname){
        this.toNickname.set(username, nickname);
        this.toUsername.set(nickname, username);
    }

    getNickname(username){
        const nickname = this.toNickname.get(username);
        return nickname;
    }

    getUsername(nickname){
        const username = this.toUsername.get(nickname);
        return username;
    }

    deleteNickname(username){
        const nickname = this.toNickname.get(username);
        this.toNickname.delete(username);
        this.toUsername.delete(nickname);
    }

}

function isBad(role) {
    const badPeople = ["Morgana", "Mordred", "Bad Lancelot", "Oberon", "Broberon", "Bad Townie"];
    return badPeople.includes(role);
}

function keepalive(player) {
    if (player.con) {
        send(player.con, { type : "keepalive"});
        setTimeout(() => keepalive(player), 40000);
    }
}


module.exports = class Game {
    constructor(host, nickname) {
        this.host = host;
        this.players = new Map();
        this.state = { gameState : "WAITING" };
        this.nicknames = new Nicknames();
        this.state.waiting = [ host ];
    }

    validNickname(nickname){
        return (nickname.length) > 4 && (nickname.length < 15);
    }

    addPlayer(name, nickname) {
        if (!this.validNickname(nickname)){
            return false;
        }
        if (this.state.gameState != "WAITING") {
            return false;
        }
        if (this.nicknames.getUsername(nickname)){
            return false;
        }

        assert(!this.nicknames.getNickname(name));

        this.nicknames.setNickname(name, nickname);

        this.players.set(name, { con: null });
        this.broadcast();
        return true;
    }

    removePlayer(name) {
        assert(this.players.has(name));
        if (this.host === name) {
            return false;
        }
        this.nicknames.deleteNickname(name);
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
        setTimeout(() => keepalive(player), 40000);
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
        const numPlayers = this.players.size;
        return generateEvents(numPlayers);
    }

    assignRoles() {
        let roles = getRoles(this.players.size);
        shuffle(roles);
        let roleMap = new Map();
        let i = 0;
        this.players.forEach((playerObj, name) => {
            roleMap.set(name, roles[i++]);
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
        const roles = this.assignRoles();
        const events = this.generateEvents();
        if (!roles) return false;
        if (!events) return false;
        this.state = {
            events: events,
            playerRoles: roles,
            order: order,
            turnIdx: 1 % order.length,
            lady: order[0],
            eventIdx: 0,
            messages: new Map(),
            gameState: "PROPOSING",
            proposalNum: 1,
            maxProposals: [...roles.values()].map(r => isBad(r)).length + 1,
            votersFor: [],
            votersAgainst: []
        };
        this.state.waiting = [ this.state.order[this.state.turnIdx] ];
        this.players.forEach((playerObj, name) => {
            const role = this.state.playerRoles.get(name);
            
            let seenRoles = roleSees(role);
            let seenPlayers = this.state.order.filter((otherPlayer) => {
                const otherPlayerRole = this.state.playerRoles.get(otherPlayer);
                return seenRoles.includes(otherPlayerRole);
            });
            seenPlayers = seenPlayers.map(username => this.nicknames.getNickname(username));
            let seenPlayersStr = (seenPlayers.length > 0) ? seenPlayers.join(", ") : "no one";
            let msg = "Your role is " + role + "\nYou see: " + seenPlayersStr;
            this.state.messages.set(name, msg);
        });
        return true;
    }

    handleProposal(proposer, proposal) {
        proposal = proposal.map(nickname => this.nicknames.getUsername(nickname));
        const turn = this.state.order[this.state.turnIdx];
        if (turn !== proposer || this.state.gameState !== "PROPOSING") return false;
        const mission = this.state.events[this.state.eventIdx];
        if (mission.type !== "MISSION" || mission.status !== "NONE") return false;

        mission.status = "VOTING";
        mission.votesReceived = 0;
        mission.votesFor = 0;
        mission.proposal = proposal;
        this.state.gameState = "VOTING";
        this.state.waiting = [...this.state.order];
        this.state.votersFor = [];
        this.state.votersAgainst = [];

        const proposalStr = "Mission proposal: " + proposal.map((p) => this.nicknames.getNickname(p)).join(", ");
        this.state.order.forEach((player) => {
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
        if (vote === "YES") {
            mission.votesFor += 1;
            this.state.votersFor.push(this.nicknames.getNickname(voter));
        } else {
            this.state.votersAgainst.push(this.nicknames.getNickname(voter));
        }
        this.state.waiting = this.state.waiting.filter(player => player !== voter);

        if(this.state.waiting.length !== 0) { // need more votes
            return true;
        }

        const forStr = this.state.votersFor.join(", ") + ` (${this.state.votersFor.length})`;
        const againstStr = this.state.votersAgainst.join(", ") + ` (${this.state.votersAgainst.length})`;
        const messageStr = `Votes for: ${forStr}\nVotes against: ${againstStr}\n`

        const happening = mission.votesFor > (mission.votesReceived / 2);
        const autoFail = this.state.proposalNum === this.state.maxProposals;
        if (!happening && autoFail) {
            mission.status = "FAILED";
            mission.fails = this.state.order.length;
            this.state.order.forEach((player) => {
                this.state.messages.set(player,
                    messageStr + "This was the last proposal. The mission fails!"
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
                this.state.messages.set(player, messageStr + "The mission is voted down!");
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
                this.state.messages.set(player, messageStr + "The mission is happening!");
            });
            this.state.waiting = [...mission.proposal];
            mission.proposal = mission.proposal.map(p => this.nicknames.getNickname(p));
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

        if(this.state.waiting.length !== 0) return true;

        const failed = mission.fails >= mission.failsRequired;
        let message = "";
        if (failed) {
            mission.status = "FAILED";
            message = `The mission failed with ${mission.fails} fails.`;
        } else {
            mission.status = "PASSED";
            message = `The mission passed with ${mission.fails} fails.`;
        }

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
                players: [ ...this.players.keys() ].map(player => this.nicknames.getNickname(player)), 
                state: this.state.gameState,
                waiting: this.state.waiting
            };
        } else {
            return {
                host: this.host,
                players: this.state.order.map(player => this.nicknames.getNickname(player)),
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
