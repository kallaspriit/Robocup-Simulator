Sim.Robot = function(side, x, y, orientation) {
	this.side = side;
	this.x = x;
	this.y = y;
	this.orientation = orientation;
	
	this.radius = 0.125;
	this.mass = 2.5;
	this.wheelRadius = 0.025;
	this.wheelOffset = 0.12;
	this.cameraDistance = 5.0;
	this.cameraWidth = 8.0;
	this.kickerForce = 30.0;
	this.dribbleAngle = Sim.Math.degToRad(20.0); // degrees each way
	this.dribbledBall = null;
	
	this.targetDir = {x: 0, y: 0};
	this.targetOmega = 0;
	
	this.lastMovement = null;
	this.velocityX = 0;
	this.velocityY = 0;
	
	this.wheelOmega = [
		0.0, 0.0, 0.0
	];
	
	this.wheelsAngle = Sim.Math.degToRad(-60.0);
	
	this.omegaMatrix = $M([
		[-Math.sin(this.wheelsAngle), Math.cos(this.wheelsAngle), this.wheelOffset],
		[-Math.sin(Math.PI / 3.0 - this.wheelsAngle), -Math.cos(Math.PI / 3.0 - this.wheelsAngle), this.wheelOffset],
		[Math.sin(Math.PI / 3.0 + this.wheelsAngle), -Math.cos(Math.PI / 3.0 + this.wheelsAngle), this.wheelOffset]
	]);
	
	this.omegaMatrixInv = this.omegaMatrix.inverse();
	
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
	
	this.commands = [];
};

Sim.Robot.prototype.step = function(dt) {
	/*
	if ((this.targetDir.x != 0 || this.targetDir.y != 0) && this.targetOmega != 0) {
		this.targetDir = Sim.Math.rotatePoint(this.targetDir.x, this.targetDir.y, -1.0 * this.targetOmega * dt);
	
		this.updateWheelSpeeds();
	}
	*/
	var movement = this.getMovement();
	
	this.lastMovement = movement;
	
    this.velocityX = movement.velocityX * Math.cos(this.orientation) - movement.velocityY * Math.sin(this.orientation),
	this.velocityY = movement.velocityX * Math.sin(this.orientation) + movement.velocityY * Math.cos(this.orientation);

	this.orientation = (this.orientation + movement.omega * dt) % (Math.PI * 2.0);
	this.x += this.velocityX * dt;
	this.y += this.velocityY * dt;
	
	this.updateVision();
	this.handleBalls(dt);
	this.handleCommands(dt);
	
	sim.dbg.box('Omega', Sim.Math.round(this.wheelOmega[0], 2) + ',' + Sim.Math.round(this.wheelOmega[1], 2) + ',' + Sim.Math.round(this.wheelOmega[2], 2));
	sim.dbg.box('Velocity', $V2(movement.velocityX, movement.velocityY).modulus(), 2);
};

Sim.Robot.prototype.updateVision = function() {
	var currentCameraPoly1 = this.cameraPoly1.rotate(this.orientation).translate(this.x, this.y),
		currentCameraPoly2 = this.cameraPoly2.rotate(this.orientation).translate(this.x, this.y),
		ball,
		distance,
		angle,
		i;
	
	for (i = 0; i < sim.game.balls.length; i++) {
		ball = sim.game.balls[i];

		if (
			currentCameraPoly1.containsPoint(ball.x, ball.y)
			|| currentCameraPoly2.containsPoint(ball.x, ball.y)
		) {
			ball._yellowVisible = true;
			
			distance = Sim.Math.getDistanceBetween(this, ball) - this.radius;
			angle = Sim.Math.getAngleBetween(this, ball, this.orientation);
		
			//sim.dbg.box('#' + i, Sim.Math.round(distance, 3) + ' / ' +Sim.Math.round(Sim.Math.radToDeg(angle), 1));
		} else {
			ball._yellowVisible = false;
			
			//sim.dbg.box('#' + i, 'n/a');
		}
	}
	
	this.locateByDistances(currentCameraPoly1, currentCameraPoly2);
	this.locateByAngles(currentCameraPoly1, currentCameraPoly2);
};

Sim.Robot.prototype.locateByDistances = function(currentCameraPoly1, currentCameraPoly2) {
	var yellowGoalPos = {
			x: 0,
			y: sim.conf.field.height / 2
		},
		blueGoalPos = {
			x: sim.conf.field.width,
			y: sim.conf.field.height / 2
		},
		yellowDistance = null,
		blueDistance = null;
	
	
	if (
		currentCameraPoly1.containsPoint(yellowGoalPos.x, yellowGoalPos.y)
		|| currentCameraPoly2.containsPoint(yellowGoalPos.x, yellowGoalPos.y)
	) {
		yellowDistance = Sim.Math.getDistanceBetween(this, yellowGoalPos);
			
		//sim.dbg.box('Yellow', yellowDistance, 1);
	} else {
		//sim.dbg.box('Yellow', 'n/a');
	}
	
	if (
		currentCameraPoly1.containsPoint(blueGoalPos.x, blueGoalPos.y)
		|| currentCameraPoly2.containsPoint(blueGoalPos.x, blueGoalPos.y)
	) {
		blueDistance = Sim.Math.getDistanceBetween(this, blueGoalPos);
			
		//sim.dbg.box('Blue', blueDistance, 1);
	} else {
		//sim.dbg.box('Blue', 'n/a');
	}
	
	sim.renderer.l1.hide();
	sim.renderer.l1c.hide();
	sim.renderer.l2.hide();
	sim.renderer.l2c.hide();
	
	if (yellowDistance != null && blueDistance != null) {
		var yellowCircle = new Sim.Math.Circle(yellowGoalPos.x, yellowGoalPos.y, yellowDistance),
			blueCircle = new Sim.Math.Circle(blueGoalPos.x, blueGoalPos.y, blueDistance),
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
	}
}

