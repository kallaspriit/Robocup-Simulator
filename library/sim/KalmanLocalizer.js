Sim.KalmanLocalizer = function() {
    this.x                          = 0.0;
    this.y                          = 0.0;
    this.orientation                = 0.0;
	this.lastInputOrientation       = 0.0;
	this.rotationCounter            = 0;

	this.processError               = sim.config.kalmanLocalizer.processError;
	this.initialCovariance          = sim.config.kalmanLocalizer.initialCovariance;
	this.measurementError           = sim.config.kalmanLocalizer.measurementError;
	this.velocityPreserve           = sim.config.kalmanLocalizer.velocityPreserve;

	this.filter                     = null;
    this.stateTransitionMatrix      = null;
    this.controlMatrix              = null;
    this.observationMatrix          = null;
    this.initialStateEstimate       = null;
    this.initialCovarianceEstimate  = null;
    this.processErrorEstimate       = null;
	this.measurementErrorEstimate   = null;
};

Sim.KalmanLocalizer.prototype.init = function(x, y, orientation) {
	this.x = x;
	this.y = y;
	this.orientation = orientation;

	// This is the state transition vector, which represents part of the kinematics.
	//   x(n+1) = x(n) + vx(n)
	//   y(n+1) =                y(n) + vy(n)
	//   vx(n+1) =       0.5Vx(n)
	//   vy(n+1) =                      0.5Vy(n)
	//   o(n+1) =                                  o(n)
	this.stateTransitionMatrix = $M([
		[1.00, 0.00, 1.00, 0.00, 0.00], // x
		[0.00, 1.00, 0.00, 1.00, 0.00], // y
		[0.00, 0.00, this.velocityPreserve, 0.00, 0.00], // Vx
		[0.00, 0.00, 0.00, this.velocityPreserve, 0.00], // Vy
		[0.00, 0.00, 0.00, 0.00, 1.0]  // orientation
	]);

	this.controlMatrix = $M([
		[0.00, 0.00, 0.00, 0.00, 0.00],
		[0.00, 0.00, 0.00, 0.00, 0.00],
		[0.00, 0.00, 1.0 - this.velocityPreserve, 0.00, 0.00],
		[0.00, 0.00, 0.00, 1.0 - this.velocityPreserve, 0.00],
		[0.00, 0.00, 0.00, 0.00, 1.0]
	]);

	this.observationMatrix = $M([
		[1, 0, 0, 0, 0],
		[0, 1, 0, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 0, 1, 0],
		[0, 0, 0, 0, 1]
	]);

	this.initialStateEstimate = $M([
		[x],
		[y],
		[0], // start velocity x
		[0], // start velocity y
		[orientation]
	]);

	this.initialCovarianceEstimate = $M([
		[this.initialCovariance, 0, 0, 0, 0],
		[0, this.initialCovariance, 0, 0, 0],
		[0, 0, this.initialCovariance, 0, 0],
		[0, 0, 0, this.initialCovariance, 0],
		[0, 0, 0, 0, this.initialCovariance]
	]);

	this.processErrorEstimate = $M([
		[this.processError, 0, 0, 0, 0],
		[0, this.processError, 0, 0, 0],
		[0, 0, this.processError, 0, 0],
		[0, 0, 0, this.processError, 0],
		[0, 0, 0, 0, this.processError]
	]);

	this.measurementErrorEstimate = $M([
		[this.measurementError, 0, 0, 0, 0],
		[0, this.measurementError, 0, 0, 0],
		[0, 0, this.measurementError, 0, 0],
		[0, 0, 0, this.measurementError, 0],
		[0, 0, 0, 0, this.measurementError]
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
	x, y, orientation, cmdVelocityX, cmdVelocityY, cmdOmega,
	odoVelocityX, odoVelocityY, odoOmega, dt
) {
	var originalOrientation = orientation,
		jumpThreshold = Math.PI / 2;

	if (
		orientation < jumpThreshold
		&& this.lastInputOrientation > Sim.Math.TWO_PI - jumpThreshold
	) {
		this.rotationCounter++;

		//console.log('JUMP FORWARD', this.rotationCounter);
	} else if (
		orientation > Sim.Math.TWO_PI - jumpThreshold
		&& this.lastInputOrientation < jumpThreshold
	) {
		this.rotationCounter--;

		//console.log('JUMP BACKWARD', this.rotationCounter);
	}

	orientation = orientation + this.rotationCounter * Sim.Math.TWO_PI;

	var globalCmdVelocityX = (cmdVelocityX * Math.cos(this.orientation)
			- cmdVelocityY * Math.sin(this.orientation)) * dt,
		globalCmdVelocityY = (cmdVelocityX * Math.sin(this.orientation)
			+ cmdVelocityY * Math.cos(this.orientation)) * dt,
		globalOdoVelocityX = (odoVelocityX * Math.cos(this.orientation)
			- odoVelocityY * Math.sin(this.orientation)) * dt,
		globalOdoVelocityY = (odoVelocityX * Math.sin(this.orientation)
			+ odoVelocityY * Math.cos(this.orientation)) * dt,
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
	state = this.filter.getStateEstimate();
	this.x = state.e(1, 1);
	this.y = state.e(2, 1);
	this.orientation = state.e(5, 1);
	this.lastInputOrientation = originalOrientation;
};

Sim.KalmanLocalizer.prototype.getPosition = function() {
    return {
        x: this.x,
        y: this.y,
        orientation: this.orientation
    };
};