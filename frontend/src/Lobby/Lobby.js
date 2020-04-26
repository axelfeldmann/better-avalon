import React, { Component } from "react";
import axios from "axios";
import auth0Client from "../Auth";
import { withRouter } from "react-router-dom";

class Lobby extends Component {
    constructor(props) {
        super(props);

        this.state = {
            games: null,
            buttonsDisabled: false
        };
    }

    async componentDidMount() {
        var headers = {
            "Authorization": `Bearer ${auth0Client.getIdToken()}`
        };
        await axios.get("/games", { headers }
        )
        .then(response => {
            this.setState({
                games : response.data
            });
        })
        .catch(error => {
            this.props.history.push("/game");
        })

    }

    async newgame() {
        this.setState({
            buttonsDisabled: true
        });
        await axios.post("/newgame", {
        }, {
            headers: { "Authorization": `Bearer ${auth0Client.getIdToken()}` }
        }).then(
            () => this.props.history.push("/game")
        );
    }

    async joingame(host) {
        this.setState({
            buttonsDisabled: true
        });
        await axios.post("/joingame", {
            host : host
        }, {
            headers: { "Authorization": `Bearer ${auth0Client.getIdToken()}` }
        }).then(
            () => this.props.history.push("/game")
        );
    }

    render() {
        return (
            <div className="container">
                <div className="header"> current games: </div>
                { this.state.games === null 
                    ? <p> loading games... </p>
                    : this.state.games.map((game, idx) => 
                        (
                            <div key={idx}> 
                                <button
                                    key={game.host}
                                    onClick={() => this.joingame(game.host)}
                                    disabled={this.state.buttonsDisabled}
                                >
                                    join {game.host}'s game
                                </button>
                            </div>
                        ))
                }
                <button
                    onClick={() => {this.newgame()}}
                    disabled={this.state.buttonsDisabled}
                > 
                    new game 
                </button>
            </div>
        );
    }
}

export default withRouter(Lobby);
