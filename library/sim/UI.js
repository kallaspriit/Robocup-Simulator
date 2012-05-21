Sim.UI = function() {
	this.movementJoystick = null;
};

Sim.UI.prototype.init = function() {
	this.initDebugListener();
	this.initFullscreenToggle();
	this.initMovementJoystick();
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
		sim.game.robot.setDir(-yPos, xPos);
	}).onBlur(function() {
		sim.game.robot.setDir(0, 0);
	});
};

Sim.UI.prototype.initFullscreenToggle = function() {
	
};

Sim.UI.Joystick = function(id, focusCallback, moveCallback, blurCallback) {
	this.id = id;
	this.focusCallback = focusCallback;
	this.moveCallback = moveCallback;
	this.blurCallback = blurCallback;
	
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
		var xOffset = left - parentWidth / 2,
			maxY = Math.cos(xOffset / parentWidth * 2) * parentHeight,
			minY = parentHeight - maxY;
			
		if (top < minY) {
			top = minY;
		} else if (top > maxY) {
			top = maxY;
		}
		
		var yOffset = top - parentHeight / 2;
		
		self.handle.css({
			'left': left + 'px',
			'top': top + 'px'
		});
		
		if (typeof(self.moveCallback) == 'function') {
			self.moveCallback(xOffset / (parentWidth / 2), yOffset / (parentHeight / 2));
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