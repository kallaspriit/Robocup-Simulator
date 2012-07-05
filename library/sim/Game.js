Sim.Game = function() {
	this.robots = {};
	this.ghosts = {};
	this.balls = [];
	this.fpsCounter = null;
	this.timeStep = 1.0 / sim.conf.simulation.targetFramerate;
	this.lastStepTime = null;
	this.lastStepDuration = this.timeStep;
	this.fpsAdjustTime = 0;
	this.yellowScore = 0;
	this.blueScore = 0;
};

Sim.Game.prototype = new Sim.EventTarget();

Sim.Game.Event = {
	BALL_ADDED: 'ball-added',
	BALL_UPDATED: 'ball-updated',
	BALL_REMOVED: 'ball-removed',
	ROBOT_ADDED: 'robot-added',
	ROBOT_UPDATED: 'robot-updated',
	GHOST_ADDED: 'ghost-added',
	GHOST_UPDATED: 'ghost-updated',
	SCORE_CHANGED: 'score-changed'
};

Sim.Game.Side = {
	YELLOW: 'yellow',
	BLUE: 'blue'
};


Sim.Game.prototype.init = function() {
	this.fpsCounter = new Sim.FpsCounter();
	
	this.initBalls();
	this.initRobots();
};

Sim.Game.prototype.getRobot = function(name) {
	if (typeof(this.robots[name]) == 'object') {
		return this.robots[name];
	} else {
		return null;
	}
};

Sim.Game.prototype.getGhost = function(name) {
	if (typeof(this.ghosts[name]) == 'object') {
		return this.ghosts[name];
	} else {
		return null;
	}
};

Sim.Game.prototype.addBall = function(ball) {
	this.balls.push(ball);

	this.fire({
		type: Sim.Game.Event.BALL_ADDED,
		ball: ball
	});
};

Sim.Game.prototype.addRobot = function(name, robot) {
	this.robots[name] = robot;
	
	this.fire({
		type: Sim.Game.Event.ROBOT_ADDED,
		name: name,
		robot: robot
	});
};

Sim.Game.prototype.addGhost = function(name, ghost) {
	this.ghosts[name] = ghost;
	
	this.fire({
		type: Sim.Game.Event.GHOST_ADDED,
		name: name,
		ghost: ghost
	});
};

Sim.Game.prototype.initBalls = function() {
	for (var i = 0; i < 11; i++) {
		var x = Sim.Util.random(sim.conf.ball.radius * 1000, (sim.conf.field.width - sim.conf.ball.radius) * 1000) / 1000.0,
			y = Sim.Util.random(sim.conf.ball.radius * 1000, (sim.conf.field.height - sim.conf.ball.radius) * 1000) / 1000.0;
		
		this.addBall(new Sim.Ball(x, y));
	}
};

Sim.Game.prototype.initRobots = function() {
	var yellowGhost = new Sim.Ghost(
			Sim.Ghost.Type.YELLOW_ROBOT,
			sim.conf.yellowRobot.startX,
			sim.conf.yellowRobot.startY,
			sim.conf.yellowRobot.startOrientation
		),
		yellowRobot = new Sim.Robot(
			Sim.Game.Side.YELLOW,
			sim.conf.yellowRobot.startX,
			sim.conf.yellowRobot.startY,
			sim.conf.yellowRobot.startOrientation,
			sim.conf.yellowRobot.radius,
			sim.conf.yellowRobot.mass,
			sim.conf.yellowRobot.wheelRadius,
			sim.conf.yellowRobot.wheelOffset,
			sim.conf.yellowRobot.cameraDistance,
			sim.conf.yellowRobot.cameraWidth,
			sim.conf.yellowRobot.kickerForce,
			sim.conf.yellowRobot.dribblerAngle,
			sim.conf.yellowRobot.omegaDeviation,
			sim.conf.yellowRobot.distanceDeviation
		);
	
	this.addRobot(Sim.Game.Side.YELLOW, yellowRobot);
	this.addGhost(Sim.Game.Side.YELLOW, yellowGhost);
};

Sim.Game.prototype.step = function() {
	var time = Sim.Util.getMicrotime(),
		fps = this.fpsCounter.getLastFPS(),
		fpsDiff = sim.conf.simulation.targetFramerate - fps,
		dt;
	
	sim.dbg.box('FPS', fps, 2);
	//sim.dbg.box('Adjust', this.fpsAdjustTime * 1000, 1);
	//sim.dbg.box('Sleep', this.timeStep * 1000 + this.fpsAdjustTime * 1000, 1);
		
	if (this.lastStepTime == null) {
		dt = this.timeStep;
	} else {
		dt = time - this.lastStepTime;
	}
	
	this.fpsCounter.step();
	
	this.stepBalls(dt);
	this.stepRobots(dt);
	
	this.lastStepDuration = dt;
	this.lastStepTime = Sim.Util.getMicrotime();
	
	this.fpsAdjustTime += fpsDiff * -0.000001; // add PID
	
	if (this.fpsAdjustTime < -this.timeStep) {
		this.fpsAdjustTime = -this.timeStep;
	}
};

