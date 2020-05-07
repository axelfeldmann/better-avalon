import React from "react";
import auth0Client from "../Auth";

const Banner = ({ gameState }) => {
	const me = auth0Client.getProfile().nickname;
	let message = "";
	let color = "";
	switch (gameState.state) {
		case "WAITING":
			if (gameState.host === me) {
				message = "Start the game when you're ready.";
				color = "bg-warning text-white";
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
				color = "bg-warning text-white";
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
				color = "bg-warning text-white";
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
				color = "bg-warning text-white";
			} else {
				message = `Waiting for ${missingResponses}/${numPlayers} mission responses.`;
			}
			break;
		}
		case "GOODWINS": {
			message = "Good team wins!";
			break;
		}
		case "BADWINS": {
			message = "Bad team wins!";
			break;
		}
		default:
	}
	return (
		<div className={"card mb-1 " + color }>
			<div className="card-body">
				<h5 className="card-title"> Current game state </h5>
				<p className="card-text">{message}</p>
			</div>
		</div>
	);

};

export default Banner;