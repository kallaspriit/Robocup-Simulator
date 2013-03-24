Sim.FourWheelOmniDrive = function(wheelRadius, wheelAngles, wheelOffset) {
	this.wheelRadius = wheelRadius;
	this.wheelAngles = wheelAngles;
	this.wheelOffset = wheelOffset;

	this.omegaMatrix = new Sim.Math.Matrix4x3(
		-Math.sin(this.wheelAngles[0]), Math.cos(this.wheelAngles[0]), this.wheelOffset,
		-Math.sin(this.wheelAngles[1]), Math.cos(this.wheelAngles[1]), this.wheelOffset,
		-Math.sin(this.wheelAngles[2]), Math.cos(this.wheelAngles[2]), this.wheelOffset,
		-Math.sin(this.wheelAngles[3]), Math.cos(this.wheelAngles[3]), this.wheelOffset
	);
	this.omegaMatrixA = new Sim.Math.Matrix3x3(
		-Math.sin(this.wheelAngles[0]), Math.cos(this.wheelAngles[0]), this.wheelOffset,
		-Math.sin(this.wheelAngles[1]), Math.cos(this.wheelAngles[1]), this.wheelOffset,
		-Math.sin(this.wheelAngles[2]), Math.cos(this.wheelAngles[2]), this.wheelOffset
	);
	this.omegaMatrixB = new Sim.Math.Matrix3x3(
		-Math.sin(this.wheelAngles[0]), Math.cos(this.wheelAngles[0]), this.wheelOffset,
		-Math.sin(this.wheelAngles[1]), Math.cos(this.wheelAngles[1]), this.wheelOffset,
		-Math.sin(this.wheelAngles[3]), Math.cos(this.wheelAngles[3]), this.wheelOffset
	);
	this.omegaMatrixC = new Sim.Math.Matrix3x3(
		-Math.sin(this.wheelAngles[0]), Math.cos(this.wheelAngles[0]), this.wheelOffset,
		-Math.sin(this.wheelAngles[2]), Math.cos(this.wheelAngles[2]), this.wheelOffset,
		-Math.sin(this.wheelAngles[3]), Math.cos(this.wheelAngles[3]), this.wheelOffset
	);
	this.omegaMatrixD = new Sim.Math.Matrix3x3(
		-Math.sin(this.wheelAngles[1]), Math.cos(this.wheelAngles[1]), this.wheelOffset,
		-Math.sin(this.wheelAngles[2]), Math.cos(this.wheelAngles[2]), this.wheelOffset,
		-Math.sin(this.wheelAngles[3]), Math.cos(this.wheelAngles[3]), this.wheelOffset
	);

	this.omegaMatrixInvA = this.omegaMatrixA.getInversed();
	this.omegaMatrixInvB = this.omegaMatrixB.getInversed();
	this.omegaMatrixInvC = this.omegaMatrixC.getInversed();
	this.omegaMatrixInvD = this.omegaMatrixD.getInversed();
};

Sim.FourWheelOmniDrive.prototype.getWheelOmegas = function(targetDir, targetOmega) {
	var targetMatrix = new Sim.Math.Matrix3x1(
			targetDir.x,
			targetDir.y,
			targetOmega
		),
		wheelOmegas = this.omegaMatrix
			.getMultiplied(1.0 / this.wheelRadius)
			.getMultiplied(targetMatrix);

	return [
		wheelOmegas.a11,
		wheelOmegas.a21,
		wheelOmegas.a31,
		wheelOmegas.a41
	];
};

Sim.FourWheelOmniDrive.prototype.getMovement = function(omegas) {
	var wheelMatrixA = new Sim.Math.Matrix3x1(
			omegas[0],
			omegas[1],
			omegas[2]
		),
		wheelMatrixB = new Sim.Math.Matrix3x1(
			omegas[0],
			omegas[1],
			omegas[3]
		),
		wheelMatrixC = new Sim.Math.Matrix3x1(
			omegas[0],
			omegas[2],
			omegas[3]
		),
		wheelMatrixD = new Sim.Math.Matrix3x1(
			omegas[1],
			omegas[2],
			omegas[3]
		),
		movementA = this.omegaMatrixInvA
			.getMultiplied(wheelMatrixA)
			.getMultiplied(this.wheelRadius),
		movementB = this.omegaMatrixInvB
			.getMultiplied(wheelMatrixB)
			.getMultiplied(this.wheelRadius),
		movementC = this.omegaMatrixInvC
			.getMultiplied(wheelMatrixC)
			.getMultiplied(this.wheelRadius),
		movementD = this.omegaMatrixInvD
			.getMultiplied(wheelMatrixD)
			.getMultiplied(this.wheelRadius);

	return {
		velocityX: (movementA.a11 + movementB.a11 + movementC.a11 + movementD.a11) / 4.0,
		velocityY: (movementA.a21 + movementB.a21 + movementC.a21 + movementD.a21) / 4.0,
		omega: (movementA.a31 + movementB.a31 + movementC.a31 + movementD.a31) / 4.0
	};
};