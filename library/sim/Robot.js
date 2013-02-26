Sim.Robot = function(
	side,
	x,
	y,
	orientation,
	isSmart,
	options
) {
	this.defaults = {
		orientation: 0,
		mass: 2.5,
		wheelRadius: 0.025,
		wheelOffset: 0.12,
		cameraDistance: 5.0,
		cameraWidth: 8.0,
		kickerForce: 30,
		dribbleAngle: Sim.Math.degToRad(20.0),
		omegaDeviation: 2.5,
		distanceDeviation: 0.01,
		smart: false
	};
	
	this.options = Sim.Util.combine(this.defaults, options);
	
	this.side = side;
	this.x = x;
	this.y = y;
	this.orientation = orientation;
	this.velocityX = 0;
	this.velocityY = 0;
	this.radius = this.options.radius;
	this.mass = this.options.mass;
	this.wheelRadius = this.options.wheelRadius;
	this.wheelOffset = this.options.wheelOffset;
	this.wheelAngles = this.options.wheelAngles;
	this.cameraDistance = this.options.cameraDistance;
	this.cameraWidth = this.options.cameraWidth;
	this.kickerForce = this.options.kickerForce;
	this.dribbleAngle = this.options.dribbleAngle;
	this.omegaDeviation = this.options.omegaDeviation;
	this.distanceDeviation = this.options.distanceDeviation;
	this.smart = isSmart;
	
	this.dribbledBall = null;
	this.targetDir = {x: 0, y: 0};
	this.targetOmega = 0;
	this.dt = 1000 / 60;
	this.commands = [];
	this.perfectLocalization = false;
	this.useController = true;
	
	this.goals = [];
	this.balls = [];
	this.measurements = {};
	
	this.virtualX = x;
	this.virtualY = y;
	this.virtualOrientation = this.orientation;
	this.virtualVelocityX = this.velocityX;
	this.virtualVelocityY = this.velocityY;
	
	if (this.smart) {
		this.vision = new Sim.Vision();
        this.odometerLocalizer = new Sim.OdometerLocalizer();
        this.intersectionLocalizer = new Sim.IntersectionLocalizer();
		this.particleLocalizer = new Sim.ParticleLocalizer(
			sim.config.particleLocalizer.particleCount,
			sim.config.particleLocalizer.forwardNoise,
			sim.config.particleLocalizer.turnNoise,
			sim.config.particleLocalizer.senseNoise
		);
		this.kalmanLocalizer = new Sim.KalmanLocalizer();
		this.cartesianError = {
			odometer: new Sim.CartesianError(),
			intersection: new Sim.CartesianError(),
			particle: new Sim.CartesianError(),
			kalman: new Sim.CartesianError()
		};

		this.ballLocalizer = new Sim.BallLocalizer(
			sim.config.game.balls
		);
	
		// yellow goal
		this.particleLocalizer.addLandmark(
			'yellow-goal-center',
			0,
			sim.config.field.height / 2.0
		);
		/*this.particleLocalizer.addLandmark(
			'yellow-goal-left',
			0,
			sim.config.field.height / 2.0 - sim.config.field.goalWidth / 2.0
		);
		this.particleLocalizer.addLandmark(
			'yellow-goal-right',
			0,
			sim.config.field.height / 2.0 + sim.config.field.goalWidth / 2.0
		);*/

		// blue goal
		this.particleLocalizer.addLandmark(
			'blue-goal-center',
			sim.config.field.width,
			sim.config.field.height / 2.0
		);
		/*this.particleLocalizer.addLandmark(
			'blue-goal-left',
			sim.config.field.width,
			sim.config.field.height / 2.0 - sim.config.field.goalWidth / 2.0
		);
		this.particleLocalizer.addLandmark(
			'blue-goal-right',
			sim.config.field.width,
			sim.config.field.height / 2.0 + sim.config.field.goalWidth / 2.0
		);*/
			
		this.particleLocalizer.init();
		this.resetDeviation();
	}
	
	this.wheelOmegas = [
		0.0, 0.0, 0.0, 0.0
	];

	this.motionModel = new Sim.FourWheelOmniDrive(
		this.wheelRadius,
		this.wheelAngles,
		this.wheelOffset,
		this.x,
		this.y,
		this.orientation
	);
	
	this.cameraFOV = new Sim.Math.Polygon([
		{x: 0, y: 0},
		{x: this.cameraDistance, y: -this.cameraWidth / 2},
		{x: this.cameraDistance, y: this.cameraWidth / 2},
		{x: 0, y: 0},
		{x: -this.cameraDistance, y: -this.cameraWidth / 2},
		{x: -this.cameraDistance, y: this.cameraWidth / 2},
		{x: 0, y: 0}
	]);
	/*this.cameraFrontFOV = new Sim.Math.Polygon([
		{x: 0, y: 0},
		{x: this.cameraDistance, y: -this.cameraWidth / 2},
		{x: this.cameraDistance, y: this.cameraWidth / 2},
		{x: 0, y: 0}
	]);
	this.cameraRearFOV = new Sim.Math.Polygon([
		{x: 0, y: 0},
		{x: -this.cameraDistance, y: -this.cameraWidth / 2},
		{x: -this.cameraDistance, y: this.cameraWidth / 2},
		{x: 0, y: 0}
	]);*/
};

