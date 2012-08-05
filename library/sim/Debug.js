/**
 * Debugging helper.
 *
 * Can fire the following events:
 * > ERROR - fired when a user error occurs
 *   message - error message
 * > CONSOLE - fired when user send something to display in console
 *   args - console arguments
 */
Sim.Debug = function() {
	this.messages = [];
	this.boxes = {};
	this.boxCount = 0;
};

/**
 * Extend the EventTarget for custom event handling.
 */
Sim.Debug.prototype = new Sim.EventTarget();

/**
 * Debugger event types.
 */
Sim.Debug.Event = {
	ERROR: 'error',
	CONSOLE: 'console'
};

/**
 * Triggers a error message.
 *
 * The message is passed on to any listeners of given type.
 *
 * @param {string} message Message
 */
Sim.Debug.prototype.error = function(message) {
	this.fire({
		type: Sim.Debug.Event.ERROR,
		message: message
	});
};

/**
 * Logs data to console if available.
 *
 * @param {any} ... Variable number of arguments
 */
Sim.Debug.prototype.console = function() {
	this.fire({
		type: Sim.Debug.Event.CONSOLE,
		args: arguments
	});
};

Sim.Debug.prototype.box = function(name, value, numberDecimals) {
	if (this.boxes[name] == null) {
		var container = $('#debug-wrap');
		
		if (container.length == 0) {
			$(document.body).append($('<ul/>', {
				'id': 'debug-wrap'
			}));
			
			container = $('#debug-wrap')
		}
		
		var boxId = 'debug-box-' + this.boxCount;
		
		container.append($('<li/>', {
			'id': boxId,
			'class': 'debug-value'
		}));
		
		var boxElement = $('#' + boxId);
		
		this.boxes[name] = {
			id: boxId,
			element: boxElement,
			firstValue: value,
			lastValue: value,
			lastUpdated: Sim.Util.getMicrotime()
		};
		
		this.boxCount++;
	}
	
	var box = this.boxes[name],
		element = box.element,
		displayValue = value;
	
	box.lastUpdated = Sim.Util.getMicrotime();
	
	if (typeof(value) == 'number' && typeof(numberDecimals) == 'number') {
		displayValue = Sim.Math.round(value, numberDecimals);
	}
	
	element.html('<strong>' + name + '</strong>: <span>' + displayValue + '</span>');
	
	box.lastValue = value;
};

Sim.Debug.prototype.step = function(dt) {
	for (var name in this.boxes) {
		if (Sim.Util.getMicrotime() - this.boxes[name].lastUpdated > 1.0) {
			sim.dbg.console('remove', name);
			
			$(this.boxes[name].element).remove();
			
			delete this.boxes[name];
		}
	}
};