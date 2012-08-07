window.Sim = window.Sim || {};

Sim.Util = {};

Sim.Util.getMicrotime = function() {
	return (new Date()).getTime() / 1000.0;
}

Sim.Util.getTime = function() {
	var date = new Date();

	return Sim.Util.formatTime(date);
};

Sim.Util.formatTime = function(date, includeSeconds) {
	date = date || new Date();
	includeSeconds = typeof(includeSeconds) != 'undefined'
		? includeSeconds
		: true;
	
	return (date.getHours() < 10 ? '0' : '') + date.getHours() +
		':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes() +
		(includeSeconds ? ':' + (date.getSeconds() < 10 ? '0' : '') +
		date.getSeconds() : '');
};

Sim.Util.random = function(min, max) {
	return Math.floor(min + (1 + max - min) * Math.random());
};

Sim.Util.getMax = function(values) {
	var max = null;
	
	for (var i = 0; i < values.length; i++) {
		if (max === null || values[i] > max) {
			max = values[i];
		}
	}
	
	return max;
};

Sim.Util.randomGaussian = function(deviation, mean) {
	deviation = typeof(deviation) != 'undefined' ? deviation : 0.5;
	mean = typeof(mean) != 'undefined' ? mean : 0;
	
	return ((Math.random() * 2 - 1) + (Math.random() * 2 - 1) + (Math.random() * 2 - 1)) * deviation + mean;
};

Sim.Util.confine = function(
	obj,
	xMin,
	xMax,
	yMin,
	yMax,
	padding
) {
	var confined = false;
	
	padding = padding || 0;
	
	if (obj.x < xMin + padding) {
		obj.x = xMin + padding;
		confined = true;
	} else if (obj.x > xMax - padding) {
		obj.x = xMax - padding;
		confined = true;
	}
	
	if (obj.y < yMin + padding) {
		obj.y = yMin + padding;
		confined = true;
	} else if (obj.y > yMax - padding) {
		obj.y = yMax - padding;
		confined = true;
	}
	
	return confined;
};

Sim.Util.polygonToPath = function(polygon, centerX, centerY) {
	centerX = centerX || 0;
	centerY = centerY || 0;
	
	var path = '',
		i;
	
	//if (centerX != 0 ||centerY != 0) {
		path = 'M' + (centerX * -1) + ' ' + (centerY * -1);
	//}
	
	for (i = 0; i < polygon.points.length; i++) {
		//path += 'L' + polygon.points[i].x + ' ' + polygon.points[i].y;
		path += (i == 0 ? 'M' : 'L') + polygon.points[i].x + ' ' + polygon.points[i].y;
	}
	
	return path;
};

Sim.Util.clone = function(object) {
	return jQuery.extend(true, {}, object);
};

Sim.Util.mapRange = function(value, max, minrange, maxrange) {
    return Math.round(((max - value) / max) * (maxrange - minrange)) + minrange;
};

Sim.Util.limitValue = function(value, max) {
    if (value < 0) {
		return Math.max(value, -max);
	} else {
		return Math.min(value, max);
	}
};

Sim.Util.limitRange = function(value, min, max) {
    return Math.max(Math.min(value, max), min);
};

Sim.Util.combine = function(base, extender) {
	if (typeof(extender) != 'object') {
		return base;
	}
	
    return $.extend({}, base, extender);
};

Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	
	this.length = from < 0 ? this.length + from : from;
	
	return this.push.apply(this, rest);
};