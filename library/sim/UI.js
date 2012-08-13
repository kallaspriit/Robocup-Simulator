Sim.UI = function() {
	this.keystates = {};
	this.tools = [];
	this.toolKeys = {
		1: [49, 97],
		2: [50, 98],
		3: [51, 99],
		4: [52, 100],
		5: [53, 101],
		6: [54, 102],
		7: [55, 103],
		8: [56, 104],
		9: [57, 105]
	};
};

Sim.UI.prototype = new Sim.EventTarget();

Sim.UI.Event = {
	KEY_DOWN: 'key-down',
	KEY_UP: 'key-up'
};

Sim.UI.prototype.init = function() {
	this.initDebugListener();
	this.initFullscreenToggle();
	this.initKeyboardControls();
	this.initEventListeners();
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

Sim.UI.prototype.initEventListeners = function() {
	sim.renderer.bind(Sim.Renderer.Event.SPAWN_BALL_REQUESTED, function(e) {
		sim.game.addBall(new Sim.Ball(e.x, e.y));
	});
};

Sim.UI.prototype.onKeyDown = function(key) {
	sim.dbg.console('Key down', key);
	
	/*if (key == 97 ||key == 49) {
		sim.renderer.showDriveTo();
	} else if (key == 98 ||key == 50) {
		sim.renderer.showSpawnBall();
	} else if (key == 100 ||key == 52) {
		this.showNoiseDialog();
	} else if (key == 27) {
		sim.renderer.cancelActions();
	} else if (key == 53) {
		sim.renderer.toggleParticles();
	} else if (key == 99 ||key == 51) {
		sim.game.getRobot('yellow').resetDeviation();
		sim.game.getRobot('blue').resetDeviation();
	} else if (key == 54) {
		sim.game.getRobot('yellow').togglePerfectLocalization();
		sim.game.getRobot('blue').togglePerfectLocalization();
	}*/
	
	for (var i = 0; i < this.tools.length; i++) {
		var keys = this.toolKeys[this.tools[i].nr];
		
		for (var j = 0; j < keys.length; j++) {
			if (keys[j] == key) {
				this.tools[i].callback.call(this.tools[i]);
				
				break;
			}
		}
	}
	
	this.fire({
		type: Sim.UI.Event.KEY_DOWN,
		key: key
	});
};

Sim.UI.prototype.onKeyUp = function(key) {
	this.fire({
		type: Sim.UI.Event.KEY_UP,
		key: key
	});
};

Sim.UI.prototype.isKeyDown = function(key) {
	return typeof(this.keystates[key]) != 'undefined' && this.keystates[key] == true;
};

Sim.UI.prototype.initTools = function() {
	var self = this;
	
	this.createTool('Pause', function() {
		if (sim.game.isPaused()) {
			sim.game.resume();
			
			this.btn.html(this.nr + '. Pause');
		} else {
			sim.game.pause();
			
			this.btn.html(this.nr + '. Resume');
		}
	});
	
	this.createTool('Restart', function() {
		self.restart();
	});
	
	this.createTool('Spawn ball', function() {
		sim.renderer.showSpawnBall();
	});
	
	this.createTool('Toggle particles', function() {
		sim.renderer.toggleParticles();
	});
	
	$('#restart-btn').click(function() {
		self.restart();
	});
	
	/*$('#drive-to-btn').click(function() {
		sim.renderer.showDriveTo();
	});
	
	$('#spawn-ball-btn').click(function() {
		sim.renderer.showSpawnBall();
	});
	
	$('#reset-deviation-btn').click(function() {
		sim.game.getRobot('yellow').resetDeviation();
	});
	
	$('#set-noise-btn').click(function() {
		self.showNoiseDialog();
	});
	
	$('#toggle-particles-btn').click(function() {
		sim.renderer.toggleParticles();
	});
	
	$('#toggle-perfect-localization-btn').click(function() {
		sim.game.getRobot('yellow').togglePerfectLocalization();
	});*/
};

Sim.UI.prototype.createTool = function(name, callback) {
	var toolbar = $('#toolbar'),
		id = name.replace(' ', '-') + '-tool-btn',
		nr = this.tools.length + 1,
		btn;
	
	toolbar.append('<li><button id="' + id + '">' +nr  + '. ' + name + '</button></li>');
	
	btn = $('#' + id);
	
	var tool = {
		id: id,
		nr: nr,
		btn: btn,
		callback: callback
	};
	
	btn.click(function() {
		callback.call(tool);
	});
	
	this.tools.push(tool);
};

Sim.UI.prototype.initFullscreenToggle = function() {
	
};

Sim.UI.prototype.showNoiseDialog = function() {
	var robot = sim.game.getRobot('yellow'),
		newLevel = parseFloat(window.prompt('Enter new noise level', robot.omegaDeviation));

	robot.omegaDeviation = newLevel;
	robot.resetDeviation();
};

Sim.UI.prototype.restart = function() {
	$('#game-over').fadeOut(300);
		
	//sim.game.restart();
	window.location.reload();
};