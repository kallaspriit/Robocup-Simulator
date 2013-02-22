Sim.Math = {};

Sim.Math.TWO_PI = Math.PI * 2.0;

Sim.Math.round = function(number, decimals) {
	if (typeof(number) != 'number') {
		return number;
	}
	
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
	
	if (obj.x > sim.config.field.width - obj.radius) {
		obj.x = sim.config.field.width - obj.radius;
		obj.velocityX *= bounceMultiplier;
	}
	
	if (obj.y < obj.radius) {
		obj.y = obj.radius;
		obj.velocityY *= bounceMultiplier;
	}
	
	if (obj.y > sim.config.field.height - obj.radius) {
		obj.y = sim.config.field.height - obj.radius;
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

Sim.Math.createNormalizedVector = function(vec) {
	var length = Sim.Math.getVectorLength(vec);
	
	return {
		x: vec.x / length,
		y: vec.y / length
	};
};

Sim.Math.createMultipliedVector = function(vec, scalar) {
	return {
		x: vec.x * scalar,
		y: vec.y * scalar
	};
};

Sim.Math.createVectorSum = function(a, b) {
	return {
		x: a.x + b.x,
		y: a.y + b.y
	};
};

Sim.Math.createDirVector = function(from, to) {
	return Sim.Math.createNormalizedVector({
		x: from.x - to.x,
		y: from.y - to.y
	});
};

Sim.Math.createForwardVector = function(orientation) {
	return Sim.Math.createNormalizedVector({
		x: Math.cos(orientation),
		y: Math.sin(orientation)
	});
};

Sim.Math.getVectorLength = function(vec) {
	return Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2));
};

Sim.Math.getVectorDotProduct = function(a, b) {
	return a.x * b.x + a.y * b.y;
};

Sim.Math.getAngleBetween = function(pointA, pointB, orientationA) {
	var forwardVec = Sim.Math.createForwardVector(orientationA),
		dirVec = Sim.Math.createDirVector(pointA, pointB),
		angle = Math.atan2(dirVec.y, dirVec.x) - Math.atan2(forwardVec.y, forwardVec.x);
	
	if (angle < -Math.PI) {
		angle += Sim.Math.TWO_PI;
	} else if (angle > Math.PI) {
		angle -= Sim.Math.TWO_PI;
	}
	
	return angle;
};

Sim.Math.addImpulse = function(body, dir, magnitude, dt) {
	var accelerationMagniture = magnitude / body.mass * dt,
		acceleration = {
			x: dir.x * accelerationMagniture,
			y: dir.y * accelerationMagniture
		};
	
	body.velocityX += acceleration.x;
	body.velocityY += acceleration.y;
};

/**
 * Calculates the probability of x for 1-dim Gaussian with mean mu and var. sigma
 */
Sim.Math.getGaussian = function(mu, sigma, x) {
	return Math.exp(-Math.pow(mu - x,  2) / Math.pow(sigma, 2) / 2.0) / Math.sqrt(2.0 * Math.PI * Math.pow(sigma, 2));
};

Sim.Math.getAverage = function(data) {
	var sum = 0,
		i;

	for (i = 0; i < data.length; i++) {
		sum += data[i];
	}

	return sum / data.length;
};

Sim.Math.getStdDev = function(data) {
	var avg = Sim.Math.getAverage(data),
		squareSum = 0,
		i;

	for (i = 0; i < data.length; i++) {
		squareSum += Math.pow(data[i] - avg, 2);
	}

	return Math.sqrt(squareSum / data.length);
};

Sim.Math.getAngleAvg = function(a, b) {
	var x = Math.abs(a - b) % Sim.Math.TWO_PI;

	if (x >= 0 && x <= Math.PI) {
		return ((a + b) / 2) % Sim.Math.TWO_PI;
	} else if (x > Math.PI && x < Math.PI * 6.0 / 4.0) {
		return (((a + b) / 2) % Sim.Math.TWO_PI) + Math.PI;
	} else {
		return (((a + b) / 2) % Sim.Math.TWO_PI) - Math.PI;
	}
};

Sim.Math.getAngleDiff = function(a, b) {
	var diff = Math.abs(a - b) % Sim.Math.TWO_PI;

	if (diff > Math.PI) {
		diff = Sim.Math.TWO_PI - diff;
	}

	return diff;
};

/**
 * Simple Circle class.
 */
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

// Matrices implementation
Sim.Math.Matrix3x3 = function(
	a11, a12, a13,
	a21, a22, a23,
	a31, a32, a33
) {
	this.a11 = a11; this.a12 = a12; this.a13 = a13;
	this.a21 = a21; this.a22 = a22; this.a23 = a23;
	this.a31 = a31; this.a32 = a32; this.a33 = a33;
};

Sim.Math.Matrix3x3.prototype.getType = function() {
	return '3x3';
};

Sim.Math.Matrix3x3.prototype.getDeterminant = function() {
	return this.a11 * (this.a33 * this.a22 - this.a32 * this.a23)
		- this.a21 * (this.a33 * this.a12 - this.a32 * this.a13)
		+ this.a31 * (this.a23 * this.a12 - this.a22 * this.a13);
};

