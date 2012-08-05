Sim.UI = function() {
	this.movementJoystick = null;
	this.forwardDown = false;
	this.keystates = {};
};

Sim.UI.prototype = new Sim.EventTarget();

Sim.UI.Event = {};

Sim.UI.prototype.init = function() {
	this.initDebugListener();
	this.initEventListeners();
	this.initFullscreenToggle();
	this.initMovementJoystick();
	this.initKeyboardControls();
	this.initTools();
};

Sim.UI.prototype.initDebugListener = function() {
	sim.dbg.bind(Sim.Debug.Event.CONSOLE, function(event) {
		if (
			typeof(console) == 'object'
			&& typeof(console.log) == 'function'
		) {
			var time = Sim.Util.getTime();

			var args = [time];
			
			for (var i = 0; i < event.args.length; i++) {
				args.push(event.args[i]);
			}
			
			console.log.apply(console, args);
		}
	});
	
	sim.dbg.bind(Sim.Debug.Event.ERROR, function(event) {
		if (
			typeof(console) == 'object'
			&& typeof(console.log) == 'function'
		) {
			var time = Sim.Util.getTime();

			var args = [time];
			
			for (var i = 0; i < event.args.length; i++) {
				args.push(event.args[i]);
			}
			
			console.error.apply(console, args);
		}
	});
};

Sim.UI.prototype.initEventListeners = function() {
	sim.renderer.bind(Sim.Renderer.Event.DRIVE_TO_REQUESTED, function(e) {
		sim.game.getRobot(Sim.Game.Side.YELLOW).driveTo(e.x, e.y, e.orientation);
	});
	
	sim.renderer.bind(Sim.Renderer.Event.SPAWN_BALL_REQUESTED, function(e) {
		sim.game.addBall(new Sim.Ball(e.x, e.y));
	});
};

Sim.UI.prototype.initMovementJoystick = function() {
	this.movementJoystick = new Sim.UI.Joystick('movement-joystick');
	
	this.movementJoystick.onMove(function(xPos, yPos) {
		sim.game.getRobot(Sim.Game.Side.YELLOW).setTargetDir(-yPos, xPos);
	}).onBlur(function() {
		sim.game.getRobot(Sim.Game.Side.YELLOW).setTargetDir(0, 0);
	}).onMouseWheel(function(event, delta, deltaX, deltaY) {
		sim.game.getRobot(Sim.Game.Side.YELLOW).turnBy(Math.PI / 4 * delta, 0.25);
	});
};

Sim.UI.prototype.initKeyboardControls = function() {
	var self = this;

	$(window).keydown(function(e) {
		if (typeof(self.keystates[e.keyCode]) == 'undefined' || self.keystates[e.keyCode] == false) {
			self.keystates[e.keyCode] = true;
			
			self.onKeyDown(e.keyCode);
		}
	});
	
	$(window).keyup(function(e) {
		if (typeof(self.keystates[e.keyCode]) == 'undefined' || self.keystates[e.keyCode] == true) {
			self.keystates[e.keyCode] = false;
			
			self.onKeyUp(e.keyCode);
		}
	});
	
	$(window).blur(function() {
		for (var key in self.keystates) {
			if (self.keystates[key] == true) {
				self.onKeyUp(key);
			}
		}
		
		self.keystates = {};
	});
};

Sim.UI.prototype.onKeyDown = function(key) {
	sim.dbg.console('Key down', key);
	
	this.updateRobotDir();
	
	if (key == 32) {
		sim.game.robots.yellow.kick();
	} else if (key == 97 ||key == 49) {
		sim.renderer.showDriveTo();
	} else if (key == 98 ||key == 50) {
		sim.renderer.showSpawnBall();
	} else if (key == 99 ||key == 51) {
		sim.game.getRobot(Sim.Game.Side.YELLOW).resetDeviation();
	} else if (key == 100 ||key == 52) {
		this.showNoiseDialog();
	} else if (key == 27) {
		sim.renderer.cancelActions();
	} else if (key == 53) {
		sim.renderer.toggleParticles();
	} else if (key == 54) {
		sim.game.getRobot(Sim.Game.Side.YELLOW).togglePerfectLocalization();
	} else if (key == 55) {
		sim.game.getRobot(Sim.Game.Side.YELLOW).toggleAI();
	}
};

Sim.UI.prototype.onKeyUp = function(key) {
	//sim.dbg.console('Key up', key);
	
	this.updateRobotDir();
};

Sim.UI.prototype.isKeyDown = function(key) {
	return typeof(this.keystates[key]) != 'undefined' && this.keystates[key] == true;
};

