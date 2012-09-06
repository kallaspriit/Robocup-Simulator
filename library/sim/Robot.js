Sim.Robot = function(
	side,
	x,
	y,
	orientation,
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
	this.radius = this.options.radius;
	this.mass = this.options.mass;
	this.wheelRadius = this.options.wheelRadius;
	this.wheelOffset = this.options.wheelOffset;
	this.cameraDistance = this.options.cameraDistance;
	this.cameraWidth = this.options.cameraWidth;
	this.kickerForce = this.options.kickerForce;
	this.dribbleAngle = this.options.dribbleAngle;
	this.omegaDeviation = this.options.omegaDeviation;
	this.distanceDeviation = this.options.distanceDeviation;
	this.smart = this.options.smart;
	
	this.dribbledBall = null;
	this.targetDir = {x: 0, y: 0};
	this.targetOmega = 0;
	this.lastMovement = null;
	this.velocityX = 0;
	this.velocityY = 0;
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
		this.robotLocalizer = new Sim.RobotLocalizer(
			sim.config.robotLocalizer.particleCount,
			sim.config.robotLocalizer.forwardNoise,
			sim.config.robotLocalizer.turnNoise,
			sim.config.robotLocalizer.senseNoise
		);
		this.ballLocalizer = new Sim.BallLocalizer(
			sim.config.game.balls
		);
	
		// yellow goal
		this.robotLocalizer.addLandmark(
			'yellow-goal-center',
			0,
			sim.config.field.height / 2.0
		);
		this.robotLocalizer.addLandmark(
			'yellow-goal-left',
			0,
			sim.config.field.height / 2.0 - sim.config.field.goalWidth / 2.0
		);
		this.robotLocalizer.addLandmark(
			'yellow-goal-right',
			0,
			sim.config.field.height / 2.0 + sim.config.field.goalWidth / 2.0
		);

		// blue goal
		this.robotLocalizer.addLandmark(
			'blue-goal-center',
			sim.config.field.width,
			sim.config.field.height / 2.0
		);
		this.robotLocalizer.addLandmark(
			'blue-goal-left',
			sim.config.field.width,
			sim.config.field.height / 2.0 - sim.config.field.goalWidth / 2.0
		);
		this.robotLocalizer.addLandmark(
			'blue-goal-right',
			sim.config.field.width,
			sim.config.field.height / 2.0 + sim.config.field.goalWidth / 2.0
		);
			
		this.robotLocalizer.init();
		this.resetDeviation();
	}
	
	this.wheelOmegas = [
		0.0, 0.0, 0.0, 0.0
	];
	
	this.wheelAngles = [
		Sim.Math.degToRad(-135.0),
		Sim.Math.degToRad(-45.0),
		Sim.Math.degToRad(45.0),
		Sim.Math.degToRad(135.0)
	];

	this.omegaMatrix = new Sim.Math.Matrix4x3(
		-Math.sin(this.wheelAngles[0]), Math.cos(this.wheelAngles[0]), this.wheelOffset,
		-Math.sin(this.wheelAngles[1]), Math.cos(this.wheelAngles[1]), this.wheelOffset,
		-Math.sin(this.wheelAngles[2]), Math.cos(this.wheelAngles[2]), this.wheelOffset,
		-Math.sin(this.wheelAngles[3]), Math.cos(this.wheelAngles[3]), this.wheelOffset
	);
	this.omegaMatrixA = new Sim.Math.Matrix3x3(
		-Math.sin(this.wheelAngles[0]), Math.cos(this.wheelAngles[0]), this.wheelOffset,
		-Math.sin(this.wheelAngles[1]), Math.cos(this.wheelAngles[1]), this.wheelOffset,
		-Math.sin(this.wheelAngles[2]), Math.cos(this.wheelAngles[2]), this.wheelOffset
	);
	this.omegaMatrixB = new Sim.Math.Matrix3x3(
		-Math.sin(this.wheelAngles[0]), Math.cos(this.wheelAngles[0]), this.wheelOffset,
		-Math.sin(this.wheelAngles[1]), Math.cos(this.wheelAngles[1]), this.wheelOffset,
		-Math.sin(this.wheelAngles[3]), Math.cos(this.wheelAngles[3]), this.wheelOffset
	);
	this.omegaMatrixC = new Sim.Math.Matrix3x3(
		-Math.sin(this.wheelAngles[0]), Math.cos(this.wheelAngles[0]), this.wheelOffset,
		-Math.sin(this.wheelAngles[2]), Math.cos(this.wheelAngles[2]), this.wheelOffset,
		-Math.sin(this.wheelAngles[3]), Math.cos(this.wheelAngles[3]), this.wheelOffset
	);
	this.omegaMatrixD = new Sim.Math.Matrix3x3(
		-Math.sin(this.wheelAngles[1]), Math.cos(this.wheelAngles[1]), this.wheelOffset,
		-Math.sin(this.wheelAngles[2]), Math.cos(this.wheelAngles[2]), this.wheelOffset,
		-Math.sin(this.wheelAngles[3]), Math.cos(this.wheelAngles[3]), this.wheelOffset
	);
	
	this.omegaMatrixInvA = this.omegaMatrixA.getInversed();
	this.omegaMatrixInvB = this.omegaMatrixB.getInversed();
	this.omegaMatrixInvC = this.omegaMatrixC.getInversed();
	this.omegaMatrixInvD = this.omegaMatrixD.getInversed();
	
	this.cameraFOV = new Sim.Math.Polygon([
		{x: 0, y: 0},
		{x: this.cameraDistance, y: -this.cameraWidth / 2},
		{x: this.cameraDistance, y: this.cameraWidth / 2},
		{x: 0, y: 0},
		{x: -this.cameraDistance, y: -this.cameraWidth / 2},
		{x: -this.cameraDistance, y: this.cameraWidth / 2},
		{x: 0, y: 0}
	]);
};

