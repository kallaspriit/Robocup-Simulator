Sim.FpsCounter = function(interval) {
	this.interval = interval || 60;
	this.startTime = null;
	this.frames = 0;
	this.lastFPS = 0;
};

Sim.FpsCounter.prototype.step = function() {
	if (this.startTime == null) {
		this.startTime = Sim.Util.getMicrotime();
		this.frames = 1;
		
		return;
	}
	
	if (this.frames >= this.interval) {
		var currentTime = Sim.Util.getMicrotime()
			elapsedTime = currentTime - this.startTime;
		
		this.lastFPS = this.frames / elapsedTime;
		this.startTime = currentTime;
		this.frames = 0;
	} else {
		this.frames++;
	}
};

Sim.FpsCounter.prototype.getLastFPS = function() {
	return this.lastFPS;
};