Sim.SimpleAI = function(robot) {
	this.robot = robot;
	this.state = Sim.SimpleAI.State.FIND_BALL;
	this.stateDuration = 0;
	this.totalDuration = 0;
	this.targetBallId = null;
	this.running = true;
	this.stateTick = 0;
	
	// configuration parameters
	this.rotationMultiplier = 6.0;
	this.blindRotationSpeed = 10.0;
	this.approachSpeedMultiplier = 3.0;
	this.approachAngleSpeedLimitMultiplier = 2;
	this.goalKickThresholdAngle = 1.0;
	this.blindApproachSpeed = 1.0;
	this.minApproachSpeed = 0.5;
	this.maxApproachSpeed = 1.5;
	
	// state helpers
	this.turnDirection = null;
	this.lastTurnDirection = 1;
};

Sim.SimpleAI.State = {
	FIND_BALL: 'find-ball',
	FETCH_BALL: 'fetch-ball',
	FIND_GOAL: 'find-goal'
};

Sim.SimpleAI.prototype.start = function() {
	this.running = true;
};

Sim.SimpleAI.prototype.stop = function() {
	this.running = false;
	this.robot.driveTo(sim.config.field.width / 2, sim.config.field.height / 2, 0);
};

Sim.SimpleAI.prototype.setState = function(state) {
	this.state = state;
	this.stateDuration = 0;
	this.stateTick = 0;
	this.turnDirection = null;
};

Sim.SimpleAI.prototype.step = function(dt) {
	if (!this.running) {
		return;
	}
	
	switch (this.state) {
		case Sim.SimpleAI.State.FIND_BALL:
			this.stepFindBall(dt);
		break;
		
		case Sim.SimpleAI.State.FETCH_BALL:
			this.stepFetchBall(dt);
		break;
		
		case Sim.SimpleAI.State.FIND_GOAL:
			this.stepFindGoal(dt);
		break;
	}
	
	this.stateDuration += dt;
	this.totalDuration += dt;
	this.stateTick++;
	
	this.showDebugInfo();
};

Sim.SimpleAI.prototype.showDebugInfo = function() {
	sim.dbg.box('State', this.state + ' - ' + Sim.Math.round(this.stateDuration, 1) + ' seconds');
	sim.dbg.box('Match duration', Sim.Math.round(this.totalDuration, 1) + ' seconds');
};

Sim.SimpleAI.prototype.stepFindBall = function(dt) {
	var ballId = this.pickBall();
	
	this.targetBallId = null;
	
	if (ballId != null) {
		this.targetBallId = ballId;
		
		this.setState(Sim.SimpleAI.State.FETCH_BALL);
		
		return;
	}
	
	this.robot.setTargetDir(0, 0, this.lastTurnDirection * Math.PI);
};

Sim.SimpleAI.prototype.stepFetchBall = function(dt) {
	if (this.robot.hasBall()) {
		this.setState(Sim.SimpleAI.State.FIND_GOAL);
		
		return;
	}
	
	var newBallId = this.pickBall();
	
	if (newBallId == null) {
		this.setState(Sim.SimpleAI.State.FIND_BALL);
		
		return;
	}
	
	if (newBallId != this.targetBallId) {
		this.targetBallId = newBallId;
	}
	
	var ball = this.robot.ballLocalizer.getBallInfo(this.targetBallId);
	
	if (ball == null) {
		this.setState(Sim.SimpleAI.State.FIND_BALL);
		
		return;
	}
	
	var targetOmega,
		targetSpeed;
	
	if (ball.visible) {
		targetOmega = ball.angle * this.rotationMultiplier;
		
		var omegaDivider = Math.max(Math.abs(targetOmega) * this.approachAngleSpeedLimitMultiplier, 1),
			approachSpeed = ball.distance * this.approachSpeedMultiplier / omegaDivider;
		
		/*sim.dbg.box('Omega divider', omegaDivider, 2);
		sim.dbg.box('Speed before', ball.distance * this.approachSpeedMultiplier, 2);
		sim.dbg.box('Speed after', approachSpeed, 2);*/
		
		targetSpeed = Sim.Util.limitRange(
			approachSpeed,
			this.minApproachSpeed,
			this.maxApproachSpeed
		);
	
		this.turnDirection = targetOmega >= 0 ? 1 : -1;
	} else {
		if (this.turnDirection == null) {
			var robotPos = this.robot.getVirtualPos(),
				angle = Sim.Math.getAngleBetween(ball, robotPos, robotPos.orientation);
				
			this.turnDirection = angle >= 0 ? 1 : -1;
		}
		
		targetOmega = this.blindRotationSpeed * this.turnDirection;
		targetSpeed = this.blindApproachSpeed;
	}

	this.robot.setTargetDir(targetSpeed, 0, targetOmega);
	
	this.lastTurnDirection = targetOmega >= 0 ? 1 : -1;
};

Sim.SimpleAI.prototype.stepFindGoal = function(dt) {
	this.targetBallId = null;
	
	if (!this.robot.hasBall()) {
		this.setState(Sim.SimpleAI.State.FIND_BALL);
		
		return;
	}
	
	var visibleGoals = this.robot.goals,
		oppositeSide = this.robot.getOppositeSide(),
		goalVisible = false,
		goalAngle,
		targetOmega,
		i;
	
	// TODO: Pick largest goal
	for (i = 0; i < visibleGoals.length; i++) {
		if (visibleGoals[i].side == oppositeSide) {
			goalAngle = visibleGoals[i].angle;
			goalVisible = true;
			
			break;
		}
	}
	
	if (goalVisible && Math.abs(goalAngle) < Sim.Math.degToRad(this.goalKickThresholdAngle)) {
		this.robot.kick();
		
		return;
	}
	
	if (goalVisible) {
		targetOmega = goalAngle * this.rotationMultiplier;
		
		this.turnDirection = targetOmega >= 0 ? 1 : -1;
	} else {
		if (this.turnDirection == null) {
			var goalPos = this.getOppositeGoalPos(),
				robotPos = this.robot.getVirtualPos(),
				angle = Sim.Math.getAngleBetween(goalPos, robotPos, robotPos.orientation);
		
			this.turnDirection = angle >= 0 ? 1 : -1;
		}
		
		targetOmega = this.blindRotationSpeed * this.turnDirection;
	}

	this.robot.setTargetDir(0, 0, targetOmega);
	
	this.lastTurnDirection = targetOmega >= 0 ? 1 : -1;
};

Sim.SimpleAI.prototype.pickBall = function() {
	var balls = this.robot.ballLocalizer.balls,
		robotPos = this.robot.getVirtualPos(),
		closestDistance = null,
		closestBall = null,
		distance,
		i;
	
	if (balls.length == 0) {
		return null;
	}
	
	for (i = 0; i < balls.length; i++) {
		if (
			balls[i].x < 0
			|| balls[i].x > sim.config.field.width
			|| balls[i].y < 0
			|| balls[i].y > sim.config.field.height
		) {	
			continue;
		}
		
		distance = Sim.Math.getDistanceBetween(robotPos, balls[i]);
		
		if (closestDistance == null || distance < closestDistance) {
			closestDistance = distance;
			closestBall = balls[i];
		}
	}
	
	if (closestBall != null) {
		return closestBall.id;
	} else {
		return null;
	}
};

Sim.SimpleAI.prototype.getOppositeGoalPos = function() {
	if (this.robot.side == Sim.Game.Side.YELLOW) {
		return {
			x: sim.config.field.width,
			y: sim.config.field.height / 2
		};
	} else {
		return {
			x: 0,
			y: sim.config.field.height / 2
		};
	}
};