Sim.Robot.prototype.resetDeviation = function() {
	if (!this.smart) {
		return;
	}

	this.odometerLocalizer.setPosition(this.x, this.y, this.orientation);
    this.intersectionLocalizer.setPosition(this.x, this.y, this.orientation);
	this.particleLocalizer.setPosition(this.x, this.y, this.orientation);
	this.kalmanLocalizer.setPosition(this.x, this.y, this.orientation);
};

Sim.Robot.prototype.step = function(dt) {
	this.dt = dt;
	
	if (this.smart) {
		this.updateVision(dt);
		this.updateRobotLocalizer(dt);
		this.updateBallLocalizer(dt);
	}
	
	this.updateMovement(dt);
	this.handleBalls(dt);
	this.handleCommands(dt);

	//this.updateTest(dt);
};

/*Sim.Robot.prototype.updateTest = function(dt) {
	var yellowDistance = null,
		blueDistance = null,
		yellowAngle = null,
		blueAngle = null,
		i,
		goal;

	for (i = 0; i < this.goals.length; i++) {
		goal = this.goals[i];

		if (goal.side == Sim.Game.Side.YELLOW) {
			yellowDistance = goal.distance;
			yellowAngle = goal.angle;
		} else if (goal.side == Sim.Game.Side.BLUE) {
			blueDistance = goal.distance;
			blueAngle = goal.angle;
		}
	}

	var yellowGoalPos = {
			x: 0,
			y: sim.config.field.height / 2
		},
		blueGoalPos = {
			x: sim.config.field.width,
			y: sim.config.field.height / 2
		},
		yellowCircle = new Sim.Math.Circle(yellowGoalPos.x, yellowGoalPos.y, yellowDistance),
		blueCircle = new Sim.Math.Circle(blueGoalPos.x, blueGoalPos.y, blueDistance),
		intersections = yellowCircle.getIntersections(blueCircle);

	sim.dbg.box('Real orientation ' + this.side, Sim.Math.radToDeg(this.orientation), 1);
};*/

Sim.Robot.prototype.togglePerfectLocalization = function() {
	this.perfectLocalization = !this.perfectLocalization;
};

Sim.Robot.prototype.toggleController = function() {
	this.useController = !this.useController;
};

Sim.Robot.prototype.isPerfectLocalization = function() {
	return this.perfectLocalization;
};

Sim.Robot.prototype.hasBall = function() {
	return this.dribbledBall != null;
};

Sim.Robot.prototype.getSide = function() {
	return this.side;
};

Sim.Robot.prototype.getOppositeSide = function() {
	return this.side == Sim.Game.Side.YELLOW ? Sim.Game.Side.BLUE : Sim.Game.Side.YELLOW;
};

Sim.Robot.prototype.getVisibleGoals = function() {
	return this.goals;
};

Sim.Robot.prototype.getVisibleBalls = function() {
	return this.balls;
};

