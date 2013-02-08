Sim.KalmanLocalizer = function() {
    this.x = 0.0;
    this.y = 0.0;
    this.orientation = 0.0;
	this.lastInputOrientation = 0.0;
	this.rotationCounter = 0;

	this.filter = null;
	this.processError = 0.0001;
	this.initialCovariance = 0.1;
	this.measurementError = 0.5;

    this.stateTransitionMatrix = null;
    this.controlMatrix = null;
    this.observationMatrix = null;
    this.initialStateEstimate = null;
    this.initialCovarianceEstimate = null;
    this.processErrorEstimate = null;
    this.measurementErrorEstimate = null;
};

Sim.KalmanLocalizer.prototype.init = function(x, y, orientation) {
	this.x = x;
	this.y = y;
	this.orientation = orientation;

	// This is the state transition vector, which represents part of the kinematics.
	//   x(n+1) = x(n) + vx(n)
	//   y(n+1) =                y(n) + vy(n)
	//   vx(n+1) =       0.25vx(n)
	//   vy(n+1) =                      0.25vy(n)
	//   o(n+1) =                                  0.25o(n)
	/*this.stateTransitionMatrix = $M([
		[1.00, 0.00, 1.00, 0.00, 0.00], // x
		[0.00, 1.00, 0.00, 1.00, 0.00], // y
		[0.00, 0.00, 0.25, 0.00, 0.00], // Vx
		[0.00, 0.00, 0.00, 0.25, 0.00], // Vy
		[0.00, 0.00, 0.00, 0.00, 0.25]  // orientation
	]);*/

	this.velocityPreserve = 0.5;

	this.stateTransitionMatrix = $M([
		[1.00, 0.00, 1.00, 0.00, 0.00], // x
		[0.00, 1.00, 0.00, 1.00, 0.00], // y
		[0.00, 0.00, this.velocityPreserve, 0.00, 0.00], // Vx
		[0.00, 0.00, 0.00, this.velocityPreserve, 0.00], // Vy
		[0.00, 0.00, 0.00, 0.00, 1.00]  // orientation
	]);

	// The control matrix
	/*this.controlMatrix = $M([
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0]
	]);*/
	// Vx' = 0.25 * Vx + 0.75 * Vx''
	// Vy' = 0.25 * Vy + 0.75 * Vy''
	this.controlMatrix = $M([
		[0.00, 0.00, 0.00, 0.00, 0.00],
		[0.00, 0.00, 0.00, 0.00, 0.00],
		[0.00, 0.00, 1.0 - this.velocityPreserve, 0.00, 0.00],
		[0.00, 0.00, 0.00, 1.0 - this.velocityPreserve, 0.00],
		[0.00, 0.00, 0.00, 0.00, 1.00]
	]);

	// Observation matrix is the identity matrix, since we can get direct measurements of all values.
	this.observationMatrix = $M([
		[1, 0, 0, 0, 0],
		[0, 1, 0, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 0, 1, 0],
		[0, 0, 0, 0, 1]
	]);

	// Our guess of the initial state.
	this.initialStateEstimate = $M([
		[x],
		[y],
		[0], // start velocity x
		[0], // start velocity y,
		[orientation]
	]);

	// @TODO Use different values for position, velocity, omega
	this.initialCovarianceEstimate = $M([
		[this.initialCovariance, 0, 0, 0, 0], // x
		[0, this.initialCovariance, 0, 0, 0], // y
		[0, 0, this.initialCovariance, 0, 0], // Vx
		[0, 0, 0, this.initialCovariance, 0], // Vy
		[0, 0, 0, 0, this.initialCovariance]  // omega
	]);

	this.processErrorEstimate = $M([
		[this.processError, 0, 0, 0, 0], // x
		[0, this.processError, 0, 0, 0], // y
		[0, 0, this.processError, 0, 0], // Vx
		[0, 0, 0, this.processError, 0], // Vy
		[0, 0, 0, 0, this.processError]  // omega
	]);

	this.measurementErrorEstimate = $M([
		[this.measurementError, 0, 0, 0, 0], // x
		[0, this.measurementError, 0, 0, 0], // y
		[0, 0, this.measurementError, 0, 0], // Vx
		[0, 0, 0, this.measurementError, 0], // Vy
		[0, 0, 0, 0, this.measurementError]  // omega
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

Sim.KalmanLocalizer.prototype.move = function(
	x, y, orientation,
	cmdVelocityX, cmdVelocityY, cmdOmega,
	odoVelocityX, odoVelocityY, odoOmega,
	dt
) {
	var originalOrientation = orientation,
		jumpThreshold = 0.1;

	if (orientation < jumpThreshold && this.lastInputOrientation > Sim.Math.TWO_PI - jumpThreshold) {
		this.rotationCounter++;

		console.log('jump forward', 'last', this.lastInputOrientation, 'current', orientation, 'new', orientation + Sim.Math.TWO_PI * this.rotationCounter);
	} else if (orientation > Sim.Math.TWO_PI - jumpThreshold && this.lastInputOrientation < jumpThreshold) {
		this.rotationCounter--;

		console.log('jump back', 'last', this.lastInputOrientation, 'current', orientation, 'new', orientation + Sim.Math.TWO_PI * this.rotationCounter);
	}

	orientation = orientation + this.rotationCounter * Sim.Math.TWO_PI;

	var globalCmdVelocityX = (cmdVelocityX * Math.cos(this.orientation) - cmdVelocityY * Math.sin(this.orientation)) * dt,
		globalCmdVelocityY = (cmdVelocityX * Math.sin(this.orientation) + cmdVelocityY * Math.cos(this.orientation)) * dt,
		globalOdoVelocityX = (odoVelocityX * Math.cos(this.orientation) - odoVelocityY * Math.sin(this.orientation)) * dt,
		globalOdoVelocityY = (odoVelocityX * Math.sin(this.orientation) + odoVelocityY * Math.cos(this.orientation)) * dt,
		controlVector = $M([
			[0],
			[0],
			[globalCmdVelocityX],
			[globalCmdVelocityY],
			[cmdOmega * dt]
		]),
		measurementVector = $M([
			[x],
			[y],
			[globalOdoVelocityX],
			[globalOdoVelocityY],
			[orientation]
		]),
		state;

	this.filter.predict(controlVector);
	this.filter.observe(measurementVector);
	//this.filter.update();

	state = this.filter.getStateEstimate();

	// tarvis abs nurgba mürast vaatlemist
	// x
	// y
	// vx
	// vy
	// theta
	// omega

	this.x = state.e(1, 1);
	this.y = state.e(2, 1);
	this.orientation = state.e(5, 1)/* % Sim.Math.TWO_PI*/;

	// @TODO Both Kalman and Particle filter mess up around 360 > 0

	this.lastInputOrientation = originalOrientation;
};

Sim.KalmanLocalizer.prototype.getPosition = function() {
    return {
        x: this.x,
        y: this.y,
        orientation: this.orientation
    };
};