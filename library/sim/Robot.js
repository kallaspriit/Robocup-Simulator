Sim.Robot = function(
	side,
	x,
	y,
	orientation,
	radius,
	mass,
	wheelRadius,
	wheelOffset,
	cameraDistance,
	cameraWidth,
	kickerForce,
	dribbleAngle,
	omegaDeviation,
	distanceDeviation
) {
	this.side = side;
	this.x = x;
	this.y = y;
	this.orientation = orientation;
	this.radius = radius;
	this.mass = mass;
	this.wheelRadius = wheelRadius;
	this.wheelOffset = wheelOffset;
	this.cameraDistance = cameraDistance;
	this.cameraWidth = cameraWidth;
	this.kickerForce = kickerForce;
	this.dribbleAngle = dribbleAngle;
	this.omegaDeviation = omegaDeviation;
	this.distanceDeviation = distanceDeviation;
	
	this.vision = new Sim.Vision();
	this.dribbledBall = null;
	this.targetDir = {x: 0, y: 0};
	this.targetOmega = 0;
	this.lastMovement = null;
	this.velocityX = 0;
	this.velocityY = 0;
	this.commands = [];
	
	this.virtualX = x;
	this.virtualY = y;
	this.virtualOrientation = orientation;
	this.virtualVelocityX = this.velocityX;
	this.virtualVelocityY = this.velocityY;
	
	/*
	this.wheelOmegas = [
		0.0, 0.0, 0.0
	];
	
	this.wheelAngles = [
		Sim.Math.degToRad(-60.0),
		Sim.Math.degToRad(120),
		Sim.Math.degToRad(0.0)
	];
	
	this.omegaMatrix = $M([
		[-Math.sin(this.wheelAngles[0]), Math.cos(this.wheelAngles[0]), this.wheelOffset],
		[-Math.sin(this.wheelAngles[1]), Math.cos(this.wheelAngles[1]), this.wheelOffset],
		[-Math.sin(this.wheelAngles[2]), Math.cos(this.wheelAngles[2]), this.wheelOffset]
	]);
	*/
    
	this.wheelOmegas = [
		0.0, 0.0, 0.0, 0.0
	];
	
	this.wheelAngles = [
		Sim.Math.degToRad(-135.0),
		Sim.Math.degToRad(-45.0),
		Sim.Math.degToRad(45.0),
		Sim.Math.degToRad(135.0)
	];

	this.omegaMatrix = $M([
		[-Math.sin(this.wheelAngles[0]), Math.cos(this.wheelAngles[0]), this.wheelOffset],
		[-Math.sin(this.wheelAngles[1]), Math.cos(this.wheelAngles[1]), this.wheelOffset],
		[-Math.sin(this.wheelAngles[2]), Math.cos(this.wheelAngles[2]), this.wheelOffset],
		[-Math.sin(this.wheelAngles[3]), Math.cos(this.wheelAngles[3]), this.wheelOffset]
	]);
	this.omegaMatrixA = $M([
		[-Math.sin(this.wheelAngles[0]), Math.cos(this.wheelAngles[0]), this.wheelOffset],
		[-Math.sin(this.wheelAngles[1]), Math.cos(this.wheelAngles[1]), this.wheelOffset],
		[-Math.sin(this.wheelAngles[2]), Math.cos(this.wheelAngles[2]), this.wheelOffset]
	]);
	this.omegaMatrixB = $M([
		[-Math.sin(this.wheelAngles[0]), Math.cos(this.wheelAngles[0]), this.wheelOffset],
		[-Math.sin(this.wheelAngles[1]), Math.cos(this.wheelAngles[1]), this.wheelOffset],
		[-Math.sin(this.wheelAngles[3]), Math.cos(this.wheelAngles[3]), this.wheelOffset]
	]);
	this.omegaMatrixC = $M([
		[-Math.sin(this.wheelAngles[0]), Math.cos(this.wheelAngles[0]), this.wheelOffset],
		[-Math.sin(this.wheelAngles[2]), Math.cos(this.wheelAngles[2]), this.wheelOffset],
		[-Math.sin(this.wheelAngles[3]), Math.cos(this.wheelAngles[3]), this.wheelOffset]
	]);
	this.omegaMatrixD = $M([
		[-Math.sin(this.wheelAngles[1]), Math.cos(this.wheelAngles[1]), this.wheelOffset],
		[-Math.sin(this.wheelAngles[2]), Math.cos(this.wheelAngles[2]), this.wheelOffset],
		[-Math.sin(this.wheelAngles[3]), Math.cos(this.wheelAngles[3]), this.wheelOffset]
	]);
	
	this.omegaMatrixInv = this.omegaMatrix.inverse();
	this.omegaMatrixInvA = this.omegaMatrixA.inverse();
	this.omegaMatrixInvB = this.omegaMatrixB.inverse();
	this.omegaMatrixInvC = this.omegaMatrixC.inverse();
	this.omegaMatrixInvD = this.omegaMatrixD.inverse();
	
	this.cameraPoly1 = new Sim.Math.Polygon([
		{x: 0, y: 0},
		{x: this.cameraDistance, y: -this.cameraWidth / 2},
		{x: this.cameraDistance, y: this.cameraWidth / 2},
		{x: 0, y: 0}
	]);
	
	this.cameraPoly2 = new Sim.Math.Polygon([
		{x: 0, y: 0},
		{x: -this.cameraDistance, y: -this.cameraWidth / 2},
		{x: -this.cameraDistance, y: this.cameraWidth / 2},
		{x: 0, y: 0}
	]);
};

