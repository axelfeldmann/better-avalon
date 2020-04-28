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
            this.setState({ banner : "Nickname must be 5-14 characters!"});
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
            this.setState({ banner : "Nickname must be 5-14 characters!"});
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
                banner: "Please try another nickname, someone is already using that one.",
                nickname: "",
                buttonsDisabled: false
            });
        })
    }

    update(newText){
        this.setState({ nickname: newText });
    }

    render() {
        if (!this.state.games) {
            return (
                <div className = "container"> 
                    loading... 
                </div>
            );
        } 

        return (
            <div className="container-fluid">
                <div className="page-header"> 
                    <h4> Welcome to Avalon! </h4>
                    <p className = "description"> 
                        Please enter a nickname, then either join a game or create your own. 
                    </p>
                    { this.state.banner ? <div className = "alert alert-primary"> { this.state.banner } </div> : <div></div>}
                </div>
                <div className = "input-group mb-3">
                    <div className="input-group-prepend">
                        <span className="input-group-text">Nickname</span>
                    </div>
                    <input onChange={(event) => this.update(event.target.value)}
                            className="form-control"
                    />
                </div>
                <div>
                    { this.state.games.map((game, idx) => 
                        (
                            <div key={idx}> 
                                <button
                                    className="btn btn-info btn-lg btn-block mt-1"
                                    key={game.host}
                                    onClick={() => this.joingame(game.host)}
                                    disabled={this.state.buttonsDisabled}
                                >
                                    join {game.host}'s game
                                </button>
                            </div>
                        ))}
                    <div>
                        <button
                                className="btn btn-info btn-lg btn-block mt-1"
                                onClick={() => {this.newgame()}}
                                disabled={this.state.buttonsDisabled}> 
                            create my own game 
                        </button>
                    </div>
                </div>

            </div>
        );
    }
}

export default withRouter(Lobby);
