Sim.Cmd = {};

/**
 * Turn by angle.
 */
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

Sim.Cmd.TurnBy.prototype.toString = function() {
	var angle = Sim.Math.round(Sim.Math.radToDeg(this.angle), 2),
		elapsed = Sim.Math.round(this.elapsed, 1),
		duration = Sim.Math.round(this.duration, 1),
		percent = Sim.Math.round(this.elapsed * 100 / this.duration, 0);
	
	return 'TurnBy ' + angle + ' ' + elapsed + '/' + duration + ' - ' + percent + '%';
};

/**
 * Drive-to coordinates
 */
Sim.Cmd.DriveTo = function(x, y, orientation, maxDuration, arrivedThreshold) {
	this.x = x;
	this.y = y;
	this.orientation = orientation || null;
	this.maxDuration = maxDuration || 5;
	this.arrivedThreshold = arrivedThreshold || 0.1;
	this.elapsed = 0;
};

Sim.Cmd.DriveTo.prototype.onStart = function(robot, dt) {
	
};

Sim.Cmd.DriveTo.prototype.step = function(robot, dt) {
	this.elapsed += dt;
	
	if (this.elapsed >= this.maxDuration) {
		return false;
	}
	
	var distance = Sim.Math.getDistanceBetween(robot, {x: this.x, y: this.y}),
		orientationDiff = Math.abs(robot.orientation - this.orientation) % (Math.PI * 2),
		omega = orientationDiff / distance,
		dir = Sim.Math.createDirVector(this, robot);
	
	if (this.orientation < robot.orientation) {
		omega *= -1.0;
	}
	
	if (distance < this.arrivedThreshold) {
		return false;
	}
	
	//sim.dbg.console('diff', Sim.Math.radToDeg(orientationDiff), omega);
	
	//dir = dir.rotate(this.orientation, {x: this.x, y: this.y});
	var targetDir = Sim.Math.rotatePoint(dir.x, dir.y, -robot.orientation);
	
	//sim.dbg.console('drive to', x, y, dir, this.orientation);
	
	robot.setTargetDir(targetDir.x, targetDir.y, omega);
	
	return true;
};

Sim.Cmd.DriveTo.prototype.onEnd = function(robot, dt) {
	robot.setTargetDir(0, 0, 0);
};

Sim.Cmd.DriveTo.prototype.toString = function() {
	var elapsed = Sim.Math.round(this.elapsed, 1),
		duration = Sim.Math.round(this.maxDuration, 1),
		percent = Sim.Math.round(this.elapsed * 100 / this.maxDuration, 0);
	
	return 'DriveTo ' + Sim.Math.round(this.x, 1) + 'x' + Sim.Math.round(this.y, 1) + ' ' + elapsed + '/' + duration + ' - ' + percent + '%';
};