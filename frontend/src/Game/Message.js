import React from "react";

const Message = ({ gameState }) => {

	if (gameState.message) {
		const msgStr = gameState.message;
		const formatted = msgStr.split("\n").map((t, i) => (<p key={i}> {t} </p>));
	    return (
	        <div className = "message">
	        	<h4> message </h4>
	            { formatted }
	        </div>
	    );
	} else {
		return (<div> no message </div>)
	}
};

export default Message;
