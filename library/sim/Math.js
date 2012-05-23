Sim.Math = {};

Sim.Math.round = function(number, decimals) {
	return number.toFixed(decimals);
}

Sim.Math.degToRad = function(degrees) {
	return degrees * Math.PI / 180.0;
}

Sim.Math.radToDeg = function(radians) {
	return radians * 180.0 / Math.PI;
}