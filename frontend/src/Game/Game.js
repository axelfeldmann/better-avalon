import React, { Component } from "react";
import auth0Client from "../Auth";
import { withRouter } from "react-router-dom";
import { EventSourcePolyfill } from 'event-source-polyfill';
import GameState from "./GameState";
import Controls from "./Controls";
import Message from "./Message";
import Banner from "./Banner";
import axios from "axios";
import Sound from "react-sound";

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
        let freshUpdate = (!!this.state.gameState);
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
                <Sound url="boop.mp3" 
                       playStatus={freshUpdate ? Sound.status.PLAYING : Sound.status.STOPPED}
                       onFinishedPlaying={() => this.setState({ freshUpdate: false })}
                       />
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
