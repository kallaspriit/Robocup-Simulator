Sim.KalmanLocalizer = function() {
    this.x = 0.0;
    this.y = 0.0;
    this.orientation = 0.0;

	this.processError = 0.1;
	this.measurementError = 0.1;

    this.stateTransitionMatrix = null;
    this.controlMatrix = null;
    this.observationMatrix = null;
    this.initialStateEstimate = null;
    this.initialCovarianceEstimate = null;
    this.processErrorEstimate = null;
    this.measurementErrorEstimate = null;
    this.filter = null;
};

Sim.KalmanLocalizer.prototype.init = function(x, y, orientation) {
	this.orientation = orientation;

	// This is the state transition vector, which represents part of the kinematics.
	//   x(n+1) = x(n) + vx(n)
	//   y(n+1) =                y(n) + vy(n)
	//   vx(n+1) =       vx(n)
	//   vy(n+1) =                      vy(n)
	this.stateTransitionMatrix = $M([
		[1, 0, 1, 0],
		[0, 1, 0, 1],
		[0, 0, 1, 0],
		[0, 0, 0, 1]
	]);

	// The control matrix
	this.controlMatrix = $M([
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0]
	]);

	// Observation matrix is the identity matrix, since we can get direct measurements of all values.
	this.observationMatrix = $M([
		[1, 0, 0, 0],
		[0, 1, 0, 0],
		[0, 0, 1, 0],
		[0, 0, 0, 1]
	]);

	// Our guess of the initial state.
	this.initialStateEstimate = $M([
		[x],
		[y],
		[0], // start velocity x
		[0] // start velocity y
	]);

	this.initialCovariance = 1.0;
	this.initialCovarianceEstimate = $M([
		[this.initialCovariance, 0, 0, 0],
		[0, this.initialCovariance, 0, 0],
		[0, 0, this.initialCovariance, 0],
		[0, 0, 0, this.initialCovariance]
	]);

	this.processErrorEstimate = $M([
		[this.processError, 0, 0, 0],
		[0, this.processError, 0, 0],
		[0, 0, this.processError, 0],
		[0, 0, 0, this.processError]
	]);

	this.measurementErrorEstimate = $M([
		[1.0 * this.measurementError, 0, 0, 0],
		[0, 1.0 * this.measurementError, 0, 0],
		[0, 0, 1.0 * this.measurementError, 0],
		[0, 0, 0, 1.0 * this.measurementError]
	]);

	this.filter = new LinearKalmanFilter(
		this.stateTransitionMatrix,
		this.controlMatrix,
		this.observationMatrix,
		this.initialStateEstimate,
		this.initialCovarianceEstimate,
		this.processErrorEstimate,
		this.measurementErrorEstimate
	);
};

Sim.KalmanLocalizer.prototype.setPosition = function(x, y, orientation) {
    this.init(x, y, orientation);
};

Sim.KalmanLocalizer.prototype.move = function(x, y, orientation, velocityX, velocityY, omega, dt) {
	var globalVelocityX = (velocityX * Math.cos(this.orientation) - velocityY * Math.sin(this.orientation)) * dt,
		globalVelocityY = (velocityX * Math.sin(this.orientation) + velocityY * Math.cos(this.orientation)) * dt,
		controlVector = $M([
			[0],
			[0],
			[0],
			[0]
		]),
		measurementVector = $M([
			[x],
			[y],
			[globalVelocityX],
			[globalVelocityY]
		]),
		state;

	this.filter.predict(controlVector);
	this.filter.observe(measurementVector);
	this.filter.update();

	state = this.filter.getStateEstimate();

	this.x = state.e(1, 1);
	this.y = state.e(2, 1);
	this.orientation = (this.orientation + omega * dt) % (Math.PI * 2.0);
};

Sim.KalmanLocalizer.prototype.getPosition = function() {
    return {
        x: this.x,
        y: this.y,
        orientation: this.orientation
    };
};