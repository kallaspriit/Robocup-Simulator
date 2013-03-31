Sim.ParticleLocalizer = function(
	particleCount, forwardNoise, turnNoise,
	distanceSenseNoise, angleSenseNoise
) {
	this.particleCount      = particleCount || 1000;
	this.forwardNoise       = forwardNoise || 0.1;
	this.turnNoise          = turnNoise || 0.1;
	this.distanceSenseNoise = distanceSenseNoise || 0.1;
	this.angleSenseNoise    = angleSenseNoise || Sim.Math.degToRad(5);
	this.landmarks          = {};
	this.particles          = [];
	this.x                  = 0;
	this.y                  = 0;
	this.orientation        = 0;
};

Sim.ParticleLocalizer.Particle = function(x, y, orientation, probability) {
	this.x = x;
	this.y = y;
	this.orientation = orientation;
	this.probability = probability;
};

Sim.ParticleLocalizer.prototype.init = function() {
	for (var i = 0; i < this.particleCount; i++) {
		this.particles.push(new Sim.ParticleLocalizer.Particle(
			Sim.Util.random(0, sim.config.field.width * 1000) / 1000.0,
			Sim.Util.random(0, sim.config.field.height * 1000) / 1000.0,
			Sim.Util.random(0, Sim.Math.TWO_PI * 1000) / 1000.0,
			1
		));
	}
};

Sim.ParticleLocalizer.prototype.addLandmark = function(name, x, y) {
	this.landmarks[name] = {
		x: x,
		y: y
	};
};

Sim.ParticleLocalizer.prototype.setPosition = function(x, y, orientation) {
    for (var i = 0; i < this.particles.length; i++) {
        this.particles[i].x = x;
        this.particles[i].y = y;
        this.particles[i].orientation = orientation;
        this.particles[i].probability = 1;
    }
};

Sim.ParticleLocalizer.prototype.move = function(velocityX, velocityY, omega, dt, exact) {
	var particleVelocityX,
		particleVelocityY,
		particleOrientationNoise,
		i;

	for (i = 0; i < this.particles.length; i++) {
		if (exact !== true) {
			particleVelocityX = velocityX + Sim.Util.randomGaussian(this.forwardNoise);
			particleVelocityY = velocityY + Sim.Util.randomGaussian(this.forwardNoise);
			particleOrientationNoise = Sim.Util.randomGaussian(this.turnNoise) * dt;
		} else {
			particleVelocityX = velocityX;
			particleVelocityY = velocityY;
			particleOrientationNoise = 0;
		}
		
		this.particles[i].orientation = this.particles[i].orientation
			+ omega * dt + particleOrientationNoise;
		this.particles[i].x += (particleVelocityX * Math.cos(this.particles[i].orientation)
			- particleVelocityY * Math.sin(this.particles[i].orientation)) * dt;
		this.particles[i].y += (particleVelocityX * Math.sin(this.particles[i].orientation)
			+ particleVelocityY * Math.cos(this.particles[i].orientation)) * dt;
	}
};

Sim.ParticleLocalizer.prototype.update = function(measurements) {
	if (Sim.Util.isEmpty(measurements)) {
		return;
	}

	var particle,
		maxProbability = null,
		i;

	for (i = 0; i < this.particles.length; i++) {
		particle = this.particles[i];

		this.particles[i].probability = this.getMeasurementProbability(particle, measurements);

		if (maxProbability == null || this.particles[i].probability > maxProbability) {
			maxProbability = this.particles[i].probability;
		}
	}

	for (i = 0; i < this.particles.length; i++) {
		this.particles[i].probability /= maxProbability;
	}

	this.particles = this.resample(this.particles);
};

Sim.ParticleLocalizer.prototype.getMeasurementProbability = function(
	particle,
	measurements
) {
	var probability = 1.0,
		landmarkName,
		landmark,
		measuredDistance,
		measuredAngle,
		expectedDistance,
		expectedAngle;
	
	for (landmarkName in measurements) {
		landmark = this.landmarks[landmarkName];
		measuredDistance = measurements[landmarkName].distance;
		measuredAngle = measurements[landmarkName].angle;
		expectedDistance = Sim.Math.getDistanceBetween(particle, landmark);
		expectedAngle = Sim.Math.getAngleBetween(landmark, particle, particle.orientation);
		probability *= Sim.Math.getGaussian(expectedAngle, this.angleSenseNoise, measuredAngle) * 0.0
			+ Sim.Math.getGaussian(expectedDistance, this.distanceSenseNoise, measuredDistance) * 1.0;
	}
	
	return probability;
};

Sim.ParticleLocalizer.prototype.resample = function(particles) {
	var resampledParticles = [],
		particleCount = particles.length,
		index = Sim.Util.random(0, particleCount - 1),
		beta = 0.0,
		i;
	
	for (i = 0; i < particles.length; i++) {
		beta += Math.random() * 2.0;
		
		while (beta > particles[index].probability) {
			beta -= particles[index].probability;
			index = (index + 1) % particleCount;
		}
		
		resampledParticles.push(new Sim.ParticleLocalizer.Particle(
			particles[index].x,
			particles[index].y,
			particles[index].orientation,
			particles[index].probability
		));
	}
	
	return resampledParticles;
};

/* couldn't get the text-book algorithm to really work
Sim.ParticleLocalizer.prototype.resample = function(particles) {
	var resampledParticles = [],
		M = particles.length,
		invM = 1.0 / M,
		r = Sim.Util.random(0, invM * 1000000.0) / 1000000.0,
		c = particles[1].probability,
		i = 1,
		U,
		m;

	for (m = 1; m <= M; m++) {
		U = r + (m - 1) * invM;

		while (U > c) {
			i = i + 1;
			c = c + particles[i].probability;
		}

		resampledParticles.push(new Sim.ParticleLocalizer.Particle(
			particles[i].x,
			particles[i].y,
			particles[i].orientation,
			particles[i].probability
		));
	}

	return resampledParticles;
};*/

Sim.ParticleLocalizer.prototype.getPosition = function(robot) {
	var evaluation = this.evaluate(robot, this.particles),
		xSum = 0,
		ySum = 0,
		orientationSum = 0,
		i;
	
	for (i = 0; i < this.particles.length; i++) {
		xSum += this.particles[i].x;
		ySum += this.particles[i].y;
		orientationSum += this.particles[i].orientation;
	}

	this.x = xSum / this.particles.length;
	this.y = ySum / this.particles.length;
	this.orientation = (orientationSum / this.particles.length) % Sim.Math.TWO_PI;

	while (this.orientation < 0) {
		this.orientation += Sim.Math.TWO_PI;
	}

	return {
		x: this.x,
		y: this.y,
		orientation: this.orientation,
		evaluation: evaluation
	};
};

Sim.ParticleLocalizer.prototype.evaluate = function(robot, particles) {
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