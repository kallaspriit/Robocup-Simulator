Sim.Game = function() {
	this.robot = null;
	this.fpsCounter = null;
	this.targetFramerate = 60.0;
	this.timeStep = 1.0 / this.targetFramerate;
	this.lastStepTime = null;
	this.lastStepDuration = this.timeStep;
	this.fpsAdjustTime = 0;
};

Sim.Game.prototype = new Sim.EventTarget();

Sim.Game.Event = {
	ROBOT_UPDATED: 'robot-updated'
};

Sim.Game.prototype.init = function() {
	this.fpsCounter = new Sim.FpsCounter();
	this.robot = new Sim.Robot(0.125, 0.125, 0.12);
	
	this.robot.setDir(new Sim.Math.Vec2(0.1, 0.1), Math.PI * 2);
};

Sim.Game.prototype.step = function() {
	var time = Sim.Util.getMicrotime(),
		fps = this.fpsCounter.getLastFPS(),
		fpsDiff = this.targetFramerate - fps,
		dt;
		
	if (this.lastStepTime == null) {
		dt = this.timeStep;
	} else {
		dt = this.lastStepTime - time;
	}
	
	this.fpsCounter.step();
	this.robot.step(dt);
	
	this.fire({
		type: Sim.Game.Event.ROBOT_UPDATED,
		robot: this.robot
	});
	
	this.lastStepDuration = dt;
	
	this.fpsAdjustTime += fpsDiff * -0.0005;
	
	sim.dbg.box('FPS', fps, 2);
	sim.dbg.box('Adjust', this.fpsAdjustTime, 2);
};

Sim.Game.prototype.run = function() {
	var self = this;
	
	this.step();
	
	window.setTimeout(function() {
		self.run();
	}, this.timeStep * 1000 + this.fpsAdjustTime);
};