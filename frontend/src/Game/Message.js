import React from "react";

const Message = ({ gameState, freshUpdate }) => {

	if (gameState.message) {

		let colors = "text-white bg-info";
		let msgType = gameState.message.type;

		if (freshUpdate) {
			colors = "text-white bg-warning";
		} else if (msgType === "FAILED") {
			colors = "text-white bg-danger";
		} else if (msgType === "PASSED") {
			colors = "text-white bg-success";
		}

		const msgStr = gameState.message.text;
		const formatted = msgStr.split("\n").map((t, i) => (
			<div key={i}> {t} </div>
		));
	    return (
	        <div className = {"card mb-1 " + colors}>
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
