/**
 * Event target base class used for custom events system.
 */
Sim.EventTarget = function() {
	this.listeners = {};
};

/**
 * Adds a new listener of given type.
 *
 * @param {string} type Type of listener to add
 * @param {function} listener The listener function to add
 * @return {function} The added listener
 */
Sim.EventTarget.prototype.bind = function(type, listener) {
	// first of given type, create array
	if (typeof(this.listeners[type]) == 'undefined') {
		this.listeners[type] = [];
	}

	// check for an already existing listener for the same type
	for (var i = 0; i < this.listeners[type].length; i++) {
		if (this.listeners[type][i] === listener) {
			return listener;
		}
	}

	this.listeners[type].push(listener);

	return listener;
};

/**
 * Removes listener of given type.
 *
 * @param {string} type Type of listener to remove
 * @param {function} listener The listener function to remove
 */
Sim.EventTarget.prototype.unbind = function(type, listener) {
	// give up if none or requested type exist
	if (typeof(this.listeners[type]) == 'undefined') {
		return false;
	}

	// find it
	for (var i = 0; i < this.listeners[type].length; i++) {
		if (this.listeners[type][i] == listener) {
			// splice it out of the array
			this.listeners[type].splice(i, 1);

			return true;
		}
	}

	return false;
};

/**
 * Fire event
 *
 * The event can be a simple string meaning the event type to fire or
 * an object containing type as key and optionally a target. If no
 * target is given, the current context is used.
 *
 * @param {object|string} event Event to fire
 */
Sim.EventTarget.prototype.fire = function(event) {
	if (typeof(event) == 'string') {
		event = {
			type: event
		};
	}

	if (typeof(event.target) == 'undefined') {
		event.target = this;
	}

	if (typeof(event.type) == 'undefined') {
		throw 'Event "type" attribute is missing';
	}

	if (typeof(this.listeners[event.type]) == 'object') {
		for (var i = 0; i < this.listeners[event.type].length; i++) {
			this.listeners[event.type][i].call(this, event);
		}
	}
};

/**
 * Cleas all listeners of a type or all if no type is given
 *
 * @param {string} type Type to clear, leave empty for all
 */
Sim.EventTarget.prototype.clearListeners = function(type) {
	if (typeof(type) === 'undefined') {
		this.listeners = {};
	} else {
		this.listeners[type] = [];
	}
};

/**
 * Returns list of all listeners.
 *
 * @return {object} Listeners
 */
Sim.EventTarget.prototype.getListeners = function() {
	return this.listeners;
};