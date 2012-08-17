Sim.JoystickController = function(robot) {
	this.robot = robot;
	this.joystick = null;
	this.gamepad = null;
	this.useGamepad = false;
	
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
	
	
	this.gamepad = new Gamepad();
	
	this.gamepad.bind(Gamepad.Event.CONNECTED, function(device) {
		sim.dbg.console('Controller connected', device);

		$('#gamepad').html(device.id);
	});

	this.gamepad.bind(Gamepad.Event.DISCONNECTED, function(device) {
		sim.dbg.console('Controller disconnected', device);
		
		$('#gamepad').html('Gamepad disconnected');
		
		self.useGamepad = false;
	});

	this.gamepad.bind(Gamepad.Event.UNSUPPORTED, function(device) {
		sim.dbg.console('Unsupported controller connected', device);
	});

	this.gamepad.bind(Gamepad.Event.TICK, function(gamepads) {
		if (gamepads[0].state.RIGHT_STICK_X != 0) {
			self.useGamepad = true;
		}
		
		if (!self.useGamepad) {
			return;
		}
		
		self.robot.setTargetDir(
			gamepads[0].state.RIGHT_STICK_Y * -2,
			gamepads[0].state.RIGHT_STICK_X * 2,
			gamepads[0].state.LEFT_STICK_X * 5
		);
			
		if (gamepads[0].state.LB || gamepads[0].state.RB) {
			self.robot.kick();
		}
			
		if (gamepads[0].state.Y) {
			sim.ui.restart();
		}
	});

	$('#gamepad').html('Your browser supports gamepads, try connecting one');

	if (!this.gamepad.init()) {
		$('#gamepad').html('If you use latest Google Chrome or Firefox, you can use gamepads..');
	}
};

Sim.JoystickController.prototype.step = function(dt) {
	
};