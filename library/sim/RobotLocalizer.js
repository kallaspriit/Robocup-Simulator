Sim.RobotLocalizer = function(particleCount, forwardNoise, turnNoise, senseNoise) {
	this.particleCount = particleCount || 1000;
	this.forwardNoise = forwardNoise || 0.1;
	this.turnNoise = turnNoise || 0.1;
	this.senseNoise = senseNoise || 0.1;
	this.landmarks = {};
	this.particles = [];
};

Sim.RobotLocalizer.Particle = function(x, y, orientation, probability) {
	this.x = x;
	this.y = y;
	this.orientation = orientation;
	this.probability = probability;
};

Sim.RobotLocalizer.prototype.addLandmark = function(name, x, y) {
	this.landmarks[name] = {
		x: x,
		y: y
	};
};

Sim.RobotLocalizer.prototype.init = function() {
	for (var i = 0; i < this.particleCount; i++) {
		this.particles.push(new Sim.RobotLocalizer.Particle(
			Sim.Util.random(0, sim.config.field.width * 1000) / 1000.0,
			Sim.Util.random(0, sim.config.field.height * 1000) / 1000.0,
			Sim.Util.random(0, Math.PI * 2 * 1000) / 1000.0,
			1
		));
	}
};

Sim.RobotLocalizer.prototype.move = function(velocityX, velocityY, omega, dt) {
	var noisyVelocityX = velocityX + Sim.Util.randomGaussian(this.forwardNoise),
		noisyVelocityY = velocityY + Sim.Util.randomGaussian(this.forwardNoise);
	
	for (var i = 0; i < this.particles.length; i++) {
		this.particles[i].orientation = (this.particles[i].orientation + omega * dt + Sim.Util.randomGaussian(this.turnNoise) * dt) % (Math.PI * 2.0);
		this.particles[i].x += (noisyVelocityX * Math.cos(this.particles[i].orientation) - noisyVelocityY * Math.sin(this.particles[i].orientation)) * dt;
		this.particles[i].y += (noisyVelocityX * Math.sin(this.particles[i].orientation) + noisyVelocityY * Math.cos(this.particles[i].orientation)) * dt;
	}
};

/**
 * Calculates mean error
 */
Sim.RobotLocalizer.prototype.evaluate = function(robot, particles) {
    var sum = 0.0,
		dx,
		dy,
		error;
	
    for (var i = 0; i < particles.length; i++) {
        dx = particles[i].x - robot.x;
        dy = particles[i].y - robot.y;
        error = Math.sqrt(dx * dx + dy * dy);
        sum += error;
	}
	
    return sum / particles.length;
};

/**
 * Calculates how likely a measurement should be
 */
Sim.RobotLocalizer.prototype.getMeasurementProbability = function(
	particle,
	measurements
) {
	var probability = 1.0,
		landmarkName,
		landmark,
		measurement,
		distance;
	
	for (landmarkName in measurements) {
		landmark = this.landmarks[landmarkName];
		measurement = measurements[landmarkName];
		distance = Math.sqrt(Math.pow(particle.x - landmark.x,  2) + Math.pow(particle.y - landmark.y, 2));
		probability *= Sim.Math.getGaussian(distance, this.senseNoise, measurement);
	}
	
	return probability;
};

Sim.RobotLocalizer.prototype.update = function(measurements) {
	var particle,
		probabilities = [],
		maxProbability = null,
		i;
	
	for (i = 0; i < this.particles.length; i++) {
		particle = this.particles[i];
		
		probabilities[i] = this.getMeasurementProbability(particle, measurements);
		
		if (maxProbability == null || probabilities[i] > maxProbability) {
			maxProbability = probabilities[i];
		}
	}
	
	for (i = 0; i < this.particles.length; i++) {
		probabilities[i] /= maxProbability;
		
		this.particles[i].probability = probabilities[i];
	}
	
	//sim.dbg.console('probabilities', probabilities);
	
	this.particles = this.resample(probabilities);
};

Sim.RobotLocalizer.prototype.resample = function(probabilities) {
	var resampledParticles = [],
		particleCount = this.particles.length,
		index = Sim.Util.random(0, particleCount - 1),
		beta = 0.0,
		//maxProbability = Sim.Util.getMax(probabilities),
		maxProbability = 1.0,
		i;
	
	for (i = 0; i < this.particles.length; i++) {
		beta += Math.random() * 2.0 * maxProbability;
		
		while (beta > probabilities[index]) {
			beta -= probabilities[index];
			index = (index + 1) % particleCount;
		}
		
		resampledParticles.push(new Sim.RobotLocalizer.Particle(
			this.particles[index].x,
			this.particles[index].y,
			this.particles[index].orientation,
			this.particles[index].probability
		));
	}
	
	return resampledParticles;
};

Sim.RobotLocalizer.prototype.getPosition = function(robot) {
	var evaluation = this.evaluate(robot, this.particles),
		xSum = 0,
		ySum = 0,
		orientationSum = 0,
		i;
	
	for (i = 0; i < this.particles.length; i++) {
		//Sim.Util.confine(this.particles[i], 0, sim.config.field.width, 0, sim.config.field.height, robot.radius);
		
		xSum += this.particles[i].x;
		ySum += this.particles[i].y;
		orientationSum += this.particles[i].orientation;
	}
	
	return {
		x: xSum / this.particles.length,
		y: ySum / this.particles.length,
		orientation: (orientationSum / this.particles.length) % (Math.PI * 2),
		evaluation: evaluation
	};
};