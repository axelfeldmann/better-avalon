import React from "react";

const Message = ({ gameState }) => {

	if (gameState.message) {
		const msgStr = gameState.message;
		const formatted = msgStr.split("\n").map((t, i) => (
			<div key={i}> {t} </div>
		));
	    return (
	        <div className = "card text-white bg-info mb-1">
	            <div className="card-body">
	            	<h5 className="card-title"> Last Update </h5>
	            	{ formatted }
	            </div>
	        </div>
	    );
	} else {
		return (<div></div>)
	}
};

export default Message;
