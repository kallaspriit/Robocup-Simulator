Sim.AI = function(robot) {
	this.robot = robot;
	this.state = Sim.AI.State.FIND_BALL;
	this.stateDuration = null;
	this.totalDuration = null;
	this.targetBallId = null;
};

Sim.AI.State = {
	FIND_BALL: 'find-ball',
	FETCH_BALL: 'fetch-ball'
};

Sim.AI.prototype.setState = function(state) {
	this.state = state;
	this.stateDuration = 0;
};

Sim.AI.prototype.step = function(dt) {
	switch (this.state) {
		case Sim.AI.State.FIND_BALL:
			this.stepFindBall(dt);
		break;
		
		case Sim.AI.State.FETCH_BALL:
			this.stepFetchBall(dt);
		break;
	}
	
	this.showDebugInfo();
	
	this.stateDuration += dt;
	this.totalDuration += dt;
};

Sim.AI.prototype.showDebugInfo = function() {
	sim.dbg.box('State', this.state + ' (' + Sim.Math.round(this.stateDuration, 1) + 's)');
	
	if (this.targetBallId != null) {
		sim.dbg.box('Target ball', '#' + this.targetBallId + '');
	} else {
		sim.dbg.box('Target ball', 'n/a');
	}
};

Sim.AI.prototype.stepFindBall = function(dt) {
	sim.dbg.box('@ Find ball');
	
	var ballId = this.pickBall();
	
	this.targetBallId = null;
	
	if (ballId != null) {
		this.targetBallId = ballId;
		
		this.setState(Sim.AI.State.FETCH_BALL);
		
		return;
	}
	
	this.robot.setTargetOmega(1.0);
};

Sim.AI.prototype.stepFetchBall = function(dt) {
	var newBallId = this.pickBall();
	
	if (newBallId != this.targetBallId) {
		this.targetBallId = newBallId;
	}
	
	var ballInfo = this.robot.ballLocalizer.getBallInfo(this.targetBallId);
	
	if (ballInfo == null) {
		this.setState(Sim.AI.State.FIND_BALL);
		
		return;
	}
	
	if (ballInfo.visible) {
		this.robot.setTargetOmega(ballInfo.angle * 10.0);
		
		sim.dbg.box('@FETCH', 'Focusing: ' + Sim.Math.round(Sim.Math.radToDeg(ballInfo.angle), 1));
	} else {
		sim.dbg.box('@FETCH', 'Not visible');
	}
};

Sim.AI.prototype.pickBall = function() {
	var balls = this.robot.ballLocalizer.balls,
		robotPos = {x: this.robot.virtualX, y: this.robot.virtualY},
		closestDistance = null,
		closestBall = null,
		distance,
		i;
	
	for (i = 0; i < balls.length; i++) {
		distance = Sim.Math.getDistanceBetween(robotPos, balls[i]);
		
		if (closestDistance == null || distance < closestDistance) {
			closestDistance = distance;
			closestBall = balls[i];
		}
	}
	
	return closestBall.id;
};