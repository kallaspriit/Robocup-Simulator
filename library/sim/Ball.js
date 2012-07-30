Sim.BallId = 0;

Sim.Ball = function(x, y, radius, mass, elasticity) {
	this.id = Sim.BallId++;
	this.x = x;
	this.y = y;
	this.radius = radius || sim.conf.ball.radius;
	this.mass = mass || sim.conf.ball.mass;
	this.elasticity = elasticity || sim.conf.ball.elasticity;
	this.velocityX = 0.0;
	this.velocityY = 0.0;
};

Sim.Ball.prototype.step = function(dt) {
	this.x += this.velocityX * dt;
	this.y += this.velocityY * dt;
	
	var xSign = this.velocityX > 0 ? 1 : -1,
		ySign = this.velocityY > 0 ? 1 : -1,
		stepDrag = sim.conf.ball.drag * dt;
	
	if (Math.abs(this.velocityX) > stepDrag) {
		this.velocityX -= stepDrag * xSign;
	} else {
		this.velocityX = 0;
	}
	
	if (Math.abs(this.velocityY) > stepDrag) {
		this.velocityY -= stepDrag * ySign;
	} else {
		this.velocityY = 0;
	}
};