import React from "react";

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
	const { votesReceived, fails, missionResponses, numPlayers, status, failsRequired, proposal } = event;
	let missionDesc = `${numPlayers} player, ${failsRequired} fail required`;

	let statusStr = "";
	let missionGoers = "";
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
			missionGoers = `${proposal.join(", ")}`;
			break;
		case "FAILED":
			statusStr = `Failed with ${fails} fails`;
			missionGoers = `${proposal.join(", ")}`;
			break;
		case "PASSED":
			statusStr = `Passed with ${fails} fails`;
			missionGoers = `${proposal.join(", ")}`;
			break;
		default:
			break;
	}
	const className = active ? "font-weight-bold" : "";
	return (<tr className = {className}>
				<td>{idx + 1}</td>
				<td>{missionDesc}</td>
				<td>{statusStr}</td>
				<td>{missionGoers}</td>
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
							<th scope="col"> Participants </th>
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

const GameState = ({ gameState }) => {
    return (
        <div>
            <Players players = {gameState.players} turnIdx = {gameState.turnIdx} state = {gameState.state} />
            <Events events = {gameState.events} eventIdx = {gameState.eventIdx} 
            		totalPlayers = {gameState.players.length}/>
        </div>
    );
};

export default GameState;
