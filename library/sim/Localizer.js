Sim.Localizer = function(particleCount) {
	this.particleCount = particleCount || 1000;
	this.particles = [];
};

Sim.Localizer.Particle = function(x, y, orientation) {
	this.x = x;
	this.y = y;
	this.orientation = orientation;
};

Sim.Localizer.prototype.init = function() {
	for (var i = 0; i < this.particleCount; i++) {
		this.particles.push(new Sim.Localizer.Particle(
			Sim.Util.random(0, sim.conf.field.width * 1000) / 1000.0,
			Sim.Util.random(0, sim.conf.field.height * 1000) / 1000.0,
			Sim.Util.random(0, Math.PI * 2 * 1000) / 1000.0
		));
	}
};

Sim.Localizer.prototype.move = function(velocityX, velocityY, omega, dt) {
	for (var i = 0; i < this.particles.length; i++) {
		this.particles[i].orientation = (this.particles[i].orientation + omega * dt) % (Math.PI * 2.0);
		this.particles[i].x += (velocityX * Math.cos(this.particles[i].orientation) - velocityY * Math.sin(this.particles[i].orientation)) * dt;
		this.particles[i].y += (velocityX * Math.sin(this.particles[i].orientation) + velocityY * Math.cos(this.particles[i].orientation)) * dt;
	}
};

// calculates mean error
Sim.Localizer.prototype.evaluate = function(robot, particles) {
    var sum = 0.0,
		dx,
		dy,
		error;
	
    for (var i = 0; i < particles.length; i++) {
        dx = (particles[i].x - robot.x + (sim.conf.field.width / 2.0)) % sim.conf.field.width - (sim.conf.field.width / 2.0);
        dy = (particles[i].y - robot.y + (sim.conf.field.height / 2.0)) % sim.conf.field.height - (sim.conf.field.height / 2.0);
        error = Math.sqrt(dx * dx + dy * dy);
        sum += error;
	}
	
    return sum / particles.length;
};