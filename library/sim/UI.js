Sim.UI = function() {

};

Sim.UI.prototype.init = function() {
	this.initDebugListener();
	this.initFullscreenToggle();
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

Sim.UI.prototype.initFullscreenToggle = function() {
	$('#toggle-fullscreen-btn').click(function() {
		$('#canvas').css({
			'margin': 0,
			'border': 0
		});
		
		$('#canvas').animate({
			'left': 0,
			'top': 0,
			'width': $(window).width()
		});
	});
};