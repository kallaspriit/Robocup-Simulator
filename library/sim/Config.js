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
		balls: 11
	},
	ball: {
		radius: 0.021335,
		mass: 0.04593,
		drag: 0.2,
		elasticity: 0.3
	},
	simulation: {
		targetFramerate: 60
	},
	yellowRobot: {
		startX: 2.25,
		startY: 1.5,
		//startOrientation: Math.PI / 4,
		startOrientation: 0,
		radius: 0.125,
		mass: 2.5,
		wheelRadius: 0.025,
		wheelOffset: 0.12,
		cameraDistance: 5.0,
		cameraWidth: 8.0,
		kickerForce: 30.0,
		dribblerAngle: Sim.Math.degToRad(20.0),
		omegaDeviation: 2.5,
		distanceDeviation: 0.01
	},
	robotLocalizer: {
		particleCount: 1000,
		forwardNoise: 0.8,
		turnNoise: 0.3,
		senseNoise: 0.5
	}
};