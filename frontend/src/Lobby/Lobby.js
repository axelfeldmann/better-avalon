import React, { Component } from "react";
import axios from "axios";
import auth0Client from "../Auth";
import { withRouter } from "react-router-dom";

class Lobby extends Component {
    constructor(props) {
        super(props);

        this.state = {
            games: null,
            buttonsDisabled: false,
            nickname: "",
            banner: ""
        };
    }

    goodNickname(){
        const n = this.state.nickname.length;
        return (n > 4) && (n < 15);
    }

    async componentDidMount() {
        var headers = {
            "Authorization": `Bearer ${auth0Client.getIdToken()}`
        };
        await axios.get("/api/games", { headers }
        )
        .then(response => {
            this.setState({
                games : response.data
            });
        })
        .catch(error => {
            console.log(error);
            if (error.response.status === 400) {
                this.props.history.push("/game");
            } else {
                this.setState({
                    banner : "could not connect to server"
                });
            }
        })

    }

    async newgame() {
        if (!this.goodNickname()) {
            this.setState({ banner : "invalid nickname"});
            return;
        }
        this.setState({
            buttonsDisabled: true
        });
        await axios.post("/api/newgame", {
            nickname : this.state.nickname
        }, {
            headers: { "Authorization": `Bearer ${auth0Client.getIdToken()}` }
        }).then(
            () => this.props.history.push("/game")
        ).catch(error => {
            console.log(error);
            this.setState({
                banner: "try another nickname",
                nickname: "",
                buttonsDisabled: false
            });
        })
    }

    async joingame(host) {
        if (!this.goodNickname()) {
            this.setState({ banner : "invalid nickname"});
            return;
        }
        this.setState({
            buttonsDisabled: true
        });
        await axios.post("/api/joingame", {
            host : host,
            nickname : this.state.nickname
        }, {
            headers: { "Authorization": `Bearer ${auth0Client.getIdToken()}` }
        }).then(
            () => this.props.history.push("/game")
        ).catch(error => {
            console.log(error);
            this.setState({
                banner: "try another nickname - someone in game already has that one",
                nickname: "",
                buttonsDisabled: false
            });
        })
    }

    update(newText){
        this.setState({ nickname: newText });
    }

    render() {
        return (
            <div className="container">
                <div className="header"> current games: </div>
                <label> { this.state.banner } </label>
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
                <input onChange={(event) => this.update(event.target.value)}/>
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
