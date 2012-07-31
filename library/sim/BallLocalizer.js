Sim.BallLocalizer = function() {
	this.balls = [];
};

Sim.BallLocalizer.BallId = 0;

Sim.BallLocalizer.Ball = function(x, y) {
	this.id = Sim.BallLocalizer.BallId++;
	this.positions = [];
	this.positionCounter = 0;
	this.created = Sim.Util.getMicrotime();
	this.updated = this.created;
	this.x = 0;
	this.y = 0;
	
	this.addMeasurement(x, y);
};

Sim.BallLocalizer.Ball.prototype.addMeasurement = function(x, y) {
	this.positions[this.positionCounter] = {x: x, y: y};
	this.positionCounter = (this.positionCounter + 1) % sim.conf.ballLocalizer.ballPositionAverages;
	this.updated = Sim.Util.getMicrotime();
	
	var position = this.getPosition();
	
	this.x = position.x;
	this.y = position.y;
};

Sim.BallLocalizer.Ball.prototype.getPosition = function() {
	var xSum = 0,
		ySum = 0,
		samples = 0;
	
	for (var i = 0; i < sim.conf.ballLocalizer.ballPositionAverages; i++) {
		if (typeof(this.positions[i]) != 'object') {
			continue;
		}
		
		xSum += this.positions[i].x;
		ySum += this.positions[i].y;
		samples++;
	}
	
	return {
		x: xSum / samples,
		y: ySum / samples
	};
};

Sim.BallLocalizer.prototype.update = function(robotX, robotY, robotOrientation, balls) {
	var ballX,
		ballY,
		angle,
		closestBall,
		i;
	
	for (i = 0; i < balls.length; i++) {
		angle = robotOrientation + balls[i].angle;
		
		ballX = robotX + Math.cos(angle) * balls[i].distance;
		ballY = robotY + Math.sin(angle) * balls[i].distance;
		
		closestBall = this.getBallAround(ballX, ballY);
		
		if (closestBall != null) {
			closestBall.addMeasurement(ballX, ballY);
		} else {
			this.balls.push(new Sim.BallLocalizer.Ball(ballX, ballY));
		}
	}
	
	this.purge();
};

Sim.BallLocalizer.prototype.getBallAround = function(x, y) {
	var distance,
		ball,
		ballPosition,
		minDistance = null,
		closestBall = null,
		i;
	
	for (i = 0; i < this.balls.length; i++) {
		ball = this.balls[i];
		
		distance = Sim.Math.getDistanceBetween(
			{x: ball.x, y: ball.y},
			{x: x, y: y}
		);
				
		if (
			distance <= sim.conf.ballLocalizer.maxBallIdentityDistance
			&& (
				minDistance == null
				|| distance < minDistance
			)
		) {
			minDistance = distance;
			closestBall = ball;
		}
	}
	
	return closestBall;
};

Sim.BallLocalizer.prototype.purge = function() {
	var remainingBalls = [],
		i;
		
	for (i = 0; i < this.balls.length; i++) {
		if (this.isValid(this.balls[i])) {
			remainingBalls.push(this.balls[i]);
		}
	}
	
	this.balls = remainingBalls;
};

Sim.BallLocalizer.prototype.isValid = function(ball) {
	var currentTime = Sim.Util.getMicrotime();
	
	if (Sim.Util.confine(ball, 0, sim.conf.field.width, 0, sim.conf.field.height, sim.conf.ball.radius)) {
		return false;
	}
	
	if (currentTime - ball.updated > sim.conf.ballLocalizer.ballPurgeLifetime) {
		return false;
	}
	
	return true;
};