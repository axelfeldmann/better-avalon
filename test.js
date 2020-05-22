
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

function roleSees(my_role, playerRoles) {

	let role_sight_list = {
	    "Merlin":  ["Morgana", "Bad Lancelot", "Oberon", "Broberon", "Bad Townie", "Dean Kamen"],
	    "Morgana": ["Bad Lancelot", "Bad Townie", "Mordred"],
	    "Mordred": ["Morgana", "Bad Lancelot", "Bad Townie"],
	    "Bad Lancelot": ["Mordred", "Morgana", "Bad Townie"],
	    "Bad Townie": ["Mordred", "Morgana", "Bad Lancelot"],
	    "Oberon": ["Broberon"],
	    "Percival": ["Merlin", "Morgana"],
	    "Guinevere": ["Good Lancelot", "Bad Lancelot"],
	}

	if(my_role=="Ferlin") {
		let merlin_sees = roleSees("Merlin", playerRoles).length
		let roles = playerRoles.filter((role) => role !== "Ferlin")
		shuffle(roles)
		return roles.slice(0, merlin_sees)
	}

	my_role_sight_list = role_sight_list[my_role]

	if(my_role_sight_list === undefined) {
		return []
	}

	return my_role_sight_list.filter((role) => playerRoles.includes(role))

}


playerRoles = ["Merlin", "Morgana", "Percival", "Mordred", "Guinevere", "Bad Lancelot", "Good Lancelot", "Ferlin"]


playerRoles.forEach((role) => {
	console.log(role)
	console.log(roleSees(role, playerRoles))
})

/*
console.log("Merlin:")
console.log(roleSees("Merlin", playerRoles))

console.log("Ferlin:")
console.log(roleSees("Ferlin", playerRoles))






console.log(seen_roles)
seen_roles = seen_roles.filter((other_role) => {
    return playerRoles.includes(other_role);} )
console.log(seen_roles)
*/

