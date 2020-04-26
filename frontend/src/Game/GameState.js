import React from "react";
import auth0Client from "../Auth";

const Players = ({ players, turn, lady }) => {
	return (
		<div>
			{ players.map((name) => {
				let playerStr = name;
				if (name === turn) {
					playerStr = "Turn -> " + playerStr;
				}
				if (name === lady) {
					playerStr = "Lady -> " + playerStr;
				}
				return (
					<div key={name}> {playerStr} </div>
				);
			})}
		</div>
	);
};

const Mission = ({ event, active, totalPlayers }) => {
	const activeStr = active ? " <- " : "";
	const { votesFor, votesReceived, fails, missionResponses, numPlayers, status, failsRequired } = event;
	const missionDesc = `${numPlayers}-player ${failsRequired}-fail mission: `
	switch (status) {
		case "NONE":
			return (<div> {missionDesc}, {activeStr} </div>);
		case "VOTING":
			return (<div> {missionDesc}, {votesReceived}/{totalPlayers} votes received</div>);
		case "HAPPENING":
			return (<div> {missionDesc}, {missionResponses}/{numPlayers} responses received </div>);
		case "FAILED":
			return (<div> {missionDesc}, failed with {fails} </div>);
		case "PASSED":
			return (<div> {missionDesc}, passed </div>);
		default:
			return (<div> MISSION </div>);
	}
};

const Lady = ({ event, active }) => {
	return (
		<div> lady </div>
	);
};

const Event = ({ event, active, totalPlayers }) => {
	if (event.type === "MISSION") {
		return (<Mission event = { event } active = { active } totalPlayers = {totalPlayers}/>)
	} else {
		return (<Lady event = { event } active = { active }/>)
	}
};

const Events = ({ events, eventIdx, totalPlayers }) => {
	if (events) {
		return (
			<div>
				<h4> events </h4>
				{ events.map((event, idx) => <Event event = {event} 
													key = {idx}
													active = { eventIdx === idx }
													totalPlayers = {totalPlayers} 
												/>)}
			</div>
		);
	} else {
		return <div> no events yet </div>
	}
};

const GameState = ({ gameState }) => {
	const turn = gameState.players[gameState.turnIdx];
	const lady = gameState.lady;
	let stateString = gameState.state;
	if (gameState.state === "PROPOSING" || gameState.state === "VOTING"){
		stateString += ` proposal (${gameState.proposalNum}/${gameState.maxProposals})`;
	}
    return (
        <div className = "gameState">
            <h4> gameState : { stateString }</h4>
            <Players players = {gameState.players} turn = {turn} lady = {lady} />
            <Events events = {gameState.events} eventIdx = {gameState.eventIdx} 
            		totalPlayers = {gameState.players.length}/>
        </div>
    );
};

export default GameState;