Sim.Robot.prototype.resetDeviation = function() {
	this.virtualX = this.x;
	this.virtualY = this.y;
	this.virtualOrientation = this.orientation;
	this.virtualVelocityX = this.velocityX;
	this.virtualVelocityY = this.velocityY;
};

Sim.Robot.prototype.step = function(dt) {
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
		sim.conf.field.width,
		0,
		sim.conf.field.height,
		this.radius
	);
	
	this.updateVision();
	this.handleBalls(dt);
	this.handleCommands(dt);
	
	this.virtualOrientation = (this.virtualOrientation + noisyMovement.omega * dt) % (Math.PI * 2.0);
	this.virtualVelocityX = noisyMovement.velocityX * Math.cos(this.virtualOrientation) - noisyMovement.velocityY * Math.sin(this.virtualOrientation),
	this.virtualVelocityY = noisyMovement.velocityX * Math.sin(this.virtualOrientation) + noisyMovement.velocityY * Math.cos(this.virtualOrientation);
	this.virtualX += this.virtualVelocityX * dt;
	this.virtualY += this.virtualVelocityY * dt;
	
	sim.dbg.box('Omega', Sim.Math.round(this.wheelOmegas[0], 2) + ',' + Sim.Math.round(this.wheelOmegas[1], 2) + ',' + Sim.Math.round(this.wheelOmegas[2], 2) + ',' + Sim.Math.round(this.wheelOmegas[3], 2));
	sim.dbg.box('Velocity', $V2(movement.velocityX, movement.velocityY).modulus(), 2);
};

Sim.Robot.prototype.updateVision = function() {
	var polygons = [
			this.cameraPoly1,
			this.cameraPoly2
		],
		balls = [],
		goals = [],
		i,
		j;
	
	for (i = 0; i < sim.game.balls.length; i++) {
		sim.game.balls[i]._yellowVisible = false;
	}
	
	for (i = 0; i < polygons.length; i++) {
		balls = balls.concat(this.vision.getVisibleBalls(polygons[i], this.x, this.y, this.orientation));
		goals = goals.concat(this.vision.getVisibleGoals(polygons[i], this.x, this.y, this.orientation));
	}
	
	for (j = 0; j < balls.length; j++) {
		balls[j].ball._yellowVisible = true;
	}
	
	this.localizeByDistances(goals);
	this.localizeByAngles(goals);
};

