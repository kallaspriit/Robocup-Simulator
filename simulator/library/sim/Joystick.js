Sim.UI.Joystick = function(
	id,
	className,
	parentSelector
) {
	this.id = id || 'joystick';
	this.className = className || 'yellow';
	this.parentSelector = parentSelector || '#contents';
	this.parent = $(this.parentSelector);
	this.focusCallback = null;
	this.moveCallback = null;
	this.blurCallback = null;
	this.mouseWheelCallback = null;
	
	this.dragging = false;
	this.offsetX = 0;
	this.offsetY = 0;
	this.handleWidth = 0;
	this.handleHeight = 0;
};

Sim.UI.Joystick.prototype.init = function() {
	this.parent.append(
		'<div class="joystick ' + this.className +
		'" id="' + this.id + '"><a href="#"></a></div>'
	);
	
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