Sim.Robot.prototype.resetDeviation = function() {
	if (!this.smart) {
		return;
	}
	
	for (var i = 0; i < this.robotLocalizer.particles.length; i++) {
		this.robotLocalizer.particles[i].x = this.x;
		this.robotLocalizer.particles[i].y = this.y;
		this.robotLocalizer.particles[i].orientation = this.orientation;
		this.robotLocalizer.particles[i].probability = 1;
	}
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
};

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
	this.robotLocalizer.update(this.measurements);
	
	//this.localizeByDistances(this.goals);
	//this.localizeByAngles(this.goals);
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
	/*
	if ((this.targetDir.x != 0 || this.targetDir.y != 0) && this.targetOmega != 0) {
		this.targetDir = Sim.Math.rotatePoint(this.targetDir.x, this.targetDir.y, -1.0 * this.targetOmega * dt);
	
		this.updateWheelSpeeds();
	}
	*/
	var movement = this.getMovement(),
		noisyMovement = this.getMovement(true);
	
	this.lastMovement = movement;
	
	this.orientation = (this.orientation + movement.omega * dt) % (Math.PI * 2.0);
    this.velocityX = movement.velocityX * Math.cos(this.orientation) - movement.velocityY * Math.sin(this.orientation),
	this.velocityY = movement.velocityX * Math.sin(this.orientation) + movement.velocityY * Math.cos(this.orientation);
	this.x += this.velocityX * dt;
	this.y += this.velocityY * dt;
	
	Sim.Util.confine(
		this, 
		0,
		sim.config.field.width,
		0,
		sim.config.field.height,
		this.radius - sim.config.game.robotConfineThreshold
	);
	
	if (this.smart) {
		this.robotLocalizer.move(
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
			var position = this.robotLocalizer.getPosition(this);

			this.virtualX = position.x;
			this.virtualY = position.y;
			this.virtualOrientation = position.orientation;

			//sim.dbg.box('Evaluation', position.evaluation, 2);
		}
	}
};

