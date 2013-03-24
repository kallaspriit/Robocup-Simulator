Sim.IntersectionLocalizer = function() {
    this.x = 0.0;
    this.y = 0.0;
    this.orientation = 0.0;

	this.yellowGoalPos = {
		x: 0,
		y: sim.config.field.height / 2
	};
	this.blueGoalPos = {
		x: sim.config.field.width,
		y: sim.config.field.height / 2
	};
};

Sim.IntersectionLocalizer.prototype.init = function() {

};

Sim.IntersectionLocalizer.prototype.setPosition = function(x, y, orientation) {
    this.x = x;
    this.y = y;
    this.orientation = orientation;
};

Sim.IntersectionLocalizer.prototype.move = function(velocityX, velocityY, omega, dt) {
    this.orientation = (this.orientation + omega * dt) % Sim.Math.TWO_PI;
    this.x += (velocityX * Math.cos(this.orientation) - velocityY * Math.sin(this.orientation)) * dt;
    this.y += (velocityX * Math.sin(this.orientation) + velocityY * Math.cos(this.orientation)) * dt;
};

Sim.IntersectionLocalizer.prototype.update = function(yellowDistance, blueDistance, yellowAngle, blueAngle, frontGoal) {
    var yellowCircle = new Sim.Math.Circle(this.yellowGoalPos.x, this.yellowGoalPos.y, yellowDistance),
        blueCircle = new Sim.Math.Circle(this.blueGoalPos.x, this.blueGoalPos.y, blueDistance),
        intersections = yellowCircle.getIntersections(blueCircle);

    if (intersections === false) {
	    var currentPos = {
			    x: this.x,
			    y: this.y
		    },
		    dirVector,
		    scaledDir,
		    newPos;

	    if (yellowDistance !== null) {
		    dirVector = Sim.Math.createDirVector(currentPos, this.yellowGoalPos);
			scaledDir = Sim.Math.createMultipliedVector(dirVector, yellowDistance);
		    newPos = Sim.Math.createVectorSum(this.yellowGoalPos, scaledDir);

			this.x = newPos.x;
			this.y = newPos.y;
	    } else if (blueDistance !== null) {
		    dirVector = Sim.Math.createDirVector(currentPos, this.blueGoalPos);
		    scaledDir = Sim.Math.createMultipliedVector(dirVector, blueDistance);
		    newPos = Sim.Math.createVectorSum(this.blueGoalPos, scaledDir);

		    this.x = newPos.x;
		    this.y = newPos.y;
	    }

        return false;
    }

	var correctIntersection = 'unsure';

	if (blueAngle > 0 && yellowAngle > 0) {
		correctIntersection = frontGoal === 'blue' ? 'top' : 'bottom';
	} else if (blueAngle < 0 && yellowAngle < 0) {
		correctIntersection = frontGoal === 'blue' ? 'bottom' : 'top';
	} else {
		var distance1 = Sim.Math.getDistanceBetween(
				{x: intersections.x1, y: intersections.y1},
				{x: this.x, y: this.y}
			),
			distance2 = Sim.Math.getDistanceBetween(
				{x: intersections.x2, y: intersections.y2},
				{x: this.x, y: this.y}
			);

		if (distance1 < distance2) {
			this.x = intersections.x1;
			this.y = intersections.y1;
		} else {
			this.x = intersections.x2;
			this.y = intersections.y2;
		}
	}

	if (correctIntersection === 'top') {
		this.x = intersections.x2;
		this.y = intersections.y2;
	} else if (correctIntersection === 'bottom') {
		this.x = intersections.x1;
		this.y = intersections.y1;
	}

	var verticalOffset = this.y - sim.config.field.height / 2.0,
		zeroAngleBlue = Math.asin(verticalOffset / blueDistance),
		zeroAngleYellow = Math.asin(verticalOffset / yellowDistance),
		posYellowAngle = yellowAngle < 0 ? yellowAngle + Sim.Math.TWO_PI : yellowAngle,
		posBlueAngle = blueAngle < 0 ? blueAngle + Sim.Math.TWO_PI : blueAngle,
		yellowGuess = (Math.PI - (posYellowAngle - zeroAngleYellow)) % Sim.Math.TWO_PI,
		blueGuess = (-zeroAngleBlue - posBlueAngle) % Sim.Math.TWO_PI;

	while (yellowGuess < 0) {
		yellowGuess += Sim.Math.TWO_PI;
	}

	while (blueGuess < 0) {
		blueGuess += Sim.Math.TWO_PI;
	}

	this.orientation = Sim.Math.getAngleAvg(yellowGuess, blueGuess);

	if (this.orientation < 0) {
		this.orientation += Sim.Math.TWO_PI;
	}
};

Sim.IntersectionLocalizer.prototype.getPosition = function() {
    return {
        x: this.x,
        y: this.y,
        orientation: this.orientation
    };
};