Sim.Robot.prototype.updateVision = function(dt) {
	var i;

	for (i = 0; i < sim.game.balls.length; i++) {
		if (this.side == Sim.Game.Side.YELLOW) {
			sim.game.balls[i]._yellowVisible = false;
		} else {
			sim.game.balls[i]._blueVisible = false;
		}
	}
	
	this.balls = this.vision.getVisibleBalls(this.cameraFOV, this.x, this.y, this.orientation + Math.PI);
	this.goals = this.vision.getVisibleGoals(this.cameraFOV, this.x, this.y, this.orientation);
	this.measurements = this.vision.getMeasurements(this.cameraFOV, this.x, this.y, this.orientation);
	
	for (i = 0; i < this.balls.length; i++) {
		if (this.side == Sim.Game.Side.YELLOW) {
			this.balls[i].ball._yellowVisible = true;
		} else {
			this.balls[i].ball._blueVisible = true;
		}
	}
};

Sim.Robot.prototype.updateRobotLocalizer = function(dt) {
	this.particleLocalizer.update(this.measurements);
	
	this.localizeByOdometer();
	this.localizeByDistances(this.goals);
	//this.localizeByAngles(this.goals);
	this.localizeKalman();

	// record errors
	this.cartesianError.odometer.record(
		{x: this.odometerLocalizer.x, y: this.odometerLocalizer.y},
		{x: this.x, y: this.y}
	);
	this.cartesianError.intersection.record(
		{x: this.intersectionLocalizer.x, y: this.intersectionLocalizer.y},
		{x: this.x, y: this.y}
	);
	this.cartesianError.particle.record(
		{x: this.particleLocalizer.x, y: this.particleLocalizer.y},
		{x: this.x, y: this.y}
	);
	this.cartesianError.kalman.record(
		{x: this.kalmanLocalizer.x, y: this.kalmanLocalizer.y},
		{x: this.x, y: this.y}
	);

	sim.dbg.box('Real orientation ' + this.side, Sim.Math.radToDeg(this.orientation), 1);

	for (var localizer in this.cartesianError) {
		sim.dbg.box(localizer + ' localizer error ' + this.side, Sim.Math.round(this.cartesianError[localizer].getAverage(), 2) + ', std-dev: ' + Sim.Math.round(this.cartesianError[localizer].getStdDev(), 2));
	}
};

Sim.Robot.prototype.updateBallLocalizer = function(dt) {
	this.ballLocalizer.update(
		this.virtualX,
		this.virtualY,
		this.virtualOrientation,
		this.balls,
		this.getVirtualFOV(),
		dt
	);
};

Sim.Robot.prototype.updateMovement = function(dt) {
	this.wheelOmegas = this.motionModel.getWheelOmegas(this.targetDir, this.targetOmega);

	var noisyOmegas = [
		this.wheelOmegas[0] + Sim.Util.randomGaussian(this.omegaDeviation),
		this.wheelOmegas[1] + Sim.Util.randomGaussian(this.omegaDeviation),
		this.wheelOmegas[2] + Sim.Util.randomGaussian(this.omegaDeviation),
		this.wheelOmegas[3] + Sim.Util.randomGaussian(this.omegaDeviation)
	];

	var movement = this.motionModel.getMovement(this.wheelOmegas),
		noisyMovement = this.motionModel.getMovement(noisyOmegas);

	this.orientation = (this.orientation + movement.omega * dt) % Sim.Math.TWO_PI;

	if (this.orientation < 0) {
		this.orientation += Sim.Math.TWO_PI;
	}

	this.velocityX = movement.velocityX * Math.cos(this.orientation) - movement.velocityY * Math.sin(this.orientation),
	this.velocityY = movement.velocityX * Math.sin(this.orientation) + movement.velocityY * Math.cos(this.orientation);

	this.x += this.velocityX * dt;
	this.y += this.velocityY * dt;

	if (sim.config.game.useWalls) {
		Sim.Util.confine(
			this, 
			0,
			sim.config.field.width,
			0,
			sim.config.field.height,
			this.radius
		);
	} else {
		Sim.Util.confine(
			this, 
			0,
			sim.config.field.width,
			0,
			sim.config.field.height,
			this.radius - sim.config.game.robotConfineThreshold
		);
	}
	
	if (this.smart) {
		this.particleLocalizer.move(
			noisyMovement.velocityX,
			noisyMovement.velocityY,
			noisyMovement.omega,
			dt
		);
		this.intersectionLocalizer.move(
			noisyMovement.velocityX,
			noisyMovement.velocityY,
			noisyMovement.omega,
			dt
		);
		this.odometerLocalizer.move(
			noisyMovement.velocityX,
			noisyMovement.velocityY,
			noisyMovement.omega,
			dt
		);

		// input for Kalman
		var pos = this.intersectionLocalizer.getPosition(),
			commandOmegas = this.motionModel.getWheelOmegas(this.targetDir, this.targetOmega),
			commandMovement = this.motionModel.getMovement(commandOmegas);

		this.kalmanLocalizer.move(
			pos.x,
			pos.y,
			pos.orientation,
			commandMovement.velocityX,
			commandMovement.velocityY,
			commandMovement.omega,
			noisyMovement.velocityX,
			noisyMovement.velocityY,
			noisyMovement.omega,
			dt
		);

		if (this.perfectLocalization) {
			this.virtualX = this.x;
			this.virtualY = this.y;
			this.virtualOrientation = this.orientation;

			//sim.dbg.box('Evaluation', 'n/a');
		} else {
			var position = this.particleLocalizer.getPosition(this);

			this.virtualX = position.x;
			this.virtualY = position.y;
			this.virtualOrientation = position.orientation;

			//sim.dbg.box('Evaluation', position.evaluation, 2);
		}
	}
};

