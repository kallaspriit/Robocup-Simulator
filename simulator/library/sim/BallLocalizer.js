Sim.BallLocalizer = function() {
	this.balls = [];
};

Sim.BallLocalizer.BallId = 0;

Sim.BallLocalizer.Ball = function(x, y, distance, angle) {
	this.id = Sim.BallLocalizer.BallId++;
	this.positions = [];
	this.velocities = [];
	this.positionCounter = 0;
	this.velocityCounter = 0;
	this.created = Sim.Util.getMicrotime();
	this.updated = this.created;
	this.x = null;
	this.y = null;
	this.distance = null;
	this.angle = null;
	this.elasticity = sim.config.ballLocalizer.ballElasticity;
	this.radius = sim.config.ball.radius;
	this.velocityX = 0;
	this.velocityY = 0;
	this.removeTime = null;
	
	this.addMeasurement(x, y, distance, angle);
};

Sim.BallLocalizer.Ball.prototype.addMeasurement = function(x, y, distance, angle, dt) {
	var currentTime = Sim.Util.getMicrotime(),
		sinceLastUpdate = currentTime - this.updated;
		
	this.positions[this.positionCounter] = {x: x, y: y};
	this.positionCounter = (this.positionCounter + 1) % sim.config.ballLocalizer.ballPositionAverages;
	this.updated = currentTime;
	
	var position = this.getPosition();
	
	if (this.x != null && this.y != null && sinceLastUpdate <= sim.config.ballLocalizer.velocityUpdateMaxTime) {
		var velocityX = (position.x - this.x) / dt,
			velocityY = (position.y - this.y) / dt;
		
		this.velocities[this.velocityCounter] = {x: velocityX, y: velocityY};
		this.velocityCounter = (this.velocityCounter + 1) % sim.config.ballLocalizer.ballVelocityAverages;
		
		var velocity = this.getVelocity();
		
		this.velocityX = velocity.x;
		this.velocityY = velocity.y;
	}
	
	this.x = position.x;
	this.y = position.y;
	this.distance = distance;
	this.angle = angle;
	this.removeTime = null;
	this.visible = true;
};

Sim.BallLocalizer.Ball.prototype.getPosition = function() {
	var xSum = 0,
		ySum = 0,
		samples = 0;
	
	for (var i = 0; i < sim.config.ballLocalizer.ballPositionAverages; i++) {
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

Sim.BallLocalizer.Ball.prototype.getVelocity = function() {
	var xSum = 0,
		ySum = 0,
		samples = 0;
	
	for (var i = 0; i < sim.config.ballLocalizer.ballVelocityAverages; i++) {
		if (typeof(this.velocities[i]) != 'object') {
			continue;
		}
		
		xSum += this.velocities[i].x;
		ySum += this.velocities[i].y;
		
		samples++;
	}
	
	return {
		x: xSum / samples,
		y: ySum / samples
	};
};

Sim.BallLocalizer.Ball.prototype.stepNotVisible = function(dt) {
	/*
	this.x += this.velocityX * dt;
	this.y += this.velocityY * dt;
	
	var xSign = this.velocityX > 0 ? 1 : -1,
		ySign = this.velocityY > 0 ? 1 : -1,
		stepDrag = sim.config.ballLocalizer.ballDrag * dt;
	
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
	*/
    
	this.distance = null;
	this.angle = null;
	this.visible = false;
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
		
		//Sim.Util.confine(visibleBalls[i], 0, sim.config.field.width, 0, sim.config.field.height, sim.config.ball.radius);
		
		closestBall = this.getBallAround(visibleBalls[i].x, visibleBalls[i].y);
		
		if (closestBall != null) {
			closestBall.addMeasurement(visibleBalls[i].x, visibleBalls[i].y, visibleBalls[i].distance, visibleBalls[i].angle, dt);
			
			handledBalls.push(closestBall.id);
		} else {
			newBall = new Sim.BallLocalizer.Ball(visibleBalls[i].x, visibleBalls[i].y, visibleBalls[i].distance, visibleBalls[i].angle);
			
			this.balls.push(newBall);
			
			handledBalls.push(newBall.id);
		}
	}
	
	for (i = 0; i < this.balls.length; i++) {
		if (handledBalls.indexOf(parseInt(this.balls[i].id)) != -1) {
			continue;
		}
		
		this.balls[i].stepNotVisible(dt);
	}
    
	this.purge(visibleBalls, cameraFOV);
};

Sim.BallLocalizer.prototype.getBallInfo = function(id) {
	for (var i = 0; i < this.balls.length; i++) {
		if (this.balls[i].id == id) {
			return this.balls[i];
		}
	}
	
	return null;
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
			distance <= sim.config.ballLocalizer.maxBallIdentityDistance
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
			this.balls[i].markForRemoval(sim.config.ballLocalizer.ballRemoveTime);
		}
	}
	
	this.balls = remainingBalls;
};

Sim.BallLocalizer.prototype.isValid = function(ball, visibleBalls, cameraFOV) {
	/*if (Sim.Util.confine(ball, 0, sim.config.field.width, 0, sim.config.field.height, sim.config.ball.radius)) {
		return false;
	}*/
	
	var currentTime = Sim.Util.getMicrotime();
	
	if (currentTime - ball.updated > sim.config.ballLocalizer.ballPurgeLifetime) {
		return false;
	}
	
	var velocityMagnitude = Sim.Math.getVectorLength(ball.velocityX, ball.velocityY);
	
	if (velocityMagnitude > sim.config.ballLocalizer.ballMaxVelocity) {
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
			
			if (distance <= sim.config.ballLocalizer.maxFovRemoveDistance) {
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