Sim.Game.prototype.stepBalls = function(dt) {
	var removeBalls = [];
	
	for (var i = 0; i < this.balls.length; i++) {
		for (var robotName in this.robots) {
			if (Sim.Math.collideCircles(this.balls[i], this.robots[robotName])) {
				sim.renderer.showCollisionAt(this.balls[i].x, this.balls[i].y);
				
				sim.dbg.console('collide', this.balls[i], this.robots[robotName]);
			}
		}
		
		for (var j = 0; j < this.balls.length; j++) {
			if (i == j) {
				continue;
			}
			
			if (Sim.Math.collideCircles(this.balls[i], this.balls[j])) {
				sim.dbg.console('collided', this.balls[i], this.balls[j]);
				
				sim.renderer.showCollisionAt(this.balls[i].x, this.balls[i].y);
			}
		}
		
		if (this.isBallInYellowGoal(this.balls[i])) {
			this.increaseBlueScore();
			
			removeBalls.push(i);
		} else if (this.isBallInBlueGoal(this.balls[i])) {
			this.increaseYellowScore();
			
			removeBalls.push(i);
		} else {
			this.balls[i].step(dt);

			if (Sim.Math.collideWalls(this.balls[i], dt)) {
				sim.renderer.showCollisionAt(this.balls[i].x, this.balls[i].y);
			}
		}
		
		this.fire({
			type: Sim.Game.Event.BALL_UPDATED,
			ball: this.balls[i]
		});
	}
	
	if (removeBalls.length > 0) {
		for (i = 0; i < removeBalls.length; i++) {
			this.balls[removeBalls[i]]._goaled = true;
			
			this.fire({
				type: Sim.Game.Event.BALL_REMOVED,
				ball: this.balls[removeBalls[i]]
			});
			
			this.balls.remove(removeBalls[i]);
		}
	}
};

Sim.Game.prototype.stepRobots = function(dt) {
	for (var name in this.robots) {
		var robot = this.robots[name],
			ghost = this.ghosts[name];
		
		robot.step(dt);
		
		if (typeof(ghost) == 'object') {
			ghost.update(
				robot.virtualX,
				robot.virtualY,
				robot.virtualOrientation,
				robot.virtualVelocityX,
				robot.virtualVelocityY
			);
		}
		
		this.fire({
			type: Sim.Game.Event.ROBOT_UPDATED,
			name: name,
			robot: robot
		});
		
		this.fire({
			type: Sim.Game.Event.GHOST_UPDATED,
			name: name,
			ghost: ghost
		});
	}
};

Sim.Game.prototype.isBallInYellowGoal = function(ball) {
	if (
		ball.x <= ball.radius
		&& ball.y >= sim.conf.field.height / 2 - sim.conf.field.goalWidth / 2
		&& ball.y <= sim.conf.field.height / 2 + sim.conf.field.goalWidth / 2
	) {
		return true;
	} else {
		return false;
	}
};

Sim.Game.prototype.isBallInBlueGoal = function(ball) {
	if (
		ball.x >= sim.conf.field.width - ball.radius
		&& ball.y >= sim.conf.field.height / 2 - sim.conf.field.goalWidth / 2
		&& ball.y <= sim.conf.field.height / 2 + sim.conf.field.goalWidth / 2
	) {
		return true;
	} else {
		return false;
	}
};

Sim.Game.prototype.increaseYellowScore = function() {
	this.yellowScore++;
	
	this.fire({
		type: Sim.Game.Event.SCORE_CHANGED,
		yellowScore: this.yellowScore,
		blueScore: this.blueScore
	});
};

Sim.Game.prototype.increaseBlueScore = function() {
	this.blueScore++;
	
	this.fire({
		type: Sim.Game.Event.SCORE_CHANGED,
		yellowScore: this.yellowScore,
		blueScore: this.blueScore
	});
};

Sim.Game.prototype.run = function() {
	var self = this;
	
	this.step();
	
	window.setTimeout(function() {
		self.run();
	}, this.timeStep * 1000 + this.fpsAdjustTime * 1000.0);
	
	/*window.requestAnimationFrame(function(time){
		self.run();
	});*/
};