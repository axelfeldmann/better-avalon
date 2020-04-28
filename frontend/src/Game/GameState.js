import React from "react";
import auth0Client from "../Auth";

const Players = ({ state, players, turnIdx }) => {
	let desc = "";
	if (state === "WAITING") {
		desc = "Players Present"
	} else {
		const cur = players[turnIdx];
		const next = players[(turnIdx + 1) % players.length];
		desc = `It is ${cur}'s turn, and ${next} is next.`
	}
	return (
		<div className="card mb-1">
			<div className="card-header bg-secondary"> {desc} </div>	
			<ul className="list-group list-group-flush">
				{ players.map((name, idx) => {
					const className = (idx === turnIdx) ? "list-group-item font-weight-bold" : "list-group-item";
					return (
						<li className={className} key={name}>
							<span className="list-group-item-action font-weight-light"> { idx + 1 }. </span> {name} 
						</li>
					);
				})}
			</ul>
		</div>
	);
};

const Mission = ({ event, active, totalPlayers, idx }) => {
	const { votesReceived, fails, missionResponses, numPlayers, status, failsRequired } = event;
	let missionDesc = `${numPlayers} player, ${failsRequired} fail required`;

	let statusStr = "";
	switch (status) {
		case "NONE":
			if (active) {
				statusStr = "Being proposed";
			}
			break;
		case "VOTING":
			statusStr = `Received ${votesReceived}/${totalPlayers} votes`;
			break;
		case "HAPPENING":
			statusStr = `Received ${missionResponses}/${numPlayers} responses`;
			break;
		case "FAILED":
			statusStr = `Failed with ${fails} fails`;
			break;
		case "PASSED":
			statusStr = `Passed with ${fails} fails`;
			break;
		default:
			break;
	}
	const className = active ? "font-weight-bold" : "";
	return (<tr className = {className}>
				<td>{idx + 1}</td>
				<td>{missionDesc}</td>
				<td>{statusStr}</td>
			</tr>);
};

const Lady = ({ event, active }) => {
	return (
		<div> lady </div>
	);
};

const Event = ({ event, active, totalPlayers, idx }) => {
	if (event.type === "MISSION") {
		return (<Mission event = { event } active = { active } totalPlayers = {totalPlayers} idx = {idx}/>)
	} else {
		return (<Lady event = { event } active = { active }/>)
	}
};



const Events = ({ events, eventIdx, totalPlayers }) => {
	if (events) {
		return (
			<div className="card mb-1">
				<div className="card-header bg-secondary"> Missions </div>
				<div className="card-body">
				<table className="table table-condensed mb-0">
					<thead>
						<tr>
							<th scope="col"> Mission </th>
							<th scope="col"> Description </th>
							<th scope="col"> Status </th>
						</tr>
					</thead>
					<tbody>
						 { events.map((event, idx) => <Event event = {event} 
 									key = {idx}
 									active = { eventIdx === idx }
 									totalPlayers = {totalPlayers} 
 									idx = {idx}
 								/>)}
					</tbody>
				</table>
				</div>
			</div>
		);
	} else {
		return <div></div>
	}
};

const Banner = ({ gameState }) => {
	const me = auth0Client.getProfile().nickname;
	let message = "";
	switch (gameState.state) {
		case "WAITING":
			if (gameState.host === me) {
				message = "Start the game when you're ready."
			} else {
				message = "Waiting for the host to start the game.";
			}
			break;
		case "PROPOSING": {
			const proposer = gameState.players[gameState.turnIdx];
			const mission = gameState.events[gameState.eventIdx];
			const { proposalNum, maxProposals } = gameState;
			const { numPlayers, failsRequired } = mission;
			let commonDesc = `a ${numPlayers}-person ${failsRequired}-fail mission. Proposal ${proposalNum}/${maxProposals}.`;
			if (gameState.waiting.includes(me)) {
				message = "Your turn to propose " + commonDesc;
			} else {
				message = `${proposer}'s turn to propose ` + commonDesc;
			}
			break;
		}
		case "VOTING": {
			const mission = gameState.events[gameState.eventIdx];
			const { votesReceived } = mission;
			const proposer = gameState.players[gameState.turnIdx];
			if (gameState.waiting.includes(me)) {
				message = `Please vote on ${proposer}'s proposal.`;
			} else {
				const totalVotes = gameState.players.length;
				const missingVotes = totalVotes - votesReceived;
				message = `Waiting for ${missingVotes}/${totalVotes} votes on ${proposer}'s proposal.`
			}
			break;
		}
		case "MISSION": {
			const mission = gameState.events[gameState.eventIdx];
			const { missionResponses, numPlayers } = mission;
			const missingResponses = numPlayers - missionResponses;
			if (gameState.waiting.includes(me)) {
				message = `Please pass or fail the mission.`;
			} else {
				message = `Waiting for ${missingResponses}/${numPlayers} mission responses.`;
			}
			break;
		}
		default:
	}
	return (
		<div className="card mb-1">
			<div className="card-body">
				<h5 className="card-title"> Current game state </h5>
				<p className="card-text">{message}</p>
			</div>
		</div>
	);

};

const GameState = ({ gameState }) => {
    return (
        <div>
            <Banner gameState = {gameState}/>
            <Players players = {gameState.players} turnIdx = {gameState.turnIdx} state = {gameState.state} />
            <Events events = {gameState.events} eventIdx = {gameState.eventIdx} 
            		totalPlayers = {gameState.players.length}/>
        </div>
    );
};

export default GameState;
