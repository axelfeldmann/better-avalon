import React, { Component } from "react";
import auth0Client from "../Auth";
import axios from "axios";
import { withRouter } from "react-router-dom";

const Voting = ({gameState, action, disabled}) => {
	return (
		<div className="btn-group mb-1 d-flex" role="group">
			<button onClick={() => action("YES")} disabled={disabled}
			 className="btn btn-success" type="button"> 
			 	Vote Yes 
			 </button>
			<button onClick={() => action("NO")} disabled={disabled}
			 className="btn btn-danger" type="button">
			 	Vote No
			 </button>
		</div>
	);
}

const Mission = ({gameState, action, disabled}) => {
	return (
		<div className="btn-group mb-1 d-flex" role="group">
			<button onClick={() => action("PASS")} disabled={disabled}
			 className="btn btn-success" type="button"> 
			 	Pass 
			 </button>
			<button onClick={() => action("FAIL")} disabled={disabled}
			 className="btn btn-danger" type="button">
			 	Fail
			 </button>
		</div>
	);
}

function check_ferlin_disabled(props) {
	const no_ferlin = [2, 3, 7];
	const num_players = props.gameState.players.length;
	return no_ferlin.includes(num_players);
}

// In development

class Waiting extends Component {

	constructor(props){
		super(props);
		this.state = {
			ferlin: false
		};
	}

	static getDerivedStateFromProps(props, state) {

		if(check_ferlin_disabled(props)) {
			return {ferlin: false};
		}
		return null;
	}

	toggle(){
		if(!check_ferlin_disabled(this.props)) {
			this.setState({ferlin: !this.state.ferlin});
		}
	}

	render() {
		const ferlinClassName = this.state.ferlin ? "btn btn-success btn-lg mt-1" : "btn btn-light btn-lg mt-1";

		return(
			<div>
				<button key = "ferlin" 
						disabled={this.props.disabled}
						className = {ferlinClassName}
						onClick = {() => {this.toggle()}}> 
			 		Include Ferlin
				</button>

				<button key = "start" 
						disabled={this.props.disabled}
						className = "btn btn-info btn-lg ml-2 mt-1" 
						onClick = {() => this.props.action(this.state.ferlin)}> 
			 		Start Game
				</button>
			</div>
		)
	}
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
				<p> Select { this.mission.numPlayers } players for your mission, then click Propose. </p>
				{ gameState.players.map((player, idx) => {
					const checked = this.state.proposal.has(player);
					const className = checked ? "btn btn-danger mr-1" : "btn btn-light mr-1";
					return (
						<button key = {"checkbox" + idx}
							   onClick={() => this.toggle(player)}
							   className={className}> {player} </button>
					);
				})}
				<button disabled = {this.props.disabled}
						onClick = {() => this.submit()}
						className="btn btn-info"> Propose </button>
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

	getMainControl(me, gameState){
		console.log(gameState);
		const active = gameState.waiting.includes(me);
		if (!active) return undefined;
		switch (gameState.state) {
			case "WAITING":
				return (<Waiting key='waiting'
								gameState = {gameState}
								disabled = {this.state.buttonsDisabled}
								action = {(ferlin) => this.action("START", ferlin)}
						/>);
			case "PROPOSING":
				return (<Proposing key = "proposing" 
								gameState = {gameState}
								disabled = {this.state.buttonsDisabled}
								action = {(proposal) => this.action("PROPOSAL", proposal)}
						/>);
			case "VOTING":
				return (<Voting key = "voting"
								gameState = {gameState}
								disabled = {this.state.buttonsDisabled}
								action = {(vote) => this.action("VOTE", vote)}
						/>);
			case "MISSION":
				return (<Mission key = "mission"
 							   	gameState = {gameState}
 							   	disabled = {this.state.buttonsDisabled}
							   	action = {(passfail) => this.action("PASSFAIL", passfail)}
						 />);
			default:
				return undefined;
		}
	}

	render() {
		let gameState = this.props.gameState;
		const me = auth0Client.getProfile().nickname;
		const isHost = gameState.host === me;
		const leaveButton = (gameState.state === "WAITING" ||
                             gameState.state === "GOODWINS" ||
                             gameState.state === "BADWINS") && !isHost;
		const mainControl = this.getMainControl(me, gameState);
		if (!leaveButton && !mainControl){
			return <div> </div>;
		}
	    return (
	        <div className = "card mb-1">
	        <div className = "card-body">
	        	{ mainControl }
	        	{ leaveButton ? 
	        		<button key = "leave" disabled={ this.state.buttonsDisabled } 
	        			className = "btn btn-info btn-block"
						onClick = {() => {this.leave()}}> 
						Leave Game 
					</button> : <div></div> }
			</div>
	        </div>
	    );
	}

};



export default withRouter(Controls);
