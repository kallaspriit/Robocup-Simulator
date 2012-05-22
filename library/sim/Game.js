Sim.Game = function() {
	this.robots = {};
	this.fpsCounter = null;
	this.targetFramerate = 60.0;
	this.timeStep = 1.0 / this.targetFramerate;
	this.lastStepTime = null;
	this.lastStepDuration = this.timeStep;
	this.fpsAdjustTime = 0;
};

Sim.Game.prototype = new Sim.EventTarget();

Sim.Game.Event = {
	ROBOT_ADDED: 'robot-added',
	ROBOT_UPDATED: 'robot-updated'
};

Sim.Game.Side = {
	YELLOW: 'yellow',
	BLUE: 'blue'
};

Sim.Game.prototype.getRobot = function(name) {
	if (typeof(this.robots[name]) == 'object') {
		return this.robots[name];
	} else {
		return null;
	}
};

Sim.Game.prototype.addRobot = function(name, robot) {
	this.robots[name] = robot;
	
	this.fire({
		type: Sim.Game.Event.ROBOT_ADDED,
		name: name,
		robot: robot
	});
};

Sim.Game.prototype.init = function() {
	this.fpsCounter = new Sim.FpsCounter();
	
	this.initRobots();
};

Sim.Game.prototype.initRobots = function() {
	var yellowRobot = new Sim.Robot(
		0.125,
		Sim.Game.Side.YELLOW,
		0.125,
		0.125,
		0
	);
		
	this.addRobot(Sim.Game.Side.YELLOW, yellowRobot);
};

Sim.Game.prototype.step = function() {
	var time = Sim.Util.getMicrotime(),
		fps = this.fpsCounter.getLastFPS(),
		fpsDiff = this.targetFramerate - fps,
		dt;
	
	sim.dbg.box('FPS', fps, 2);
	//sim.dbg.box('Adjust', this.fpsAdjustTime, 2);
		
	if (this.lastStepTime == null) {
		dt = this.timeStep;
	} else {
		dt = time - this.lastStepTime;
	}
	
	this.fpsCounter.step();
	
	for (var name in this.robots) {
		var robot = this.robots[name];
		
		robot.step(dt);
		
		this.confine(robot, {
			xMin: robot.radius,
			xMax: sim.conf.field.width - robot.radius,
			yMin: robot.radius,
			yMax: sim.conf.field.height - robot.radius
		});
		
		this.fire({
			type: Sim.Game.Event.ROBOT_UPDATED,
			name: name,
			robot: robot
		});
	}
	
	this.lastStepDuration = dt;
	this.lastStepTime = Sim.Util.getMicrotime();
	
	this.fpsAdjustTime += fpsDiff * -0.0005; // add PID
	
	if (this.fpsAdjustTime < -this.timeStep) {
		this.fpsAdjustTime = -this.timeStep;
	}
};

Sim.Game.prototype.confine = function(obj, box) {
	if (obj.x < box.xMin) {
		obj.x = box.xMin;
	} else if (obj.x > box.xMax) {
		obj.x = box.xMax;
	}
	
	if (obj.y < box.yMin) {
		obj.y = box.yMin;
	} else if (obj.y > box.yMax) {
		obj.y = box.yMax;
	}
};

Sim.Game.prototype.run = function() {
	var self = this;
	
	this.step();
	
	window.setTimeout(function() {
		self.run();
	}, this.timeStep * 1000 + this.fpsAdjustTime);
};