Sim.Ball = function(x, y) {
	this.x = x;
	this.y = y;
	this.velocityX = 1.0;
	this.velocityY = 1.0;
};

Sim.Ball.prototype.step = function(dt) {
	this.x += this.velocityX * dt;
	this.y += this.velocityY * dt;
	
	if (this.x < sim.conf.ball.radius) {
		this.x = sim.conf.ball.radius;
		this.velocityX *= -1;
	}
	
	if (this.x > sim.conf.field.width - sim.conf.ball.radius) {
		this.x = sim.conf.field.width - sim.conf.ball.radius;
		this.velocityX *= -1;
	}
	
	if (this.y < sim.conf.ball.radius) {
		this.y = sim.conf.ball.radius;
		this.velocityY *= -1;
	}
	
	if (this.y > sim.conf.field.height - sim.conf.ball.radius) {
		this.y = sim.conf.field.height - sim.conf.ball.radius;
		this.velocityY *= -1;
	}
	
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