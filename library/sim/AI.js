Sim.AI = function(robot) {
	this.robot = robot;
	this.state = Sim.AI.State.FIND_BALL;
	this.stateDuration = 0;
	this.totalDuration = 0;
	this.targetBallId = null;
	this.running = false;
	
	// configuration parameters
	this.rotationSpeed = 8.0;
	this.approachSpeed = 3.0;
	this.goalKickThresholdAngle = 1.0;
	this.blindApproachSpeed = 1.0;
	this.minApproachSpeed = 0.5;
	this.maxApproachSpeed = 1.5;
};

Sim.AI.State = {
	FIND_BALL: 'find-ball',
	FETCH_BALL: 'fetch-ball',
	FIND_GOAL: 'find-goal'
};

Sim.AI.prototype.start = function() {
	this.running = true;
};

Sim.AI.prototype.stop = function() {
	this.running = false;
	this.robot.driveTo(sim.conf.field.width / 2, sim.conf.field.height / 2, 0);
};

Sim.AI.prototype.setState = function(state) {
	this.state = state;
	this.stateDuration = 0;
};

Sim.AI.prototype.step = function(dt) {
	if (!this.running) {
		return;
	}
	
	switch (this.state) {
		case Sim.AI.State.FIND_BALL:
			this.stepFindBall(dt);
		break;
		
		case Sim.AI.State.FETCH_BALL:
			this.stepFetchBall(dt);
		break;
		
		case Sim.AI.State.FIND_GOAL:
			this.stepFindGoal(dt);
		break;
	}
	
	this.stateDuration += dt;
	this.totalDuration += dt;
	
	this.showDebugInfo();
};

Sim.AI.prototype.showDebugInfo = function() {
	sim.dbg.box('State', this.state + ' - ' + Sim.Math.round(this.stateDuration, 1) + ' seconds');
	sim.dbg.box('Match duration', Sim.Math.round(this.totalDuration, 1) + ' seconds');
};

Sim.AI.prototype.stepFindBall = function(dt) {
	var ballId = this.pickBall();
	
	this.targetBallId = null;
	
	if (ballId != null) {
		this.targetBallId = ballId;
		
		this.setState(Sim.AI.State.FETCH_BALL);
		
		return;
	}
	
	this.robot.setTargetDir(0, 0, Math.PI);
};

Sim.AI.prototype.stepFetchBall = function(dt) {
	if (this.robot.hasBall()) {
		this.setState(Sim.AI.State.FIND_GOAL);
		
		return;
	}
	
	var newBallId = this.pickBall();
	
	if (newBallId == null) {
		this.setState(Sim.AI.State.FIND_BALL);
		
		return;
	}
	
	if (newBallId != this.targetBallId) {
		this.targetBallId = newBallId;
	}
	
	var ball = this.robot.ballLocalizer.getBallInfo(this.targetBallId);
	
	if (ball == null) {
		this.setState(Sim.AI.State.FIND_BALL);
		
		return;
	}
	
	var targetOmega = 0,
		targetSpeed = this.blindApproachSpeed;
	
	if (ball.visible) {
		targetOmega = ball.angle * this.rotationSpeed;
		targetSpeed = Sim.Util.limitRange(ball.distance * this.approachSpeed, this.minApproachSpeed, this.maxApproachSpeed);
	} else {
		var robotPos = this.robot.getVirtualPos(),
			angle = Sim.Math.getAngleBetween(ball, robotPos, robotPos.orientation);
		
		targetOmega = angle * this.rotationSpeed;
	}
	
	this.robot.setTargetDir(targetSpeed, 0, targetOmega);
};

Sim.AI.prototype.stepFindGoal = function(dt) {
	this.targetBallId = null;
	
	if (!this.robot.hasBall()) {
		this.setState(Sim.AI.State.FIND_BALL);
		
		return;
	}
	
	var visibleGoals = this.robot.goals,
		oppositeSide = this.robot.getOppositeSide(),
		goalVisible = false,
		goalAngle,
		i;
		
	for (i = 0; i < visibleGoals.length; i++) {
		if (visibleGoals[i].side == oppositeSide) {
			goalVisible = true;
			
			goalAngle = visibleGoals[i].angle;
		}
	}
	
	if (!goalVisible) {
		// TODO: If the guessed orientation is wrong, might be unable to turn to the actual goal
		
		var goalPos = this.getOppositeGoalPos(),
			robotPos = this.robot.getVirtualPos();
		
		goalAngle = Sim.Math.getAngleBetween(goalPos, robotPos, robotPos.orientation);
	}
	
	var targetOmega = goalAngle * this.rotationSpeed;

	this.robot.setTargetDir(0, 0, targetOmega);
	
	if (goalVisible && Math.abs(goalAngle) < Sim.Math.degToRad(this.goalKickThresholdAngle)) {
		this.robot.kick();
	}
};

Sim.AI.prototype.pickBall = function() {
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
		distance = Sim.Math.getDistanceBetween(robotPos, balls[i]);
		
		if (closestDistance == null || distance < closestDistance) {
			closestDistance = distance;
			closestBall = balls[i];
		}
	}
	
	return closestBall.id;
};

Sim.AI.prototype.getOppositeGoalPos = function() {
	if (this.robot.side == Sim.Game.Side.YELLOW) {
		return {
			x: sim.conf.field.width,
			y: sim.conf.field.height / 2
		};
	} else {
		return {
			x: 0,
			y: sim.conf.field.height / 2
		};
	}
};