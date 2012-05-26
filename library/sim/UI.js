Sim.UI = function() {
	this.movementJoystick = null;
};

Sim.UI.prototype.init = function() {
	this.initDebugListener();
	this.initFullscreenToggle();
	this.initMovementJoystick();
	
	/*
	$('#render-camera-btn').click(function() {
		var r = sim.game.robots.yellow,
			currentCameraPoly = r.cameraPoly.rotate(r.orientation).translate(r.x, r.y);
		
		sim.dbg.console('poly', currentCameraPoly);
	
		sim.renderer.c.path(Sim.Util.polygonToPath(currentCameraPoly)).attr({
			fill: 'rgba(255, 0, 0, 0.5)',
			stroke: 'none'
		});
	});
	*/
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

Sim.UI.prototype.initFullscreenToggle = function() {
	
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