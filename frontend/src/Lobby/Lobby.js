import React, { Component } from "react";
import axios from "axios";
import auth0Client from "../Auth";

class Lobby extends Component {
    constructor(props) {
        super(props);

        this.state = {
            games: null,
            buttonDisabled: false
        };
    }

    async componentDidMount() {
        var headers = {
            "Authorization": `Bearer ${auth0Client.getIdToken()}`
        };
        const games = (await axios.get("http://localhost:8081/games/",
            { headers }
        )).data;
        console.log(games);
        this.setState({
            games,
        });
    }

    async submit() {
        this.setState({
            buttonDisabled: true
        });
        await axios.post("http://localhost:8081/newgame", {
        }, {
            headers: { "Authorization": `Bearer ${auth0Client.getIdToken()}` }
        });

    }

    render() {
        return (
            <div className="container">
                <div className="header"> current games: </div>
                { this.state.games === null 
                    ? <p> loading games... </p>
                    : this.state.games.map((game, idx) => 
                        (<div key={idx}> {game.host}</div>))
                }
                <button
                    onClick={() => {this.submit()}}
                    disabled={this.state.buttonDisabled}
                > 
                    new game 
                </button>
            </div>
        );
    }
}

export default Lobby;
