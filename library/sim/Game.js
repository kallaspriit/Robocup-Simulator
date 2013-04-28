Sim.Game = function() {
	this.robots = {};
	this.balls = [];
	this.controllers = [];
	this.fpsCounter = null;
	this.timeStep = 1.0 / sim.config.simulation.targetFramerate;
	this.lastStepTime = null;
	this.lastStepDuration = this.timeStep;
	this.fpsAdjustTime = 0;
	this.yellowScore = 0;
	this.blueScore = 0;
	this.duration = 0;
	this.ballCount = 0;
	this.remainingBallCount = 0;
	this.stepTimeout = null;
	this.running = false;
	this.paused = false;
};

Sim.Game.prototype = new Sim.EventTarget();

Sim.Game.Event = {
	BALL_ADDED: 'ball-added',
	BALL_UPDATED: 'ball-updated',
	BALL_REMOVED: 'ball-removed',
	ROBOT_ADDED: 'robot-added',
	ROBOT_UPDATED: 'robot-updated',
	SCORE_CHANGED: 'score-changed',
	RESTARTED: 'restarted',
	GAME_OVER: 'game-over'
};

Sim.Game.Side = {
	YELLOW: 'yellow',
	BLUE: 'blue'
};


Sim.Game.prototype.init = function() {
	this.fpsCounter = new Sim.FpsCounter();
	
	this.initBalls();
	//this.initRobots();
	//this.initControllers();
};

Sim.Game.prototype.start = function() {
	this.running = true;
	
	this.step();
};

Sim.Game.prototype.stop = function() {
	if (this.stepTimeout != null) {
		window.clearTimeout(this.stepTimeout);
		
		this.stepTimeout = null;
	}
};

Sim.Game.prototype.pause = function() {
	this.paused = true;
};

Sim.Game.prototype.resume = function() {
	this.paused = false;
};

Sim.Game.prototype.isPaused = function() {
	return this.paused;
};

Sim.Game.prototype.restart = function() {
	this.stop();
	
	this.robots = {};
	this.balls = [];
	this.lastStepTime = null;
	this.fpsAdjustTime = 0;
	this.yellowScore = 0;
	this.blueScore = 0;
	this.stepTimeout = null;
	this.duration = 0;
	
	this.fire({
		type: Sim.Game.Event.RESTARTED
	});
	
	this.init();
	this.start();
};

Sim.Game.prototype.getRobot = function(name) {
	if (typeof(this.robots[name]) == 'object') {
		return this.robots[name];
	} else {
		return null;
	}
};

