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
}

Sim.Util.confine = function(
	obj,
	xMin,
	xMax,
	yMin,
	yMax,
	padding
) {
	padding = padding || 0;
	
	if (obj.x < xMin + padding) {
		obj.x = xMin + padding;
	} else if (obj.x > xMax - padding) {
		obj.x = xMax - padding;
	}
	
	if (obj.y < yMin + padding) {
		obj.y = yMin + padding;
	} else if (obj.y > yMax - padding) {
		obj.y = yMax - padding;
	}
};

Sim.Util.polygonToPath = function(polygon, centerX, centerY) {
	centerX = centerX || 0;
	centerY = centerY || 0;
	
	var path = '',
		i;
	
	if (centerX != 0 ||centerY != 0) {
		path = 'M-' + centerX + ' -' + centerY;
	}
	
	for (i = 0; i < polygon.points.length; i++) {
		path += (i == 0 ? 'M' : 'L') + polygon.points[i].x + ' ' + polygon.points[i].y;
	}
	
	return path;
};

Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};