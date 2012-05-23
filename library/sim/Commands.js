Sim.Cmd = {};

Sim.Cmd.TurnBy = function(angle, duration) {
	this.angle = angle;
	this.duration = duration;
	this.elapsed = 0;
};

Sim.Cmd.TurnBy.prototype.onStart = function(robot, dt) {
	robot.setTargetOmega(this.angle / this.duration);
};

Sim.Cmd.TurnBy.prototype.step = function(robot, dt) {
	this.elapsed += dt;
	
	if (this.elapsed >= this.duration) {
		return false;
	}
	
	return true;
};

Sim.Cmd.TurnBy.prototype.onEnd = function(robot, dt) {
	robot.setTargetOmega(0);
};