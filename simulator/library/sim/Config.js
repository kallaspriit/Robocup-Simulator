Sim.Config = {
	world: {
		width: 6.0,
		height: 4.0
	},
	field: {
		width: 4.5,
		height: 3.0,
		lineWidth: 0.05,
		wallWidth: 0.05,
		centerCircleRadius: 0.4,
		goalDepth: 0.25,
		goalWidth: 0.7
	},
	game: {
		balls: 11,
		ballRemoveThreshold: 0.5,
		robotConfineThreshold: 0.5,
		useWalls: true
	},
	ball: {
		radius: 0.021335,
		mass: 0.04593,
		drag: 0.2,
		elasticity: 0.3
	},
	vision: {
		distanceDeviation: 0.1
	},
	simulation: {
		targetFramerate: 60
	},
	yellowRobot: {
		startX: 0.125,
		startY: 0.125,
		startOrientation: Math.PI / 4,
		radius: 0.125,
		mass: 2.5,
		wheelRadius: 0.025,
		wheelOffset: 0.12,
		cameraDistance: 5.0,
		cameraWidth: 8.0,
		kickerForce: 30.0,
		dribblerAngle: Sim.Math.degToRad(20.0),
		omegaDeviation: 2.5,
		distanceDeviation: 0.025
	},
	blueRobot: {
		startX: 4.5 - 0.125,
		startY: 3.0 - 0.125,
		startOrientation: Math.PI + Math.PI / 4,
		radius: 0.125,
		mass: 2.5,
		wheelRadius: 0.025,
		wheelOffset: 0.12,
		cameraDistance: 5.0,
		cameraWidth: 8.0,
		kickerForce: 30.0,
		dribblerAngle: Sim.Math.degToRad(20.0),
		omegaDeviation: 2.5,
		distanceDeviation: 0.025
	},
	particleLocalizer: {
		particleCount: 1000,
		forwardNoise: 0.8,
		turnNoise: 1.0,
		senseNoise: 0.5
	},
	ballLocalizer: {
		maxBallIdentityDistance: 0.25,
		maxFovRemoveDistance: 0.5,
		ballPositionAverages: 2,
		ballVelocityAverages: 5,
		ballPurgeLifetime: 10.0,
		ballDrag: 0.2,
		ballElasticity: 0.3,
		ballMaxVelocity: 8.0,
		ballRemoveTime: 0.3,
		velocityUpdateMaxTime: 0.3
	}
};