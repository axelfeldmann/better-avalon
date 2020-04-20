import React, { Component } from "react";
import axios from "axios";
import auth0Client from "../Auth";
import { withRouter } from "react-router-dom";
import { EventSourcePolyfill } from 'event-source-polyfill';
import GameDisplay from "./GameDisplay";
import Controls from "./Controls";

class Game extends Component {

    constructor(props) {
        super(props);
        
        var headers = {
            "Authorization": `Bearer ${auth0Client.getIdToken()}`
        };

        this.eventSource = new EventSourcePolyfill("http://localhost:8081/mygame", { headers });

        this.state = {
            gameState: null
        };
    }

    updateGameState(gameState) {
        this.setState(Object.assign({}, { gameState }));
    }

    componentDidMount() {
        this.eventSource.onmessage = (event) => {
            this.updateGameState(JSON.parse(event.data));
        }
    }

    renderGame() {
        const { gameState } = this.state;
        console.log(gameState);
        return (
            <div className = "game">
                <h2 className = "title"> { gameState.host }'s game </h2>
                <Controls gameState = { gameState }/>
                <GameDisplay gameState = { gameState }/>
            </div>
        );
    }

    render() {
        return (
            <div className="container">
                { this.state.gameState === null
                    ? <p> loading game state... </p>
                    : this.renderGame() }
            </div>
        );
    }
}
export default withRouter(Game);
