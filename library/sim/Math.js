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

Sim.Math.Polygon.prototype.scale = function(x, y) {
    var translatedPolygon = new Sim.Math.Polygon(),
		i;
	
    for(i = 0; i < this.points.length; i++) {
        translatedPolygon.addPoint(this.points[i].x * x, this.points[i].y * y);
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
};

Sim.Math.collideWalls = function(obj) {
	var bounceMultiplier = obj.elasticity * -1,
		initialVelocityX = obj.velocityX,
		initialVelocityY = obj.velocityY;

	if (obj.x < obj.radius) {
		obj.x = obj.radius;
		obj.velocityX *= bounceMultiplier;
	}
	
	if (obj.x > sim.conf.field.width - obj.radius) {
		obj.x = sim.conf.field.width - obj.radius;
		obj.velocityX *= bounceMultiplier;
	}
	
	if (obj.y < obj.radius) {
		obj.y = obj.radius;
		obj.velocityY *= bounceMultiplier;
	}
	
	if (obj.y > sim.conf.field.height - obj.radius) {
		obj.y = sim.conf.field.height - obj.radius;
		obj.velocityY *= bounceMultiplier;
	}
	
	if (obj.velocityX != initialVelocityX || obj.velocityY != initialVelocityY) {
		return true;
	} else {
		return false;
	}
};

Sim.Math.getDistanceBetween = function(a, b) {
	return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

Sim.Math.getVectorLength = function(x, y) {
	return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
};

Sim.Math.getAngleBetween = function(a, b, orientation) {
	var forwardVec = $V2(Math.cos(orientation), Math.sin(orientation)).toUnitVector(),
		ballHeading = $V2(a.x - b.x, a.y - b.y).toUnitVector();

	return Math.atan2(ballHeading.y(), ballHeading.x()) - Math.atan2(forwardVec.y(), forwardVec.x());
};

Sim.Math.dirBetween = function(from, to) {
	return $V2(from.x - to.x, from.y - to.y).toUnitVector();
};

Sim.Math.addImpulse = function(body, dir, magnitude, dt) {
	var acceleration = dir.toUnitVector().multiply(magnitude / body.mass * dt);
	
	body.velocityX += acceleration.x();
	body.velocityY += acceleration.y();
};

Sim.Math.Circle = function(x, y, radius) {
	this.x = x;
	this.y = y;
	this.radius = radius;
};

Sim.Math.Circle.prototype.getIntersections = function(other) {
	var distanceSquared = Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2),
		distance = Math.sqrt(distanceSquared);
	
	if (
		distance > this.radius + other.radius
		|| distance < Math.abs(this.radius - other.radius)
		|| distance == 0
	) {
		// not touching
		return false;
	}
	
	var a = (Math.pow(this.radius, 2) - Math.pow(other.radius, 2) + distanceSquared) / (2 * distance),
		h = Math.sqrt(Math.pow(this.radius, 2) - Math.pow(a, 2)),
		centerX = this.x + a * (other.x - this.x) / distance,
		centerY = this.y + a * (other.y - this.y) / distance;
	
	var solutionX1 = centerX + h * (other.y - this.y) / distance,
		solutionY1 = centerY + h * (other.x - this.x) / distance,
		solutionX2 = centerX - h * (other.y - this.y) / distance,
		solutionY2 = centerY - h * (other.x - this.x) / distance;
		
	return {
		x1: solutionX1,
		y1: solutionY1,
		x2: solutionX2,
		y2: solutionY2
	};
};

/**
 * Calculates the probability of x for 1-dim Gaussian with mean mu and var. sigma
 */
Sim.Math.getGaussian = function(mu, sigma, x) {
	return Math.exp(-Math.pow(mu - x,  2) / Math.pow(sigma, 2) / 2.0) / Math.sqrt(2.0 * Math.PI * Math.pow(sigma, 2));
};