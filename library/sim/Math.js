Sim.Math = {};

Sim.Math.round = function(number, decimals) {
	return number.toFixed(decimals);
};

Sim.Math.degToRad = function(degrees) {
	return degrees * Math.PI / 180.0;
};

Sim.Math.radToDeg = function(radians) {
	return radians * 180.0 / Math.PI;
};

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/math/is-point-in-poly [v1.0]
Sim.Math.isPointInPoly = function(poly, pt) {
	for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i) {
		((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
		&& (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
		&& (c = !c);
	}
	
	return c;
};

Sim.Math.Polygon = function(points) {
	this.points = points || [];
};


Sim.Math.Polygon.prototype.addPoint = function(x, y) {
	this.points.push({
		x: x,
		y: y
	});
};

Sim.Math.Polygon.prototype.containsPoint = function(x, y) {
	for(var c = false, i = -1, l = this.points.length, j = l - 1; ++i < l; j = i) {
		((this.points[i].y <= y && y < this.points[j].y) || (this.points[j].y <= y && y < this.points[i].y))
		&& (x < (this.points[j].x - this.points[i].x) * (y - this.points[i].y) / (this.points[j].y - this.points[i].y) + this.points[i].x)
		&& (c = !c);
	}
	
	return c;
};

Sim.Math.Polygon.prototype.translate = function(x, y) {
    var translatedPolygon = new Sim.Math.Polygon(),
		i;
	
    for(i = 0; i < this.points.length; i++) {
        translatedPolygon.addPoint(this.points[i].x + x, this.points[i].y + y);
	}
	
    return translatedPolygon;
};

Sim.Math.Polygon.prototype.rotate = function(angle) {
    var translatedPolygon = new Sim.Math.Polygon(),
		rotatedPoint,
		i;
	
    for(i = 0; i < this.points.length; i++) {
		rotatedPoint = Sim.Math.rotatePoint(this.points[i].x, this.points[i].y, angle)
		
        translatedPolygon.addPoint(rotatedPoint.x, rotatedPoint.y);
	}
	
    return translatedPolygon;
};

Sim.Math.rotatePoint = function(x, y, angle) {
    return {
        x: (x * Math.cos(angle)) - (y * Math.sin(angle)),
        y: (x * Math.sin(angle)) + (y * Math.cos(angle))
	};
};

Sim.Math.collideCircles = function(a, b) {
	var xDist = a.x - b.x,
		yDist = a.y - b.y,
		distSquared = xDist * xDist + yDist * yDist;

	if (distSquared > (a.radius + b.radius) * (a.radius + b.radius)) {
		return false;
	}
	
	var speedDiffX = b.velocityX - a.velocityX,
		speedDiffY = b.velocityY - a.velocityY,
		dotProduct = xDist * speedDiffX + yDist * speedDiffY;

	if (dotProduct <= 0) {
		return false;
	}
	
	var collisionScale = dotProduct / distSquared,
		xCollision = xDist * collisionScale,
		yCollision = yDist * collisionScale,
		combinedMass = a.mass + b.mass,
		collisionWeightA = 2 * b.mass / combinedMass,
		collisionWeightB = 2 * a.mass / combinedMass;
	
	a.velocityX += (collisionWeightA * xCollision);
	a.velocityY += (collisionWeightA * yCollision);
	b.velocityX -= (collisionWeightB * xCollision);
	b.velocityY -= (collisionWeightB * yCollision);
	
	return true;
}