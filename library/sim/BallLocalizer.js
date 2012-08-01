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
	this.x = null;
	this.y = null;
	this.elasticity = sim.conf.ballLocalizer.ballElasticity;
	this.radius = sim.conf.ball.radius;
	this.velocityX = 0;
	this.velocityY = 0;
	this.removeTime = null;
	
	this.addMeasurement(x, y);
};

Sim.BallLocalizer.Ball.prototype.addMeasurement = function(x, y, dt) {
	this.positions[this.positionCounter] = {x: x, y: y};
	this.positionCounter = (this.positionCounter + 1) % sim.conf.ballLocalizer.ballPositionAverages;
	this.updated = Sim.Util.getMicrotime();
	
	var position = this.getPosition();
	
	if (this.x != null && this.y != null) {
		this.velocityX = (position.x - this.x) / dt;
		this.velocityY = (position.y - this.y) / dt;
		
		//sim.dbg.box('#' + this.id, this.velocityX + ',' + this.velocityY);
	}
	
	this.x = position.x;
	this.y = position.y;
	this.removeTime = null;
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

Sim.BallLocalizer.Ball.prototype.interpolate = function(dt) {
	this.x += this.velocityX * dt;
	this.y += this.velocityY * dt;
	
	var xSign = this.velocityX > 0 ? 1 : -1,
		ySign = this.velocityY > 0 ? 1 : -1,
		stepDrag = sim.conf.ballLocalizer.ballDrag * dt;
	
	if (Math.abs(this.velocityX) > stepDrag) {
		this.velocityX -= stepDrag * xSign;
	} else {
		this.velocityX = 0;
	}
	
	if (Math.abs(this.velocityY) > stepDrag) {
		this.velocityY -= stepDrag * ySign;
	} else {
		this.velocityY = 0;
	}

	Sim.Math.collideWalls(this);
};

Sim.BallLocalizer.Ball.prototype.markForRemoval = function(seconds) {
	if (this.removeTime != null) {
		return;
	}
	
	this.removeTime = Sim.Util.getMicrotime() + seconds;
};

Sim.BallLocalizer.Ball.prototype.shouldBeRemoved = function() {
	return this.removeTime != null && this.removeTime < Sim.Util.getMicrotime();
};

Sim.BallLocalizer.prototype.update = function(
	robotX,
	robotY,
	robotOrientation,
	visibleBalls,
	cameraFOV,
	dt
) {
	var newBall,
		angle,
		closestBall,
		handledBalls = [],
		i;
	
	for (i = 0; i < visibleBalls.length; i++) {
		angle = robotOrientation + visibleBalls[i].angle;

		visibleBalls[i].x = robotX + Math.cos(angle) * visibleBalls[i].distance;
		visibleBalls[i].y = robotY + Math.sin(angle) * visibleBalls[i].distance;
		
		Sim.Util.confine(visibleBalls[i], 0, sim.conf.field.width, 0, sim.conf.field.height, sim.conf.ball.radius);
		
		closestBall = this.getBallAround(visibleBalls[i].x, visibleBalls[i].y);
		
		if (closestBall != null) {
			closestBall.addMeasurement(visibleBalls[i].x, visibleBalls[i].y, dt);
			
			handledBalls.push(closestBall.id);
		} else {
			newBall = new Sim.BallLocalizer.Ball(visibleBalls[i].x, visibleBalls[i].y);
			
			this.balls.push(newBall);
			
			handledBalls.push(newBall.id);
		}
	}
	
	for (i = 0; i < this.balls.length; i++) {
		if (handledBalls.indexOf(parseInt(this.balls[i].id)) != -1) {
			continue;
		}
		
		this.balls[i].interpolate(dt);
	}
	
	this.purge(visibleBalls, cameraFOV);
};

Sim.BallLocalizer.prototype.getBallAround = function(x, y) {
	var distance,
		ball,
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

Sim.BallLocalizer.prototype.purge = function(visibleBalls, cameraFOV) {
	var remainingBalls = [],
		i;
		
	for (i = 0; i < this.balls.length; i++) {
		if (!this.balls[i].shouldBeRemoved()) {
			remainingBalls.push(this.balls[i]);
		}
		
		if (!this.isValid(this.balls[i], visibleBalls, cameraFOV)) {
			this.balls[i].markForRemoval(sim.conf.ballLocalizer.ballRemoveTime);
		}
	}
	
	this.balls = remainingBalls;
};

Sim.BallLocalizer.prototype.isValid = function(ball, visibleBalls, cameraFOV) {
	if (Sim.Util.confine(ball, 0, sim.conf.field.width, 0, sim.conf.field.height, sim.conf.ball.radius)) {
		//return false;
	}
	
	var currentTime = Sim.Util.getMicrotime();
	
	if (currentTime - ball.updated > sim.conf.ballLocalizer.ballPurgeLifetime) {
		return false;
	}
	
	var velocityMagnitude = Sim.Math.getVectorLength(ball.velocityX, ball.velocityY);
	
	if (velocityMagnitude > sim.conf.ballLocalizer.ballMaxVelocity) {
		return false;
	}
	
	if (sim.game.isBallInYellowGoal(this) || sim.game.isBallInBlueGoal(this)) {
		return false;
	}
	
	if (cameraFOV.containsPoint(ball.x, ball.y)) {
		var ballNear = false,
			distance,
			nearestDistance = null,
			i;
		
		for (i = 0; i < visibleBalls.length; i++) {
			distance = Sim.Math.getDistanceBetween(ball, visibleBalls[i]);
			
			if (distance <= sim.conf.ballLocalizer.maxFovRemoveDistance) {
				ballNear = true;
				
				break;
			}
			
			if (nearestDistance == null || distance < nearestDistance) {
				nearestDistance = distance;
			}
		}
		
		if (!ballNear) {
			return false;
		}
	}
	
	return true;
};