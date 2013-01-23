Sim.KalmanLocalizer = function() {
    this.x = 0.0;
    this.y = 0.0;
    this.orientation = 0.0;

	this.dt = 60 / 1000;
    this.stateTransitionMatrix = null;
    this.controlMatrix = null;
    this.controlVector = null;
    this.observationMatrix = null;
    this.initialStateEstimate = null;
    this.initialCovarianceEstimate = null;
    this.processErrorEstimate = null;
    this.mc = 0.2;
    this.measurementErrorEstimate = null;
    this.filter = null;
};

Sim.KalmanLocalizer.prototype.init = function(x, y, orientation) {
	this.orientation = orientation;

	// This is the state transition vector, which represents part of the kinematics.
	// 1, ts, 0,  0  =>  x(n+1) = x(n) + vx(n)
	// 0,  1, 0,  0  => vx(n+1) =        vx(n)
	// 0,  0, 1, ts  =>  y(n+1) =              y(n) + vy(n)
	// 0,  0, 0,  1  => vy(n+1) =                     vy(n)
	// Remember, acceleration gets added to these at the control vector.
	/*this.stateTransitionMatrix = new Math.Matrix4x4(
		1, this.dt, 0, 0, // dt or just 1?
		0, 1, 0, 0,
		0, 0, 1, this.dt,
		0, 0, 0, 1
	);*/
	this.stateTransitionMatrix = new Math.Matrix4x4(
		1, 1, 0, 0, // dt or just 1?
		0, 1, 0, 0,
		0, 0, 1, 1,
		0, 0, 0, 1
	);

	// The control vector, which adds acceleration to the kinematic equations.
	// 0          =>  x(n+1) =  x(n+1)
	// 0          => vx(n+1) = vx(n+1)
	// -9.81*ts^2 =>  y(n+1) =  y(n+1) + 0.5*-9.81*ts^2
	// -9.81*ts   => vy(n+1) = vy(n+1) + -9.81*ts
	/*this.controlMatrix = new Math.Matrix4x4(
		0, 0, 0, 0,
		0, 0, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	);
	this.controlVector = new Math.Matrix4x1(
		0,
		0,
		0.5 * gravity * this.dt * this.dt,
		gravity * this.dt
	);*/
	this.controlMatrix = new Math.Matrix4x4(
		0, 0, 0, 0,
		0, 0, 0, 0,
		0, 0, 0, 0,
		0, 0, 0, 0
	);
	this.controlVector = new Math.Matrix4x1(
		0,
		0,
		0,
		0
	);

	// After state transition and control, here are the equations:
	//  x(n+1) = x(n) + vx(n)
	// vx(n+1) = vx(n)
	//  y(n+1) = y(n) + vy(n) - 0.5*9.81*ts^2
	// vy(n+1) = vy(n) + -9.81*ts
	// Which, if you recall, are the equations of motion for a parabola.  Perfect.

	// Observation matrix is the identity matrix, since we can get direct
	// measurements of all values in our example.
	this.observationMatrix = new Math.Matrix4x4(
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	);

	// This is our guess of the initial state.  I intentionally set the Y value
	// wrong to illustrate how fast the Kalman filter will pick up on that.
	this.initialStateEstimate = new Math.Matrix4x1(
		x,
		0, // start velocity x
		y,
		0 // start velocity y
	);
	this.initialCovarianceEstimate = new Math.Matrix4x4(
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	);
	this.processErrorEstimate = new Math.Matrix4x4(
		0, 0, 0, 0,
		0, 0, 0, 0,
		0, 0, 0, 0,
		0, 0, 0, 0
	);
	this.mc = 0.2;
	this.measurementErrorEstimate = new Math.Matrix4x4(
		1.0 * this.mc, 0, 0, 0,
		0, 1.0 * this.mc, 0, 0,
		0, 0, 1.0 * this.mc, 0,
		0, 0, 0, 1.0 * this.mc
	);

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
	var state = this.filter.getStateEstimate(),
		globalVelocityX = (velocityX * Math.cos(this.orientation) - velocityY * Math.sin(this.orientation)) * dt,
		globalVelocityY = (velocityX * Math.sin(this.orientation) + velocityY * Math.cos(this.orientation)) * dt;

	this.x = state.a11;
	this.y = state.a31;
	this.orientation = (this.orientation + omega * dt) % (Math.PI * 2.0);

	var measurementVector = new Math.Matrix4x1(
		x,
		globalVelocityX,
		y,
		globalVelocityY
	);

	this.filter.step(
		this.controlVector,
		measurementVector
	);

    /*this.orientation = (this.orientation + omega * dt) % (Math.PI * 2.0);
    this.x += (velocityX * Math.cos(this.orientation) - velocityY * Math.sin(this.orientation)) * dt;
    this.y += (velocityX * Math.sin(this.orientation) + velocityY * Math.cos(this.orientation)) * dt;*/
};

Sim.KalmanLocalizer.prototype.getPosition = function() {
    return {
        x: this.x,
        y: this.y,
        orientation: this.orientation
    };
};