Sim.Game = function() {
	this.robots = {};
	this.balls = [];
	this.fpsCounter = null;
	this.timeStep = 1.0 / sim.conf.simulation.targetFramerate;
	this.lastStepTime = null;
	this.lastStepDuration = this.timeStep;
	this.fpsAdjustTime = 0;
};

Sim.Game.prototype = new Sim.EventTarget();

Sim.Game.Event = {
	BALL_ADDED: 'ball-added',
	BALL_UPDATED: 'ball-updated',
	ROBOT_ADDED: 'robot-added',
	ROBOT_UPDATED: 'robot-updated'
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

Sim.Game.prototype.initBalls = function() {
	for (var i = 0; i < 11; i++) {
		var x = Sim.Util.random(sim.conf.ball.radius * 1000, (sim.conf.field.width - sim.conf.ball.radius) * 1000) / 1000.0,
			y = Sim.Util.random(sim.conf.ball.radius * 1000, (sim.conf.field.height - sim.conf.ball.radius) * 1000) / 1000.0;
		
		this.addBall(new Sim.Ball(x, y));
	}
};

Sim.Game.prototype.initRobots = function() {
	var yellowRobot = new Sim.Robot(
		Sim.Game.Side.YELLOW,
		0.125,
		0.125,
		Math.PI / 4
	);
		
	this.addRobot(Sim.Game.Side.YELLOW, yellowRobot);
};

Sim.Game.prototype.step = function() {
	var time = Sim.Util.getMicrotime(),
		fps = this.fpsCounter.getLastFPS(),
		fpsDiff = sim.conf.simulation.targetFramerate - fps,
		dt;
	
	sim.dbg.box('FPS', fps, 2);
	sim.dbg.box('Adjust', this.fpsAdjustTime * 1000, 1);
	sim.dbg.box('Sleep', this.timeStep * 1000 + this.fpsAdjustTime * 1000, 1);
		
	if (this.lastStepTime == null) {
		dt = this.timeStep;
	} else {
		dt = time - this.lastStepTime;
	}
	
	this.fpsCounter.step();
	
	for (var i = 0; i < this.balls.length; i++) {
		this.balls[i].step(dt);
		
		this.fire({
			type: Sim.Game.Event.BALL_UPDATED,
			ball: this.balls[i]
		});
	}
	
	for (var name in this.robots) {
		var robot = this.robots[name];
		
		robot.step(dt);
		
		Sim.Util.confine(
			robot, 
			0,
			sim.conf.field.width,
			0,
			sim.conf.field.height,
			robot.radius
		);
		
		this.fire({
			type: Sim.Game.Event.ROBOT_UPDATED,
			name: name,
			robot: robot
		});
	}
	
	this.lastStepDuration = dt;
	this.lastStepTime = Sim.Util.getMicrotime();
	
	this.fpsAdjustTime += fpsDiff * -0.000001; // add PID
	
	if (this.fpsAdjustTime < -this.timeStep) {
		this.fpsAdjustTime = -this.timeStep;
	}
};

Sim.Game.prototype.run = function() {
	var self = this;
	
	this.step();
	
	window.setTimeout(function() {
		self.run();
	}, this.timeStep * 1000 + this.fpsAdjustTime * 1000.0);
};