Sim.Robot.prototype.locateByAngles = function(currentCameraPoly1, currentCameraPoly2) {
	var yellowGoalPos1 = {
			x: 0,
			y: sim.conf.field.height / 2 - sim.conf.field.goalWidth / 2
		},
		yellowGoalPos2 = {
			x: 0,
			y: sim.conf.field.height / 2 + sim.conf.field.goalWidth / 2
		},
		blueGoalPos1 = {
			x: sim.conf.field.width,
			y: sim.conf.field.height / 2 - sim.conf.field.goalWidth / 2
		},
		blueGoalPos2 = {
			x: sim.conf.field.width,
			y: sim.conf.field.height / 2 + sim.conf.field.goalWidth / 2
		};
	
	var yellowGoalAngle = null,
		blueGoalAngle = null;
	
	if (
		(
			currentCameraPoly1.containsPoint(yellowGoalPos1.x, yellowGoalPos1.y)
			&& currentCameraPoly1.containsPoint(yellowGoalPos2.x, yellowGoalPos2.y)
		)
		|| (
			currentCameraPoly2.containsPoint(yellowGoalPos1.x, yellowGoalPos1.y)
			&& currentCameraPoly2.containsPoint(yellowGoalPos2.x, yellowGoalPos2.y)
		)
	) {
		var distance1 = Sim.Math.getDistanceBetween(this, yellowGoalPos1) - this.radius,
			distance2 = Sim.Math.getDistanceBetween(this, yellowGoalPos2) - this.radius,
			angle1 = Sim.Math.getAngleBetween(this, yellowGoalPos1, this.orientation),
			angle2 = Sim.Math.getAngleBetween(this, yellowGoalPos2, this.orientation);
		
		yellowGoalAngle = Math.abs(angle1 - angle2);

		//sim.dbg.box('Yellow', Sim.Math.round(distance1, 3) + ' ; ' + Sim.Math.round(distance2, 3) + ' / ' + Sim.Math.round(Sim.Math.radToDeg(angle1), 1) + ' ; ' + Sim.Math.round(Sim.Math.radToDeg(angle2), 1) + ' ; ' + Sim.Math.round(Sim.Math.radToDeg(yellowGoalAngle), 1));
	} else {
		//sim.dbg.box('Yellow', 'n/a');
	}
	
	if (
		(
			currentCameraPoly1.containsPoint(blueGoalPos1.x, blueGoalPos1.y)
			&& currentCameraPoly1.containsPoint(blueGoalPos2.x, blueGoalPos2.y)
		)
		|| (
			currentCameraPoly2.containsPoint(blueGoalPos1.x, blueGoalPos1.y)
			&& currentCameraPoly2.containsPoint(blueGoalPos2.x, blueGoalPos2.y)
		)
	) {
		var distance1 = Sim.Math.getDistanceBetween(this, blueGoalPos1) - this.radius,
			distance2 = Sim.Math.getDistanceBetween(this, blueGoalPos2) - this.radius,
			angle1 = Sim.Math.getAngleBetween(this, blueGoalPos1, this.orientation),
			angle2 = Sim.Math.getAngleBetween(this, blueGoalPos2, this.orientation);
		
		blueGoalAngle = Math.abs(angle1 - angle2);

		//sim.dbg.box('Blue', Sim.Math.round(distance1, 3) + ' ; ' + Sim.Math.round(distance2, 3) + ' / ' + Sim.Math.round(Sim.Math.radToDeg(angle1), 1) + ' ; ' + Sim.Math.round(Sim.Math.radToDeg(angle2), 1) + ' ; ' + Sim.Math.round(Sim.Math.radToDeg(blueGoalAngle), 1));
	} else {
		//sim.dbg.box('Blue', 'n/a');
	}
	
	sim.renderer.a1c.hide();
	sim.renderer.a2c.hide();
	
	if (yellowGoalAngle != null && blueGoalAngle != null) {
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
	} else {
		//sim.dbg.box('Goal angles', 'n/a');
	}
}

/*
Sim.Robot.prototype.getOmega = function() {
	var avgOmega = (this.wheelOmega[0] + this.wheelOmega[1] + this.wheelOmega[2]) / 3;
	
	return avgOmega * this.wheelRadius / this.wheelOffset;
};
*/

Sim.Robot.prototype.getMovement = function() {
	var wheelMatrix = $M([
			[this.wheelOmega[0]],
			[this.wheelOmega[1]],
			[this.wheelOmega[2]]
		]),
		movement = this.omegaMatrixInv.multiply(wheelMatrix).multiply(this.wheelRadius);
	
	return {
		velocityX: movement.elements[0][0],
		velocityY: movement.elements[1][0],
		omega: movement.elements[2][0]
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
	this.wheelOmega[0] = (this.wheelOffset * omega - dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[0])) + dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[0]))) / this.wheelRadius;
	this.wheelOmega[1] = (this.wheelOffset * omega - dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[1])) + dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[1]))) / this.wheelRadius;
	this.wheelOmega[2] = (this.wheelOffset * omega - dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[2])) + dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[2]))) / this.wheelRadius;
	*/
    
	var targetMatrix = $M([
		[this.targetDir.x],
		[this.targetDir.y],
		[this.targetOmega]
	]);
	
	var wheelOmegas = this.omegaMatrix.multiply(1.0 / this.wheelRadius).multiply(targetMatrix).elements;
	
	this.wheelOmega[0] = wheelOmegas[0][0];
	this.wheelOmega[1] = wheelOmegas[1][0];
	this.wheelOmega[2] = wheelOmegas[2][0];
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