Sim.CartesianError = function() {
	this.measurements = [];
};

Sim.CartesianError.prototype.record = function(measured, real) {
	var error = Sim.Math.getDistanceBetween(measured, real);

	this.measurements.push(error);
};

Sim.CartesianError.prototype.getAverage = function() {
	return Sim.Math.getAverage(this.measurements);
};

Sim.CartesianError.prototype.getStdDev = function() {
	return Sim.Math.getStdDev(this.measurements);
};