Sim.Game.prototype.addBall = function(ball) {
	this.balls.push(ball);
	this.ballCount++;
	this.remainingBallCount++;

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

Sim.Game.prototype.initBalls = function() {
	if (sim.config.game.randomBalls) {
		for (var i = 0; i < Math.floor(sim.config.game.balls / 2); i++) {
			var x = Sim.Util.random(sim.config.ball.radius * 1000, (sim.config.field.width / 2.0 - sim.config.ball.radius) * 1000) / 1000.0,
				y = Sim.Util.random(sim.config.ball.radius * 1000, (sim.config.field.height - sim.config.ball.radius) * 1000) / 1000.0;

			this.addBall(new Sim.Ball(x, y));
			this.addBall(new Sim.Ball(sim.config.field.width - x, sim.config.field.height - y));
		}

		this.addBall(new Sim.Ball(sim.config.field.width / 2.0, sim.config.field.height / 2.0));

		/*var ballPositions = [];

		for (var i = 0; i < this.balls.length; i++) {
			ballPositions.push({
				x: this.balls[i].x,
				y: this.balls[i].y
			});
		}

		console.log(JSON.stringify(ballPositions, null, ' '));*/
	} else {
		var ballPositions = [
			{
				"x": 2.195,
				"y": 2.073
			},
			{
				"x": 2.305,
				"y": 0.927
			},
			{
				"x": 0.304,
				"y": 2.115
			},
			{
				"x": 4.196,
				"y": 0.8849999999999998
			},
			{
				"x": 0.968,
				"y": 1.979
			},
			{
				"x": 3.532,
				"y": 1.021
			},
			{
				"x": 2.077,
				"y": 1.212
			},
			{
				"x": 2.423,
				"y": 1.788
			},
			{
				"x": 1.115,
				"y": 2.406
			},
			{
				"x": 3.385,
				"y": 0.5939999999999999
			},
			{
				"x": 2.25,
				"y": 1.5
			}
		];

		for (var i = 0; i < ballPositions.length; i++) {
			this.addBall(new Sim.Ball(ballPositions[i].x, ballPositions[i].y));
		}
	}
};

Sim.Game.prototype.initRobots = function(yellowSmart, blueSmart) {
	if (sim.config.yellowRobot.use) {
		this.addRobot('yellow', new Sim.Robot(
			Sim.Game.Side.YELLOW,
			sim.config.yellowRobot.startX,
			sim.config.yellowRobot.startY,
			sim.config.yellowRobot.startOrientation,
			yellowSmart,
			sim.config.yellowRobot
		));
	}

	if (sim.config.blueRobot.use) {
		this.addRobot('blue', new Sim.Robot(
			Sim.Game.Side.BLUE,
			sim.config.blueRobot.startX,
			sim.config.blueRobot.startY,
			sim.config.blueRobot.startOrientation,
			blueSmart,
			sim.config.blueRobot
		));
	}
};

Sim.Game.prototype.initControllers = function() {
	var yellowController = new Sim.SimpleAI(this.getRobot('yellow')),
		blueController1 = new Sim.KeyboardController(this.getRobot('blue')),
		blueController2 = new Sim.JoystickController(this.getRobot('blue'));
	
	this.addController(yellowController);
	this.addController(blueController1);
	this.addController(blueController2);
};

Sim.Game.prototype.addController = function(controller) {
	this.controllers.push(controller);
};

Sim.Game.prototype.step = function() {
	var self = this;

	if (this.paused) {
		this.lastStepTime = null;
	} else {
		var time = Sim.Util.getMicrotime(),
			fps = this.fpsCounter.getLastFPS(),
			fpsDiff = sim.config.simulation.targetFramerate - fps,
			delay,
			dt;

		sim.dbg.box('FPS', fps, 2);
		//sim.dbg.box('Adjust', this.fpsAdjustTime * 1000, 1);
		//sim.dbg.box('Sleep', this.timeStep * 1000 + this.fpsAdjustTime * 1000, 1);

		/*if (sim.config.simulation.maxSpeed) {
			dt = this.timeStep;
		} else {
			if (this.lastStepTime == null) {
				dt = this.timeStep;
			} else {
				dt = time - this.lastStepTime;
			}
		}*/

		dt = this.timeStep;

		this.duration += dt;

		this.fpsCounter.step();

		this.stepBalls(dt);
		this.stepRobots(dt);
		this.stepControllers(dt);
		this.stepUI(dt);

		this.lastStepDuration = dt;
		this.lastStepTime = Sim.Util.getMicrotime();

		this.fpsAdjustTime += fpsDiff * -0.000001; // add PID

		if (this.fpsAdjustTime < -this.timeStep) {
			this.fpsAdjustTime = -this.timeStep;
		}
	}
	
	if (this.running) {
		if (sim.config.simulation.maxSpeed) {
			delay = 0;
		} else {
			delay = this.timeStep * 1000 + this.fpsAdjustTime * 1000.0;
		}

		this.stepTimeout = window.setTimeout(function() {
			self.step();
		}, delay);
	}
};

Sim.Game.prototype.stepBalls = function(dt) {
	var removeBalls = [];
	
	for (var i = 0; i < this.balls.length; i++) {
		for (var robotName in this.robots) {
			if (Sim.Math.collideCircles(this.balls[i], this.robots[robotName])) {
				sim.renderer.showCollisionAt(this.balls[i].x, this.balls[i].y);
			}
		}
		
		for (var j = 0; j < this.balls.length; j++) {
			if (i == j) {
				continue;
			}
			
			if (Sim.Math.collideCircles(this.balls[i], this.balls[j])) {
				//sim.dbg.console('collided', this.balls[i], this.balls[j]);
				
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

			if (sim.config.game.useWalls && Sim.Math.collideWalls(this.balls[i])) {
				sim.renderer.showCollisionAt(this.balls[i].x, this.balls[i].y);
			}
			
			var x = this.balls[i].x,
				y = this.balls[i].y,
				t = sim.config.game.ballRemoveThreshold;
			
			if (
				x < -t
				|| x > sim.config.field.width + t
				|| y < -t
				|| y > sim.config.field.height + t
			) {
				removeBalls.push(i);
				
				this.remainingBallCount--;
			}
		}
		
		this.fire({
			type: Sim.Game.Event.BALL_UPDATED,
			ball: this.balls[i]
		});
	}
	
	if (removeBalls.length > 0) {
		for (i = 0; i < removeBalls.length; i++) {
			if (typeof(this.balls[removeBalls[i]]) == 'object') {
				this.balls[removeBalls[i]]._goaled = true;
			}
			
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
		var robot = this.robots[name];
		
		robot.step(dt);
		
		this.fire({
			type: Sim.Game.Event.ROBOT_UPDATED,
			name: name,
			robot: robot
		});
	}
};

Sim.Game.prototype.stepControllers = function(dt) {
	for (var i = 0; i < this.controllers.length; i++) {
		this.controllers[i].step(dt);
	}
};

Sim.Game.prototype.stepUI = function(dt) {
	sim.dbg.step(dt);
};

Sim.Game.prototype.isBallInYellowGoal = function(ball) {
	if (
		ball.x <= ball.radius
		&& ball.y >= sim.config.field.height / 2 - sim.config.field.goalWidth / 2
		&& ball.y <= sim.config.field.height / 2 + sim.config.field.goalWidth / 2
	) {
		return true;
	} else {
		return false;
	}
};

Sim.Game.prototype.isBallInBlueGoal = function(ball) {
	if (
		ball.x >= sim.config.field.width - ball.radius
		&& ball.y >= sim.config.field.height / 2 - sim.config.field.goalWidth / 2
		&& ball.y <= sim.config.field.height / 2 + sim.config.field.goalWidth / 2
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
	
	this.checkScore();
};

Sim.Game.prototype.increaseBlueScore = function() {
	this.blueScore++;
	
	this.fire({
		type: Sim.Game.Event.SCORE_CHANGED,
		yellowScore: this.yellowScore,
		blueScore: this.blueScore
	});
	
	this.checkScore();
};

Sim.Game.prototype.checkScore = function() {
	var totalScore = this.yellowScore + this.blueScore;

	if (totalScore >= this.remainingBallCount) {
		this.stop();
		
		this.fire({
			type: Sim.Game.Event.GAME_OVER,
			yellowScore: this.yellowScore,
			blueScore: this.blueScore,
			duration: this.duration
		})
	}
};