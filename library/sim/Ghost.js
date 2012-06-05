Sim.Ghost = function(
	type,
	x,
	y,
	orientation
) {
	this.type = type;
	this.x = x;
	this.y = y;
	this.orientation = orientation;
	this.velocityX = 0;
	this.velocityY = 0;
};

Sim.Ghost.Type = {
	YELLOW_ROBOT: 'yellow-robot',
	BLUE_ROBOT: 'yellow-robot'
}

Sim.Ghost.prototype.update = function(x, y, orientation, velocityX, velocityY) {
	this.x = x;
	this.y = y;
	this.orientation = orientation;
	this.velocityX = velocityX;
	this.velocityY = velocityY;
	
	//sim.dbg.console('ghost updated', this);
};