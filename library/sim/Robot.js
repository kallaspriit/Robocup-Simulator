Sim.Robot = function(x, y) {
	this.x = x;
	this.y = y;
	this.wheelRadius = 0.025;
	this.wheelOffset = 0.12;
	
	this.targetDir = $V2(0, 0);
	this.targetOmega = 0;
	
	this.velocity = 0;
	this.velocityX = 0;
	this.velocityY = 0;
	this.omega = 0;
	this.orientation = 0;
	
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
};

Sim.Robot.prototype.step = function(dt) {
	var movement = this.getMovement();
	
	this.velocityX = movement.velocityX;
	this.velocityY = movement.velocityY;
	this.velocity = $V2(movement.velocityX, movement.velocityY);
	this.omega = movement.omega;
	
	this.orientation = (this.orientation + movement.omega * dt) % (Math.PI * 2.0);
	this.x += movement.velocityX * dt;
	this.y += movement.velocityY * dt;
	
	sim.dbg.box('Omega', Sim.Math.round(this.wheelOmega[0], 2) + ',' + Sim.Math.round(this.wheelOmega[1], 2) + ',' + Sim.Math.round(this.wheelOmega[2], 2));
	sim.dbg.box('Velocity', this.velocity.modulus(), 2);
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

Sim.Robot.prototype.setDir = function(x, y, omega) {
	omega = omega || this.targetOmega;
	
	this.targetDir = {
		x: x,
		y: y
	};
	this.targetOmega = omega;
	
	/*
	this.wheelOmega[0] = (this.wheelOffset * omega - dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[0])) + dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[0]))) / this.wheelRadius;
	this.wheelOmega[1] = (this.wheelOffset * omega - dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[1])) + dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[1]))) / this.wheelRadius;
	this.wheelOmega[2] = (this.wheelOffset * omega - dir.x * Math.sin(Sim.Math.degToRad(this.wheelAngle[2])) + dir.y * Math.cos(Sim.Math.degToRad(this.wheelAngle[2]))) / this.wheelRadius;
	*/
    
	var targetMatrix = $M([
		[x],
		[y],
		[omega]
	]);
	
	var wheelOmegas = this.omegaMatrix.multiply(1.0 / this.wheelRadius).multiply(targetMatrix).elements;
	
	this.wheelOmega[0] = wheelOmegas[0][0];
	this.wheelOmega[1] = wheelOmegas[1][0];
	this.wheelOmega[2] = wheelOmegas[2][0];
}