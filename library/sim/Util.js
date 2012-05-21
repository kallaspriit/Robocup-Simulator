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