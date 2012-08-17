Sim.Bootstrapper = function() {};

Sim.Bootstrapper.prototype.bootstrap = function() {
	window.sim.config = Sim.Config;
	window.sim.dbg = new Sim.Debug();
	window.sim.game = new Sim.Game();
	window.sim.ui = new Sim.UI(sim.game);
	window.sim.renderer = new Sim.Renderer(sim.game);
	sim.ui.init();
	sim.game.init();
	
	sim.renderer.init();
	sim.game.start();
};

$(document).ready(function() {
	window.sim = {};
	
	sim.bootstrapper = new Sim.Bootstrapper();
	sim.bootstrapper.bootstrap();
});