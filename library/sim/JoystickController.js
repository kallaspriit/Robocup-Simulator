Sim.JoystickController = function(robot) {
	this.robot = robot;
	this.joystick = null;
	
	this.init();
};

Sim.JoystickController.prototype.init = function() {
	var self = this;
	
	this.joystick = new Sim.UI.Joystick(
		'movement-joystick',
		this.robot.side
	);
	
	this.joystick.onMove(function(xPos, yPos) {
		self.robot.setTargetDir(-yPos, xPos);
	}).onBlur(function() {
		self.robot.setTargetDir(0, 0);
	}).onMouseWheel(function(event, delta, deltaX, deltaY) {
		self.robot.turnBy(Math.PI / 4 * delta, 0.25);
	}).init();
};

Sim.JoystickController.prototype.step = function(dt) {
	
};