Sim.Robot.prototype.localizeByOdometer = function() {

};

Sim.Robot.prototype.localizeByDistances = function(goals) {
	var yellowDistance = null,
		blueDistance = null,
		yellowAngle = null,
		blueAngle = null,
		frontGoal = 'unknown',
		i,
		goal;
	
	for (i = 0; i < goals.length; i++) {
		goal = goals[i];
		
		if (goal.side == Sim.Game.Side.YELLOW) {
			yellowDistance = goal.distance;
			yellowAngle = goal.angle;

			if (goal.camera == 'front') {
				frontGoal = 'yellow';
			}
		} else if (goal.side == Sim.Game.Side.BLUE) {
			blueDistance = goal.distance;
			blueAngle = goal.angle;

			if (goal.camera == 'front') {
				frontGoal = 'blue';
			}
		}
	}

    // @TODO Dont mess with the renderer directly
	sim.renderer.intersectionCircle1.hide();
	sim.renderer.intersectionCircle2.hide();

	var yellowGoalPos = {
			x: 0,
			y: sim.config.field.height / 2
		},
		blueGoalPos = {
			x: sim.config.field.width,
			y: sim.config.field.height / 2
		},
		noisyYellowDistance = null,
		noisyBlueDistance = null;


	if (yellowDistance != null) {
		noisyYellowDistance = yellowDistance + yellowDistance * Sim.Util.randomGaussian(this.distanceDeviation);

		sim.renderer.intersectionCircle1.attr({
			cx: yellowGoalPos.x,
			cy: yellowGoalPos.y,
			r: noisyYellowDistance
		}).show();
	}

	if (blueDistance != null) {
		noisyBlueDistance = blueDistance + blueDistance * Sim.Util.randomGaussian(this.distanceDeviation);

		sim.renderer.intersectionCircle2.attr({
			cx: blueGoalPos.x,
			cy: blueGoalPos.y,
			r: noisyBlueDistance
		}).show();
	}

	/*if (yellowDistance == null || blueDistance == null) {
		return false;
	}*/

	/*var yellowCircle = new Sim.Math.Circle(yellowGoalPos.x, yellowGoalPos.y, noisyYellowDistance),
		blueCircle = new Sim.Math.Circle(blueGoalPos.x, blueGoalPos.y, noisyBlueDistance),
		intersections = yellowCircle.getIntersections(blueCircle)

	if (intersections === false) {
		return false;
	}*/

	this.intersectionLocalizer.update(noisyYellowDistance, noisyBlueDistance, yellowAngle, blueAngle, frontGoal);

	return true;
};

