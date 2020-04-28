import React, { Component } from "react";
import auth0Client from "../Auth";
import { withRouter } from "react-router-dom";
import { EventSourcePolyfill } from 'event-source-polyfill';
import GameState from "./GameState";
import Controls from "./Controls";
import Message from "./Message";
import Banner from "./Banner";

class Game extends Component {

    constructor(props) {
        super(props);
        
        var headers = {
            "Authorization": `Bearer ${auth0Client.getIdToken()}`
        };

        // this is terrible but necessary for decent development
        this.eventSource = new EventSourcePolyfill("/api/mygame", { headers });

        this.state = {
            gameState: null
        };
    }

    updateGameState(gameState) {
        this.setState(Object.assign({}, { gameState }));
    }

    componentDidMount() {
        this.eventSource.onerror = (error) => {
            this.props.history.push("/");
        }
        this.eventSource.onmessage = (event) => {
            const json = JSON.parse(event.data);
            this.updateGameState(json);
        }
    }

    componentWillUnmount() {
        this.eventSource.close();
    }

    renderGame() {
        const gameState = this.state.gameState;
        console.log(gameState);
        return (
            <div className = "game">
                <Message gameState = { gameState }/>
                <Banner gameState = {gameState}/>
                <Controls gameState = { gameState }/>
                <GameState gameState = { gameState }/>
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
