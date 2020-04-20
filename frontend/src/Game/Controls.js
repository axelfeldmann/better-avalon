import React, { Component } from "react";
import auth0Client from "../Auth";

async action(type, arg) {
    var headers = {
        "Authorization": `Bearer ${auth0Client.getIdToken()}`
    };
    await axios.post("http://localhost:8081/action", { type, arg }, { headers });
}

const LadyControl = (props) => {
    return (
        <h4> lady control </h4>
    );
};

const ApproveDeny = (props) => {
    return (
        <h4> approve or deny </h4>
    );
};

const PassFail = (props) => {
    return (
        <h4> pass or fail </h4>
    );
};

const Propose = (props) => {
    return (
        <h4> propose a mission </h4>
    );
};

const Controls = { players, status, events, lady, turn, host, waitingOn } => {
    const { nickname } = auth0Client.getProfile();
    const isHost = (nickname === host);
    let controls = [];
    if (isHost && status === "WAITING") {
        controls.push((
            <button onClick = {() => {action("START")}}> 
                start game
            </button>
        ));
    }
    if (isHost) {
        controls.push((
            <button onClick = {() => {action("END")}}>
                end game
            </button>
        ));
    }
    if (!isHost && status === "WAITING") {
        controls.push((
            <button onClick = {() => {action("LEAVE")}}>
                leave game
            </button>
        ));
    }
    const actionRequired = waitingOn.includes(nickname);
    if (actionRequired) {
        switch (status) {
            case "PROPOSING":
                controls.push(
                    <Propose/>
                );
                break;
            case "VOTING":
                controls.push(
                    <ApproveDeny/>
                );
                break;
            case "MISSION":
                controls.push(
                    <PassFail/>
                );
                break;
            case "LADY":
                controls.push(
                    <LadyControl/>
                );
                break;
            default:
                break;
        }
    }
    return (
        <div className = "controls">
            { controls }
        </div>
    );
}

export default Controls;