Sim.Robot.prototype.localizeByAngles = function(goals) {
	var yellowGoalAngle = null,
		blueGoalAngle = null,
		i,
		goal;
	
	for (i = 0; i < goals.length; i++) {
		goal = goals[i];
		
		if (goal.side == Sim.Game.Side.YELLOW) {
			yellowGoalAngle = goal.edgeAngleDiff;
		} else if (goal.side == Sim.Game.Side.BLUE) {
			blueGoalAngle = goal.edgeAngleDiff;
		}
	}

	if (yellowGoalAngle == null || blueGoalAngle == null) {
		return false;
	}
	
	var yellowRadius = Math.abs(sim.config.field.goalWidth / (2 * Math.sin(yellowGoalAngle))),
		blueRadius = Math.abs(sim.config.field.goalWidth / (2 * Math.sin(blueGoalAngle))),
		centerY = sim.config.field.height / 2.0,
		yellowCenterX = yellowRadius * Math.cos(yellowGoalAngle),
		blueCenterX = sim.config.field.width - blueRadius * Math.cos(blueGoalAngle),
		yellowCircle = new Sim.Math.Circle(yellowCenterX, centerY, yellowRadius),
		blueCircle = new Sim.Math.Circle(blueCenterX, centerY, blueRadius),
		intersections = yellowCircle.getIntersections(blueCircle);

	sim.renderer.a1c.attr({
		cx: yellowCircle.x,
		cy: yellowCircle.y,
		r: yellowCircle.radius
	}).show();

	sim.renderer.a2c.attr({
		cx: blueCircle.x,
		cy: blueCircle.y,
		r: blueCircle.radius
	}).show();
		
	//sim.dbg.console('intersections', intersections);

	//sim.dbg.box('Goal angles', Sim.Math.round(Sim.Math.radToDeg(yellowGoalAngle), 1) + ' (' + Sim.Math.round(yellowRadius, 2) + '); ' + Sim.Math.round(Sim.Math.radToDeg(blueGoalAngle), 1) + '(' + Sim.Math.round(blueRadius, 2) + ')');
};

Sim.Robot.prototype.localizeKalman = function() {

};

/*
Sim.Robot.prototype.getOmega = function() {
	var avgOmega = (this.wheelOmegas[0] + this.wheelOmegas[1] + this.wheelOmegas[2]) / 3;
	
	return avgOmega * this.wheelRadius / this.wheelOffset;
};
*/

Sim.Robot.prototype.getVirtualPos = function() {
	return {
		x: this.virtualX,
		y: this.virtualY,
		orientation: this.virtualOrientation
	};
};

Sim.Robot.prototype.getVirtualFOV = function() {
	return this.cameraFOV
		.rotate(this.orientation)
		.translate(this.virtualX, this.virtualY);
};

Sim.Robot.prototype.getMovement = function(omegas, noisy) {
	if (noisy) {
		omegas = [
			omegas[0] + Sim.Util.randomGaussian(this.omegaDeviation),
			omegas[1] + Sim.Util.randomGaussian(this.omegaDeviation),
			omegas[2] + Sim.Util.randomGaussian(this.omegaDeviation),
			omegas[3] + Sim.Util.randomGaussian(this.omegaDeviation)
		];
	}
	
	var wheelMatrixA = new Sim.Math.Matrix3x1(
			omegas[0],
			omegas[1],
			omegas[2]
		),
		wheelMatrixB = new Sim.Math.Matrix3x1(
			omegas[0],
			omegas[1],
			omegas[3]
		),
		wheelMatrixC = new Sim.Math.Matrix3x1(
			omegas[0],
			omegas[2],
			omegas[3]
		),
		wheelMatrixD = new Sim.Math.Matrix3x1(
			omegas[1],
			omegas[2],
			omegas[3]
		),
		movementA = this.omegaMatrixInvA.getMultiplied(wheelMatrixA).getMultiplied(this.wheelRadius),
		movementB = this.omegaMatrixInvB.getMultiplied(wheelMatrixB).getMultiplied(this.wheelRadius),
		movementC = this.omegaMatrixInvC.getMultiplied(wheelMatrixC).getMultiplied(this.wheelRadius),
		movementD = this.omegaMatrixInvD.getMultiplied(wheelMatrixD).getMultiplied(this.wheelRadius);
	
	return {
		velocityX: (movementA.a11 + movementB.a11 + movementC.a11 + movementD.a11) / 4.0,
		velocityY: (movementA.a21 + movementB.a21 + movementC.a21 + movementD.a21) / 4.0,
		omega: (movementA.a31 + movementB.a31 + movementC.a31 + movementD.a31) / 4.0
	};
};

