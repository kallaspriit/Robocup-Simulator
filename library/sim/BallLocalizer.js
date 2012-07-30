Sim.BallLocalizer = function() {
	this.balls = [];
};

Sim.BallLocalizer.Ball = function(x, y, id) {
	this.x = x;
	this.y = y;
	this.id = id;
};

Sim.BallLocalizer.prototype.update = function(robotX, robotY, robotOrientation, balls) {
	var ballX,
		ballY,
		angle,
		i;
	
	this.balls = [];
	
	for (i = 0; i < balls.length; i++) {
		angle = robotOrientation + balls[i].angle;
		
		//ballX = robotX + Math.cos(robotOrientation + balls[i].angle) * balls[i].distance;
		//ballY = robotY - Math.sin(robotOrientation + balls[i].angle) * balls[i].distance;
		ballX = robotX + Math.cos(angle) * balls[i].distance;
		ballY = robotY + Math.sin(angle) * balls[i].distance;
		
		this.balls[i] = new Sim.BallLocalizer.Ball(
			ballX,
			ballY,
			balls[i].ball.id
		);
	}
};