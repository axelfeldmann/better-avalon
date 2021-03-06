import React, { Component } from "react";
import auth0Client from "../Auth";
import { withRouter } from "react-router-dom";
import { EventSourcePolyfill } from 'event-source-polyfill';
import GameState from "./GameState";
import Controls from "./Controls";
import Message from "./Message";
import Banner from "./Banner";
import axios from "axios";

class Game extends Component {

    constructor(props) {
        super(props);
        
        var headers = {
            "Authorization": `Bearer ${auth0Client.getIdToken()}`
        };

        // this is terrible but necessary for decent development
        this.eventSource = new EventSourcePolyfill("/api/mygame", { headers });
        this.boop = new Audio("boop.mp3");

        this.state = {
            gameState: null
        };
    }

    updateGameState(gameState) {
        let freshUpdate = false;
        if (this.state.gameState) {
            freshUpdate = (this.state.gameState.state !== gameState.state);
        }

        // sus lines, but I got rid of the sound component
        if (freshUpdate) {
            this.boop.play();
            setTimeout(() => this.setState({ freshUpdate: false}), 500);
        }

        this.setState(Object.assign({}, { gameState, freshUpdate }));
    }

    componentDidMount() {
        this.eventSource.onerror = (error) => {
            if (error.status) {
                this.props.history.push("/");
            }
        }
        this.eventSource.onmessage = (event) => {
            const json = JSON.parse(event.data);
            if (json.type !== "keepalive") {
                this.updateGameState(json);
            }
        }
    }

    componentWillUnmount() {
        this.eventSource.close();
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

    renderGame() {
        const freshUpdate = this.state.freshUpdate;
        const gameState = this.state.gameState;
        const isHost = gameState.host === auth0Client.getProfile().nickname;

        return (
            <div className = "container-fluid">
                <Message gameState = { gameState } freshUpdate = { freshUpdate }/>
                <Banner gameState = {gameState}/>
                <Controls gameState = { gameState }/>
                <GameState gameState = { gameState }/>
                { isHost ? 
                    <button key = "leave" disabled={ this.state.buttonsDisabled }
                        className = "btn btn-danger btn-info mt-3 float-right" 
                        onClick = {() => {this.end()}}> 
                        End Game 
                    </button> : <div></div> }
            </div>
        );
    }

    render() {
        return (
            <div className="container-fluid">
                { this.state.gameState === null
                    ? <p> loading game state... </p>
                    : this.renderGame() }
            </div>
        );
    }
}
export default withRouter(Game);