Sim.Robot.prototype.localizeByDistances = function(goals) {
	var yellowDistance = null,
		blueDistance = null,
		yellowAngle = null,
		blueAngle = null,
		i,
		goal;
	
	for (i = 0; i < goals.length; i++) {
		goal = goals[i];
		
		if (goal.side == Sim.Game.Side.YELLOW) {
			yellowDistance = goal.distance;
			yellowAngle = goal.angle;
		} else if (goal.side == Sim.Game.Side.BLUE) {
			blueDistance = goal.distance;
			blueAngle = goal.angle;
		}
	}
	
	sim.renderer.l1.hide();
	sim.renderer.l1c.hide();
	sim.renderer.l2.hide();
	sim.renderer.l2c.hide();
	
	if (yellowDistance == null || blueDistance == null) {
		return false;
	}
	
	var angleSum = yellowAngle + blueAngle;
	
	//sim.dbg.box('yellow angle', Sim.Math.radToDeg(yellowAngle));
	//sim.dbg.box('blue angle', Sim.Math.radToDeg(blueAngle));
	//sim.dbg.box('angle sum', Sim.Math.radToDeg(angleSum % Math.PI * 2));
	
	/*
	var noisyYellowDistance = yellowDistance + yellowDistance * Sim.Util.randomGaussian(this.distanceDeviation),
		noisyBlueDistance = blueDistance + blueDistance * Sim.Util.randomGaussian(this.distanceDeviation);
	*/
	
	var noisyYellowDistance = yellowDistance,
		noisyBlueDistance = blueDistance;
	
	var yellowGoalPos = {
			x: 0,
			y: sim.config.field.height / 2
		},
		blueGoalPos = {
			x: sim.config.field.width,
			y: sim.config.field.height / 2
		},
		yellowCircle = new Sim.Math.Circle(yellowGoalPos.x, yellowGoalPos.y, noisyYellowDistance),
		blueCircle = new Sim.Math.Circle(blueGoalPos.x, blueGoalPos.y, noisyBlueDistance),
		intersections = yellowCircle.getIntersections(blueCircle);

	if (intersections === false) {
		return false;
	}

	sim.renderer.l1.attr({
		cx: intersections.x1,
		cy: intersections.y1
	}).show();

	sim.renderer.l1c.attr({
		cx: yellowGoalPos.x,
		cy: yellowGoalPos.y,
		r: yellowDistance
	}).show();

	sim.renderer.l2.attr({
		cx: intersections.x2,
		cy: intersections.y2
	}).show();

	sim.renderer.l2c.attr({
		cx: blueGoalPos.x,
		cy: blueGoalPos.y,
		r: blueDistance
	}).show();

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
	
	
	sim.renderer.a1c.hide();
	sim.renderer.a2c.hide();
	
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

Sim.Robot.prototype.getMovement = function(noisy) {
	var omegas = this.wheelOmegas;
	
	if (noisy) {
		omegas = [
			this.wheelOmegas[0] + Sim.Util.randomGaussian(this.omegaDeviation),
			this.wheelOmegas[1] + Sim.Util.randomGaussian(this.omegaDeviation),
			this.wheelOmegas[2] + Sim.Util.randomGaussian(this.omegaDeviation),
			this.wheelOmegas[3] + Sim.Util.randomGaussian(this.omegaDeviation),
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
	
	this.updateWheelSpeeds();
	
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
	this.targetOmega = Sim.Util.limitValue(omega, Math.PI * 2);
	
	this.updateWheelSpeeds();
	
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

Sim.Robot.prototype.updateWheelSpeeds = function() {
	var targetMatrix = new Sim.Math.Matrix3x1(
		this.targetDir.x,
		this.targetDir.y,
		this.targetOmega
	);
	
	var wheelOmegas = this.omegaMatrix.getMultiplied(1.0 / this.wheelRadius).getMultiplied(targetMatrix);
	
	this.wheelOmegas[0] = wheelOmegas.a11;
	this.wheelOmegas[1] = wheelOmegas.a21;
	this.wheelOmegas[2] = wheelOmegas.a31;
	this.wheelOmegas[3] = wheelOmegas.a41;
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
			/*var forwardVec = $V2(Math.cos(this.orientation), Math.sin(this.orientation)).toUnitVector(),
				pos = forwardVec.multiply(holdDistance);
			
			this.dribbledBall.x = this.x + pos.x();
			this.dribbledBall.y = this.y + pos.y();*/
			
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