Sim.Robot.prototype.localizeByDistances = function(goals) {
	var yellowDistance = null,
		blueDistance = null,
		i,
		goal;
	
	for (i = 0; i < goals.length; i++) {
		goal = goals[i];
		
		if (goal.side == Sim.Game.Side.YELLOW) {
			yellowDistance = goal.distance;
		} else if (goal.side == Sim.Game.Side.BLUE) {
			blueDistance = goal.distance;
		}
	}
	
	sim.renderer.l1.hide();
	sim.renderer.l1c.hide();
	sim.renderer.l2.hide();
	sim.renderer.l2c.hide();
	
	if (yellowDistance == null || blueDistance == null) {
		return false;
	}
	/*
	var noisyYellowDistance = yellowDistance + yellowDistance * Sim.Util.randomGaussian(this.distanceDeviation),
		noisyBlueDistance = blueDistance + blueDistance * Sim.Util.randomGaussian(this.distanceDeviation);
	*/
	
	var noisyYellowDistance = yellowDistance,
		noisyBlueDistance = blueDistance;
	
	var yellowGoalPos = {
			x: 0,
			y: sim.conf.field.height / 2
		},
		blueGoalPos = {
			x: sim.conf.field.width,
			y: sim.conf.field.height / 2
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
	
	var yellowRadius = Math.abs(sim.conf.field.goalWidth / (2 * Math.sin(yellowGoalAngle))),
		blueRadius = Math.abs(sim.conf.field.goalWidth / (2 * Math.sin(blueGoalAngle))),
		centerY = sim.conf.field.height / 2.0,
		yellowCenterX = yellowRadius * Math.cos(yellowGoalAngle),
		blueCenterX = sim.conf.field.width - blueRadius * Math.cos(blueGoalAngle),
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
	
	var wheelMatrixA = $M([
			[omegas[0]],
			[omegas[1]],
			[omegas[2]]
		]),
		wheelMatrixB = $M([
			[omegas[0]],
			[omegas[1]],
			[omegas[3]]
		]),
		wheelMatrixC = $M([
			[omegas[0]],
			[omegas[2]],
			[omegas[3]]
		]),
		wheelMatrixD = $M([
			[omegas[1]],
			[omegas[2]],
			[omegas[3]]
		]),
		/*wheelMatrix = $M([
			[omegas[0]],
			[omegas[1]],
			[omegas[2]],
			[omegas[3]]
		]),*/
		movementA = this.omegaMatrixInvA.multiply(wheelMatrixA).multiply(this.wheelRadius),
		movementB = this.omegaMatrixInvB.multiply(wheelMatrixB).multiply(this.wheelRadius),
		movementC = this.omegaMatrixInvC.multiply(wheelMatrixC).multiply(this.wheelRadius),
		movementD = this.omegaMatrixInvD.multiply(wheelMatrixD).multiply(this.wheelRadius);
	
	
	
	return {
		velocityX: (movementA.elements[0][0] + movementB.elements[0][0] + movementC.elements[0][0] + movementD.elements[0][0]) / 4.0,
		velocityY: (movementA.elements[1][0] + movementB.elements[1][0] + movementC.elements[1][0] + movementD.elements[1][0]) / 4.0,
		omega: (movementA.elements[2][0] + movementB.elements[2][0] + movementC.elements[2][0] + movementD.elements[2][0]) / 4.0
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

Sim.Robot.prototype.getTargetDir = function() {
	return {
		x: this.targetDir.x,
		y: this.targetDir.y,
		omega: this.targetOmega
	};
};

Sim.Robot.prototype.setTargetOmega = function(omega) {
	this.targetOmega = omega;
	
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
	/*
	this.wheelOmegas[0] = (this.wheelOffset * omega - dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[0])) + dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[0]))) / this.wheelRadius;
	this.wheelOmegas[1] = (this.wheelOffset * omega - dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[1])) + dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[1]))) / this.wheelRadius;
	this.wheelOmegas[2] = (this.wheelOffset * omega - dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[2])) + dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[2]))) / this.wheelRadius;
	*/
    
	var targetMatrix = $M([
		[this.targetDir.x],
		[this.targetDir.y],
		[this.targetOmega]
	]);
	
	var wheelOmegas = this.omegaMatrix.multiply(1.0 / this.wheelRadius).multiply(targetMatrix).elements;
	
	this.wheelOmegas[0] = wheelOmegas[0][0];
	this.wheelOmegas[1] = wheelOmegas[1][0];
	this.wheelOmegas[2] = wheelOmegas[2][0];
	this.wheelOmegas[3] = wheelOmegas[3][0];
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
			var forwardVec = $V2(Math.cos(this.orientation), Math.sin(this.orientation)).toUnitVector(),
				pos = forwardVec.multiply(holdDistance);
			
			this.dribbledBall.x = this.x + pos.x();
			this.dribbledBall.y = this.y + pos.y();
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
	
	var dir = Sim.Math.dirBetween(this, this.dribbledBall);
	
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