Sim.Math.Matrix3x3.prototype.getMultiplied = function(b) {
	if (typeof(b) == 'number') {
		return new Sim.Math.Matrix3x3(
			this.a11 * b, this.a12 * b, this.a13 * b,
			this.a21 * b, this.a22 * b, this.a23 * b,
			this.a31 * b, this.a32 * b, this.a33 * b
		);
	} else if (typeof(b) == 'object') {
		if (b.getType() == '3x3') {
			return new Sim.Math.Matrix3x3(
				this.a11 * b.a11 + this.a12 * b.a21 + this.a13 * b.a31, this.a11 * b.a12 + this.a12 * b.a22 + this.a13 * b.a32, this.a11 * b.a13 + this.a12 * b.a23 + this.a13 * b.a33,
				this.a21 * b.a11 + this.a22 * b.a21 + this.a23 * b.a31, this.a21 * b.a12 + this.a22 * b.a22 + this.a23 * b.a32, this.a21 * b.a13 + this.a22 * b.a23 + this.a23 * b.a33,
				this.a31 * b.a11 + this.a32 * b.a21 + this.a33 * b.a31, this.a31 * b.a12 + this.a32 * b.a22 + this.a33 * b.a32, this.a31 * b.a13 + this.a32 * b.a23 + this.a33 * b.a33
			);
		} else if (b.getType() == '3x1') {
			return new Sim.Math.Matrix3x1(
				this.a11 * b.a11 + this.a12 * b.a21 + this.a13 * b.a31,
				this.a21 * b.a11 + this.a22 * b.a21 + this.a23 * b.a31,
				this.a31 * b.a11 + this.a32 * b.a21 + this.a33 * b.a31
			);
		}
	} else {
		return null;
	}
};

Sim.Math.Matrix3x3.prototype.getInversed = function() {
	var d = this.getDeterminant(),
		m = new Sim.Math.Matrix3x3(
			this.a33 * this.a22 - this.a32 * this.a23, -(this.a33 * this.a12 - this.a32 * this.a13), this.a23 * this.a12 - this.a22 * this.a13,
			-(this.a33 * this.a21 - this.a31 * this.a23), this.a33 * this.a11 - this.a31 * this.a13, -(this.a23 * this.a11 - this.a21 * this.a13),
			this.a32 * this.a21 - this.a31 * this.a22, -(this.a32 * this.a11 - this.a31 * this.a12), this.a22 * this.a11 - this.a21 * this.a12
		);
	
	return m.getMultiplied(1.0 / d);
};

Sim.Math.Matrix4x3 = function(
	a11, a12, a13,
	a21, a22, a23,
	a31, a32, a33,
	a41, a42, a43
) {
	this.a11 = a11; this.a12 = a12; this.a13 = a13;
	this.a21 = a21; this.a22 = a22; this.a23 = a23;
	this.a31 = a31; this.a32 = a32; this.a33 = a33;
	this.a41 = a41; this.a42 = a42; this.a43 = a43;
};

Sim.Math.Matrix4x3.prototype.getType = function() {
	return '4x3';
};

Sim.Math.Matrix4x3.prototype.getMultiplied = function(b) {
	if (typeof(b) == 'number') {
		return new Sim.Math.Matrix4x3(
			this.a11 * b, this.a12 * b, this.a13 * b,
			this.a21 * b, this.a22 * b, this.a23 * b,
			this.a31 * b, this.a32 * b, this.a33 * b,
			this.a41 * b, this.a42 * b, this.a43 * b
		);
	} else if (typeof(b) == 'object') {
		return new Sim.Math.Matrix4x1(
			this.a11 * b.a11 + this.a12 * b.a21 + this.a13 * b.a31,
			this.a21 * b.a11 + this.a22 * b.a21 + this.a23 * b.a31,
			this.a31 * b.a11 + this.a32 * b.a21 + this.a33 * b.a31,
			this.a41 * b.a11 + this.a42 * b.a21 + this.a43 * b.a31
		);
	} else {
		return null;
	}
};

Sim.Math.Matrix3x1 = function(
	a11,
	a21,
	a31
) {
	this.a11 = a11;
	this.a21 = a21;
	this.a31 = a31;
};

Sim.Math.Matrix3x1.prototype.getMultiplied = function(b) {
	if (typeof(b) == 'number') {
		return new Sim.Math.Matrix3x1(
			this.a11 * b,
			this.a21 * b,
			this.a31 * b
		);
	} else {
		return null;
	}
};

Sim.Math.Matrix3x1.prototype.getType = function() {
	return '3x1';
};

Sim.Math.Matrix4x1 = function(
	a11,
	a21,
	a31,
	a41
) {
	this.a11 = a11;
	this.a21 = a21;
	this.a31 = a31;
	this.a41 = a41;
};

Sim.Math.Matrix4x1.prototype.getType = function() {
	return '4x1';
};