Sim.KeyboardController = function(robot) {
	this.robot = robot;
	
	this.initEventListeners();
	this.initTools();
};

Sim.KeyboardController.prototype.initEventListeners = function() {
	var self = this;
	
	sim.renderer.bind(Sim.Renderer.Event.DRIVE_TO_REQUESTED, function(e) {
		self.robot.driveTo(e.x, e.y, e.orientation);
	});
	
	sim.ui.bind(Sim.UI.Event.KEY_DOWN, function(e) {
		self.onKeyDown(e.key);
	});
	
	sim.ui.bind(Sim.UI.Event.KEY_UP, function(e) {
		self.onKeyUp(e.key);
	});
};

Sim.KeyboardController.prototype.initTools = function() {
	sim.ui.createTool(
		'DriveTo',
		function() {
			sim.renderer.showDriveTo();
		}
	);
};

Sim.KeyboardController.prototype.onKeyDown = function(key) {
	if (key == 32) {
		this.robot.kick();
	}
	
	this.updateRobotDir();
};

Sim.KeyboardController.prototype.onKeyUp = function(key) {
	this.updateRobotDir();
};

Sim.KeyboardController.prototype.updateRobotDir = function() {
	var forwardDown = sim.ui.isKeyDown(87),
		leftDown = sim.ui.isKeyDown(65),
		reverseDown = sim.ui.isKeyDown(83),
		rightDown = sim.ui.isKeyDown(68),
		turnRightDown = sim.ui.isKeyDown(69),
		turnLeftDown = sim.ui.isKeyDown(81),
		shiftDown = sim.ui.isKeyDown(16),
		speed = shiftDown ? 2.5 : 1,
		turnRate = Math.PI,
		x = 0,
		y = 0,
		omega = 0;
	
	if (forwardDown) {
		x = speed;
	} else if (reverseDown) {
		x = -speed;
	}
	
	if (rightDown) {
		y = speed;
	} else if (leftDown) {
		y = -speed;
	}
	
	if (turnRightDown) {
		omega = turnRate;
	} else if (turnLeftDown) {
		omega = -turnRate;
	}
	
	this.robot.setTargetDir(x, y, omega);
};

Sim.KeyboardController.prototype.step = function(dt) {
	
};