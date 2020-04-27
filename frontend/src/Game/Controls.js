import React, { Component } from "react";
import auth0Client from "../Auth";
import axios from "axios";
import { withRouter } from "react-router-dom";

const Voting = ({gameState, action, disabled}) => {
	return (
		<div>
			<label> vote here! </label>
			<button onClick={() => action("YES")} disabled={disabled}> vote yes </button>
			<button onClick={() => action("NO")} disabled={disabled}> vote no </button>
		</div>
	);
}

const Mission = ({gameState, action, disabled}) => {
	return (
		<div>
			<label> pass or fail the mission </label>
			<button onClick={() => action("PASS")} disabled={disabled}> pass </button>
			<button onClick={() => action("FAIL")} disabled={disabled}> fail </button>
		</div>
	);
}

const Lady = ({gameState, action, disabled}) => {
	const me = auth0Client.getProfile().nickname;
	const validPlayers = gameState.players.filter((player) => player !== me);
	return (
		<div>
			{ validPlayers.map((player) => (
				<button key={"lady" + player}
						onClick={() => action(player)}
						disabled={disabled}
				> {player} </button>
				))}
		</div>
	);
}

class Proposing extends Component {

	constructor(props){
		super(props);

		const gameState = this.props.gameState;
		const mission = gameState.events[gameState.eventIdx];
		this.mission = mission;

		this.state = {
			proposal: new Set()
		}
	}

	toggle(player){
		if (this.state.proposal.has(player)) {
			this.state.proposal.delete(player);
		} else {

			const numPlayers = this.mission.numPlayers;

			if (this.state.proposal.size < numPlayers){
				this.state.proposal.add(player);
			}
		}
		this.setState({ proposal : this.state.proposal });
	}

	submit(){
		const numPlayers = this.mission.numPlayers;
		if (this.state.proposal.size === numPlayers) {
			this.props.action(Array.from(this.state.proposal));
		}
	}

	render() {
		const gameState = this.props.gameState;
		return (
			<div>
				<p> select { this.mission.numPlayers } players </p>
				{ gameState.players.map((player, idx) => (
					<div key = {idx}>
						<input key = {"checkbox" + idx} type = "checkbox"
							   checked= {this.state.proposal.has(player)}
							   onChange={() => this.toggle(player)}
						/>
						<label key = {"label" + idx}> {player} </label>
					</div>
					))}
				<button disabled = {this.props.disabled}
						onClick = {() => this.submit()}> propose </button>
			</div>
		);
	}
}

class Controls extends Component {

	constructor(props){
		super(props);
		this.state = {
			buttonsDisabled: false
		};
	}

	action(type, arg) {
	    var headers = {
	        "Authorization": `Bearer ${auth0Client.getIdToken()}`
	    };
	    this.setState({ buttonsDisabled : true });
	    axios.post("/api/action", { type, arg }, { headers }).then(() => {
	    	this.setState( {buttonsDisabled : false });
	    })
	}

	leave() {
	    var headers = {
	        "Authorization": `Bearer ${auth0Client.getIdToken()}`
	    };
		this.setState({ buttonsDisabled : true });
		axios.post("/api/leavegame", {}, { headers }).then(() => {
			this.props.history.push("/");
		});
	}

	end() {
	    var headers = {
	        "Authorization": `Bearer ${auth0Client.getIdToken()}`
	    };
		this.setState({ buttonsDisabled : true });
		axios.post("/api/endgame", {}, { headers }).then(() => {
			this.props.history.push("/");
		});
	}

	populateControls(gameState) {
		const nickname = auth0Client.getProfile().nickname;
		const isHost = (nickname === gameState.host);
		let controls = [];
		if (isHost) {
			controls.push(
				<button key = "end" disabled= {this.state.buttonsDisabled }
						onClick = {() => this.end() }
				> 
					end game 
				</button>
			);
		} 
		if (!isHost && gameState.state === "WAITING") {
			controls.push(
				<button key = "leave" disabled={ this.state.buttonsDisabled } 
						onClick = {() => {this.leave()}}
				> 
					leave game 
				</button>
			);
		}
		if (isHost && gameState.state === "WAITING") {
			controls.push(
				<button key = "start" disabled={ this.state.buttonsDisabled } 
						onClick = {() => {this.action("START")}}
				> 
					start game 
				</button>
			);
		}

		const waitingOnMe = gameState.waiting && gameState.waiting.includes(nickname);

		if (waitingOnMe && gameState.state === "PROPOSING") {
			controls.push(<Proposing key = "proposing" 
									 gameState = {gameState}
									 disabled = {this.state.buttonsDisabled}
									 action = {(proposal) => this.action("PROPOSAL", proposal)}
									 />);
		}
		if (waitingOnMe && gameState.state === "VOTING") {
			controls.push(<Voting key = "voting"
								  gameState = {gameState}
								  disabled = {this.state.buttonsDisabled}
								  action = {(vote) => this.action("VOTE", vote)}/>);
		}
		if (waitingOnMe && gameState.state === "MISSION") {
			controls.push(<Mission key = "mission"
								   gameState = {gameState}
								   disabled = {this.state.buttonsDisabled}
								   action = {(passfail) => this.action("PASSFAIL", passfail)}
						  />)
		}
		if (waitingOnMe && gameState.state === "LADYING") {
			controls.push(<Lady key = "ladying"
								gameState = {gameState}
								disabled = {this.state.buttonsDisabled}
								action = {(ladytarget) => this.action("LADY", ladytarget)}
						  />);
		}
		return controls;
	}

	render() {
		let gameState = this.props.gameState;
		let controls = this.populateControls(gameState);
	    return (
	        <div className = "controls">
	            <h4> controls </h4>
	            { controls }
	        </div>
	    );
	}

};



export default withRouter(Controls);
