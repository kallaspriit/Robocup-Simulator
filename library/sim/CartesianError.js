Sim.CartesianError = function() {
	this.distances = [];
	this.orientations = [];
};

Sim.CartesianError.prototype.record = function(measuredDistance, realDistance, measuredOrientation, realOrientation) {
	this.distances.push(Sim.Math.getDistanceBetween(measuredDistance, realDistance));
	this.orientations.push(Sim.Math.getAngleDiff(measuredOrientation, realOrientation));
};

Sim.CartesianError.prototype.getDistanceAverage = function() {
	return Sim.Math.getAverage(this.distances);
};

Sim.CartesianError.prototype.getDistanceStdDev = function() {
	return Sim.Math.getStdDev(this.distances);
};

Sim.CartesianError.prototype.getOrientationAverage = function() {
	return Sim.Math.getAverage(this.orientations);
};

Sim.CartesianError.prototype.getOrientationStdDev = function() {
	return Sim.Math.getStdDev(this.orientations);
};