Sim.UI.prototype.initTools = function() {
	var self = this;
	
	$('#drive-to-btn').click(function() {
		sim.renderer.showDriveTo();
	});
	
	$('#spawn-ball-btn').click(function() {
		sim.renderer.showSpawnBall();
	});
	
	$('#reset-deviation-btn').click(function() {
		sim.game.getRobot(Sim.Game.Side.YELLOW).resetDeviation();
	});
	
	$('#set-noise-btn').click(function() {
		self.showNoiseDialog();
	});
	
	$('#toggle-particles-btn').click(function() {
		sim.renderer.toggleParticles();
	});
	
	$('#toggle-perfect-localization-btn').click(function() {
		sim.game.getRobot(Sim.Game.Side.YELLOW).togglePerfectLocalization();
	});
	
	$('#toggle-ai-btn').click(function() {
		sim.game.getRobot(Sim.Game.Side.YELLOW).toggleAI();
	});
};

Sim.UI.prototype.initFullscreenToggle = function() {
	
};

Sim.UI.prototype.showNoiseDialog = function() {
	var robot = sim.game.getRobot(Sim.Game.Side.YELLOW),
		newLevel = parseFloat(window.prompt('Enter new noise level', robot.omegaDeviation));

	robot.omegaDeviation = newLevel;
	robot.resetDeviation();
};

Sim.UI.prototype.updateRobotDir = function() {
	
	var forwardDown = this.isKeyDown(87),
		leftDown = this.isKeyDown(65),
		reverseDown = this.isKeyDown(83),
		rightDown = this.isKeyDown(68),
		turnRightDown = this.isKeyDown(69),
		turnLeftDown = this.isKeyDown(81),
		shiftDown = this.isKeyDown(16),
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
	
	sim.game.getRobot(Sim.Game.Side.YELLOW).setTargetDir(x, y, omega);
};

Sim.UI.Joystick = function(
	id,
	focusCallback,
	moveCallback,
	blurCallback,
	mouseWheelCallback
) {
	this.id = id;
	this.focusCallback = focusCallback;
	this.moveCallback = moveCallback;
	this.blurCallback = blurCallback;
	this.mouseWheelCallback = mouseWheelCallback;
	
	this.dragging = false;
	this.offsetX = 0;
	this.offsetY = 0;
	this.handleWidth = 0;
	this.handleHeight = 0;
	
	this.init();
};

Sim.UI.Joystick.prototype.init = function() {
	this.container = $('#' + this.id);
	this.handle = this.container.find('A');
	
	this.handleWidth = this.handle.width();
	this.handleHeight = this.handle.height();
	
	var self = this;
	
	this.handle.click(function() {
		return false;
	});
	
	this.handle.mousedown(function(e) {
		self.offsetX = e.offsetX;
		self.offsetY = e.offsetY;
		self.dragging = true;
		
		if (typeof(self.focusCallback) == 'function') {
			self.focusCallback();
		}
	});
	
	$(document.body).mouseup(function(e) {
		if (!self.dragging) {
			return;
		}
		
		self.dragging = false;
		
		var parentWidth = self.container.width(),
			parentHeight = self.container.height();
		
		self.handle.animate({
			left: parentWidth / 2,
			top: parentHeight / 2
		}, 100, function() {
			if (typeof(self.blurCallback) == 'function') {
				self.blurCallback();
			}
		});
	});
	
	$(document.body).mousemove(function(e) {
		if (!self.dragging) {
			return;
		}
		
		var parentOffset = self.container.offset(),
			parentWidth = self.container.width(),
			parentHeight = self.container.height(),
			left = e.clientX - parentOffset.left - self.offsetX + self.handleWidth / 4,
			top = e.clientY - parentOffset.top - self.offsetY + self.handleHeight / 4;
		
		if (left < 0) {
			left = 0;
		} else if (left > parentWidth) {
			left = parentWidth
		}
		
		if (top < 0) {
			top = 0;
		} else if (top > parentHeight) {
			top = parentHeight
		}
		
		var xOffset = left - parentWidth / 2,
			yOffset = top - parentHeight / 2;
		
		self.handle.css({
			'left': left + 'px',
			'top': top + 'px'
		});
		
		if (typeof(self.moveCallback) == 'function') {
			self.moveCallback(xOffset / (parentWidth / 2), yOffset / (parentHeight / 2));
		}
	});
	
	$(window).mousewheel(function(event, delta, deltaX, deltaY) {
		if (!self.dragging) {
			return;
		}
		
		if (typeof(self.mouseWheelCallback) == 'function') {
			self.mouseWheelCallback(event, delta, deltaX, deltaY);
		}
	});
};

Sim.UI.Joystick.prototype.onFocus = function(listener) {
	this.focusCallback = listener;
	
	return this;
};

Sim.UI.Joystick.prototype.onMove = function(listener) {
	this.moveCallback = listener;
	
	return this;
};

Sim.UI.Joystick.prototype.onBlur = function(listener) {
	this.blurCallback = listener;
	
	return this;
};

Sim.UI.Joystick.prototype.onMouseWheel = function(listener) {
	this.mouseWheelCallback = listener;
	
	return this;
};