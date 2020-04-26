import React from "react";
import auth0Client from "../Auth";

const Message = ({ gameState }) => {
	if (gameState.message) {
	    return (
	        <div className = "message">
	        	<h4> message </h4>
	            <p> { gameState.message } </p>
	        </div>
	    );
	} else {
		return (<div> no message </div>)
	}
};

export default Message;
