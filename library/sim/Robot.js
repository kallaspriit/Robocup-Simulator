Sim.Robot = function(x, y) {
	this.x = x;
	this.y = y;
	this.wheelRadius = 0.025;
	this.wheelOffset = 0.12;
	
	this.targetDir = new Sim.Math.Vec2(0, 0);
	this.targetOmega = 0;
	
	this.velocity = 0;
	this.velocityX = 0;
	this.velocityY = 0;
	this.omega = 0;
	this.orientation = 0;
	
	this.wheelAngle = [
		-60.0, 60.0, 180.0
	]
	
	this.wheelOmega = [
		1.0, 1.0, 1.0
	];
	
	this.wheelsAngle = Sim.Math.degToRad(-60);
	
	var a = this.wheelsAngle;
	
	this.omegaMatrix = $M([
		[-Math.sin(a), Math.cos(a), this.wheelOffset],
		[-Math.sin(Math.PI / 3.0 - a), -Math.cos(Math.PI / 3.0 - a), this.wheelOffset],
		[Math.sin(Math.PI / 3.0 + a), -Math.cos(Math.PI / 3.0 + a), this.wheelOffset]
	]);
	this.omegaMatrixInv = this.omegaMatrix.inverse();
};

Sim.Robot.prototype.step = function(dt) {
	var movement = this.getMovement(dt);
	
	this.x += movement.dx;
	this.y += movement.dy;
	this.orientation = (this.orientation + movement.omega) % (Math.PI * 2.0);
	
	sim.dbg.box('Omega', this.wheelOmega[0] + ',' + this.wheelOmega[1] + ',' + this.wheelOmega[2]);
	sim.dbg.box('Move', movement.dx + 'x' + movement.dy + ' / ' + movement.omega);
	
	//sim.dbg.console('movement', movement);
	
	/*
	this.velocity = this.getVelocity();
	this.omega = this.getOmega(dt),
	this.velocityX = Math.cos(this.omega) * this.velocity,
	this.velocityY = Math.sin(this.omega) * this.velocity;
	this.orientation = (this.orientation + this.omega) % (Math.PI * 2);
	
	//this.x += this.velocityX;
	//this.y += this.velocityY;
	
	sim.dbg.box('Velocity', this.velocity, 6);
	sim.dbg.box('Omegas', this.wheelOmega[0] + ',' + this.wheelOmega[1] + ',' + this.wheelOmega[2]);
	sim.dbg.box('Omega', this.omega, 6);
	//sim.dbg.box('Vx', this.velocityX, 6);
	*/
	//sim.dbg.console('step', dt, this.velocity);
};

Sim.Robot.prototype.getVelocity = function() {
	var v0 = this.wheelOmega[0] * this.wheelRadius,
		v1 = this.wheelOmega[1] * this.wheelRadius,
		v2 = this.wheelOmega[2] * this.wheelRadius;
	
	return (4.0/9.0) * (Math.pow(v0, 2) + Math.pow(v1, 2) + Math.pow(v2, 2) - v0 * v1 - v0 * v2 - v1 * v2);
};

Sim.Robot.prototype.getOmega = function(dt) {
	var avgOmega = (this.wheelOmega[0] + this.wheelOmega[1] + this.wheelOmega[2]) / 3;
	
	return avgOmega * this.wheelRadius / this.wheelOffset * dt;
};

Sim.Robot.prototype.getMovement = function(dt) {
	var wheelMatrix = $M([
		[this.wheelOmega[0]],
		[this.wheelOmega[1]],
		[this.wheelOmega[2]]
	]);
	var movement = this.omegaMatrixInv.multiply(wheelMatrix).multiply(this.wheelRadius);
	
	return {
		dx: movement.elements[0][0] * dt,
		dy: movement.elements[1][0] * dt,
		omega: movement.elements[2][0] * dt
	};
};

Sim.Robot.prototype.setDir = function(dir, omega) {
	omega = omega || 0;
	
	this.targetDir = dir;
	this.targetOmega = omega;
	
	/*
	this.wheelOmega[0] = (this.wheelOffset * omega - dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[0])) + dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[0]))) / this.wheelRadius;
	this.wheelOmega[1] = (this.wheelOffset * omega - dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[1])) + dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[1]))) / this.wheelRadius;
	this.wheelOmega[2] = (this.wheelOffset * omega - dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[2])) + dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[2]))) / this.wheelRadius;
	*/
    
	var targetMatrix = $M([
		[dir.x],
		[dir.y],
		[omega]
	]);
	
	var wheelOmegas = this.omegaMatrix.multiply(1.0 / this.wheelRadius).multiply(targetMatrix).elements;
	
	this.wheelOmega[0] = wheelOmegas[0][0];
	this.wheelOmega[1] = wheelOmegas[1][0];
	this.wheelOmega[2] = wheelOmegas[2][0];
	
	sim.dbg.console(this.wheelOmega);
	
	//(this.wheelOmega[2] * this.wheelRadius) - (this.wheelOffset * omega) =  -(dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[2]))) + (dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[2])));
	//dir.x = (-this.wheelOmega[2] * this.wheelRadius + this.wheelOffset * omega + dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[2]))) / Math.sin(Sim.Math.degToRad(this.wheelAngle[2]));
	//dir.y = (this.wheelOmega[2] * this.wheelRadius - this.wheelOffset * omega + dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[2]))) / Math.cos(Sim.Math.degToRad(this.wheelAngle[2]));
}