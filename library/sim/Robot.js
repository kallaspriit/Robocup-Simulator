Sim.Robot = function(side, x, y, orientation) {
	this.side = side;
	this.x = x;
	this.y = y;
	this.orientation = orientation;
	
	this.radius = 0.125;
	this.mass = 2.5;
	this.wheelRadius = 0.025;
	this.wheelOffset = 0.12;
	this.cameraDistance = 5.0;
	this.cameraWidth = 3.0;
	
	this.targetDir = {x: 0, y: 0};
	this.targetOmega = 0;
	
	this.lastMovement = null;
	this.velocityX = 0;
	this.velocityY = 0;
	
	this.wheelOmega = [
		0.0, 0.0, 0.0
	];
	
	this.wheelsAngle = Sim.Math.degToRad(-60.0);
	
	this.omegaMatrix = $M([
		[-Math.sin(this.wheelsAngle), Math.cos(this.wheelsAngle), this.wheelOffset],
		[-Math.sin(Math.PI / 3.0 - this.wheelsAngle), -Math.cos(Math.PI / 3.0 - this.wheelsAngle), this.wheelOffset],
		[Math.sin(Math.PI / 3.0 + this.wheelsAngle), -Math.cos(Math.PI / 3.0 + this.wheelsAngle), this.wheelOffset]
	]);
	
	this.omegaMatrixInv = this.omegaMatrix.inverse();
	
	this.cameraPoly = new Sim.Math.Polygon([
		{x: 0, y: 0},
		{x: this.cameraDistance, y: -this.cameraWidth / 2},
		{x: this.cameraDistance, y: this.cameraWidth / 2},
		{x: 0, y: 0}
	]);
	
	this.commands = [];
};

Sim.Robot.prototype.step = function(dt) {
	var movement = this.getMovement();
	
	this.lastMovement = movement;
	
    this.velocityX = movement.velocityX * Math.cos(this.orientation) - movement.velocityY * Math.sin(this.orientation),
	this.velocityY = movement.velocityX * Math.sin(this.orientation) + movement.velocityY * Math.cos(this.orientation);

	this.orientation = (this.orientation + movement.omega * dt) % (Math.PI * 2.0);
	this.x += this.velocityX * dt;
	this.y += this.velocityY * dt;
	
	this.updateVision();
	this.handleCommands(dt);
	
	sim.dbg.box('Omega', Sim.Math.round(this.wheelOmega[0], 2) + ',' + Sim.Math.round(this.wheelOmega[1], 2) + ',' + Sim.Math.round(this.wheelOmega[2], 2));
	sim.dbg.box('Velocity', $V2(movement.velocityX, movement.velocityY).modulus(), 2);
};

Sim.Robot.prototype.updateVision = function() {
	var currentCameraPoly = this.cameraPoly.rotate(this.orientation).translate(this.x, this.y),
		ball;
	
	for (var i = 0; i < sim.game.balls.length; i++) {
		ball = sim.game.balls[i];
		
		if (currentCameraPoly.containsPoint(ball.x, ball.y)) {
			ball._yellowVisible = true;
		} else {
			ball._yellowVisible = false;
		}
	}
};

/*
Sim.Robot.prototype.getOmega = function() {
	var avgOmega = (this.wheelOmega[0] + this.wheelOmega[1] + this.wheelOmega[2]) / 3;
	
	return avgOmega * this.wheelRadius / this.wheelOffset;
};
*/

Sim.Robot.prototype.getMovement = function() {
	var wheelMatrix = $M([
			[this.wheelOmega[0]],
			[this.wheelOmega[1]],
			[this.wheelOmega[2]]
		]),
		movement = this.omegaMatrixInv.multiply(wheelMatrix).multiply(this.wheelRadius);
	
	return {
		velocityX: movement.elements[0][0],
		velocityY: movement.elements[1][0],
		omega: movement.elements[2][0]
	};
};

Sim.Robot.prototype.setTargetDir = function(x, y, omega) {
	this.targetDir = {
		x: x,
		y: y
	};
	
	if (typeof(omega) == 'number') {
		this.targetOmega = omega;
	}
	
	this.updateWheelSpeeds();
	
	return this;
};

Sim.Robot.prototype.getTargetDir = function() {
	return {
		x: this.targetDir.x,
		y: this.targetDir.y,
		omega: this.targetOmega
	};
};

Sim.Robot.prototype.setTargetOmega = function(omega) {
	this.targetOmega = omega;
	
	this.updateWheelSpeeds();
	
	return this;
};

Sim.Robot.prototype.getTargetOmega = function() {
	return this.targetOmega;
};

Sim.Robot.prototype.queueCommand = function(command) {
	this.commands.push(command);
};

Sim.Robot.prototype.updateWheelSpeeds = function() {
	/*
	this.wheelOmega[0] = (this.wheelOffset * omega - dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[0])) + dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[0]))) / this.wheelRadius;
	this.wheelOmega[1] = (this.wheelOffset * omega - dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[1])) + dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[1]))) / this.wheelRadius;
	this.wheelOmega[2] = (this.wheelOffset * omega - dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[2])) + dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[2]))) / this.wheelRadius;
	*/
    
	var targetMatrix = $M([
		[this.targetDir.x],
		[this.targetDir.y],
		[this.targetOmega]
	]);
	
	var wheelOmegas = this.omegaMatrix.multiply(1.0 / this.wheelRadius).multiply(targetMatrix).elements;
	
	this.wheelOmega[0] = wheelOmegas[0][0];
	this.wheelOmega[1] = wheelOmegas[1][0];
	this.wheelOmega[2] = wheelOmegas[2][0];
};

Sim.Robot.prototype.turnBy = function(angle, duration) {
	this.queueCommand(new Sim.Cmd.TurnBy(angle, duration));
};

Sim.Robot.prototype.handleCommands = function(dt) {
	if (this.commands.length == 0) {
		return;
	}
	
	var cmd = this.commands[0];
	
	if (typeof(cmd._loaded) == 'undefined') {
		if (typeof(cmd.onStart) == 'function') {
			cmd.onStart.apply(cmd, [this, dt]);
		}
		
		cmd._loaded = true;
	}
	
	if (cmd.step.apply(cmd, [this, dt]) === false) {
		if (typeof(cmd.onEnd) == 'function') {
			cmd.onEnd.apply(cmd, [this, dt]);
		}
		
		this.commands = this.commands.slice(1);
			
		this.handleCommands(dt);
	}
};