Sim.Robot.prototype.setTargetDir = function(x, y, omega) {
	this.targetDir = {
		x: x,
		y: y
	};
	
	if (typeof(omega) == 'number') {
		this.targetOmega = omega;
	}
	
	//sim.dbg.console('set target', this.targetDir, this.targetOmega);

	return this;
};

Sim.Robot.prototype.stop = function() {
	this.setTargetDir(0, 0, 0);
	
	return this;
};

Sim.Robot.prototype.getTargetDir = function() {
	return {
		x: this.targetDir.x,
		y: this.targetDir.y,
		omega: this.targetOmega
	};
};

Sim.Robot.prototype.setTargetOmega = function(omega) {
	this.targetOmega = Sim.Util.limitValue(omega, Sim.Math.TWO_PI);

	return this;
};

Sim.Robot.prototype.getTargetOmega = function() {
	return this.targetOmega;
};

Sim.Robot.prototype.driveTo = function(x, y, orientation) {
	this.queueCommand(new Sim.Cmd.DriveTo(x, y, orientation, 5, 0.01));
};

Sim.Robot.prototype.queueCommand = function(command) {
	this.commands.push(command);
};

Sim.Robot.prototype.turnBy = function(angle, duration) {
	this.queueCommand(new Sim.Cmd.TurnBy(angle, duration));
};

Sim.Robot.prototype.handleBalls = function(dt) {
	var balls = sim.game.balls,
		ball,
		distance,
		maxDistance,
		holdDistance,
		ballAngle,
		i;
	
	
	if (this.dribbledBall != null) {
		if (typeof(this.dribbledBall._goaled) != 'undefined' && this.dribbledBall._goaled) {
			this.dribbledBall._dribbled = false;
			this.dribbledBall = null;
			
			return;
		}
		
		distance = Sim.Math.getDistanceBetween(this.dribbledBall, this);
		maxDistance = this.radius + this.dribbledBall.radius * 2;
		holdDistance = this.radius + this.dribbledBall.radius * 1.1;
		
		if (distance <= maxDistance) {
			var forwardVec = Sim.Math.createForwardVector(this.orientation),
				pos = Sim.Math.createMultipliedVector(forwardVec, holdDistance);
			
			this.dribbledBall.x = this.x + pos.x;
			this.dribbledBall.y = this.y + pos.y;
		} else {
			this.dribbledBall._dribbled = false;
			
			this.dribbledBall = null;
		}
	} else {
		for (i = 0; i < balls.length; i++) {
			ball = balls[i];

			distance = Sim.Math.getDistanceBetween(ball, this);
			maxDistance = this.radius + ball.radius * 2;

			if (distance <= maxDistance) {
				ballAngle = Sim.Math.getAngleBetween(ball, this, this.orientation);

				if (Math.abs(ballAngle) <= this.dribbleAngle) {
					this.grabBall(ball);
					
					break;
				}
			}
		}
	}
};

Sim.Robot.prototype.grabBall = function(ball) {
	ball._dribbled = true;
	
	this.dribbledBall = ball;
};

Sim.Robot.prototype.kick = function() {
	if (this.dribbledBall == null) {
		return;
	}
	
	var dir = Sim.Math.createDirVector(this, this.dribbledBall);
	
	Sim.Math.addImpulse(this.dribbledBall, dir, -1 * this.kickerForce, sim.game.lastStepDuration);
	
	this.dribbledBall._dribbled = false;
	this.dribbledBall = null;
};

Sim.Robot.prototype.handleCommands = function(dt) {
	if (this.commands.length == 0) {
		return;
	}
	
	var cmd = this.commands[0];
	
	if (typeof(cmd._loaded) == 'undefined') {
		if (typeof(cmd.onStart) == 'function') {
			cmd.onStart.apply(cmd, [this, dt]);
		}
		
		cmd._loaded = true;
	}
	
	if (cmd.step.apply(cmd, [this, dt]) === false) {
		if (typeof(cmd.onEnd) == 'function') {
			cmd.onEnd.apply(cmd, [this, dt]);
		}
		
		this.commands = this.commands.slice(1);
			
		this.handleCommands(dt);
	}
};