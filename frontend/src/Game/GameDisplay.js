import React from "react";
import auth0Client from "../Auth";

const Players = { players, turn, lady } => {
    const { nickname } = auth0Client.getProfile();
    const isTurn = (nickname === turn);
    const isLady = (nickname === lady);
    return (
        <div className = "players">
            <h4> players </h4>
            { players.map(player => (
                <div key = {player}>
                    { isTurn ? "Turn -> " : "" }
                    { player }
                    { isLady ? " <- Lady" : "" }
                </div>
            )) }
        </div>
    );
};

const renderEvent = (event, idx) => {
    const { type, status, numPlayers } = event;
    switch (type) {
        case "MISSION":
            return (
                <div key = {"event" + idx}>
                    { numPlayers } person mission, { status }
                </div>
            );
        case "LADY":
            return (
                <div key = {"event" + idx}>
                    lady , { status }
                </div>
            );
    }
};

const Events = { events } => {
    return (
        <div className = "events">
            <h4> events </h4>
            { events.map((event, idx) => renderEvent(event, idx)) }
        </div>
    );
};

const WaitingOn = { waitingOn } => {
    return (
        <div className = "waitingOn">
            <h4> waiting on </h4>
            { waitingOn.map((player, idx) => (
                <div key = {"waitingOn" +  idx}>
                    { player }
                </div>
            )) }
        </div>
    );
};

const LadyResult = { ladyResult } => {
    if (ladyResult) {
        return (
            <h4> { ladyResult.target } is { ladyResult.team } </h4>
        );
    }
};

const Role = { role } => {
    if (role) {
        return (
            <h4> your role is { role.role }, you see { role.sees } </h4>
        );
    }
};

const GameDisplay = { gameState } => {
    const { players, status, turn, lady, events, waitingOn, role } = gameState;
    return (
        <div className = "gameDisplay">
            <p> status: { status } </p>
            <Role role = {role}/>
            <Players players = {players} turn = { turn } lady = { lady }/>
            <Events events = { events }/>
            <Waiting waitingOn = { waitingOn }/>
            <LadyResult ladyResult = { gameState.ladyResult }>
        </div>
    );
};

export default GameDisplay;
