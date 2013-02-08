Sim.IntersectionLocalizer = function() {
    this.x = 0.0;
    this.y = 0.0;
    this.orientation = 0.0;
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
    var yellowGoalPos = {
            x: 0,
            y: sim.config.field.height / 2
        },
        blueGoalPos = {
            x: sim.config.field.width,
            y: sim.config.field.height / 2
        },
        yellowCircle = new Sim.Math.Circle(yellowGoalPos.x, yellowGoalPos.y, yellowDistance),
        blueCircle = new Sim.Math.Circle(blueGoalPos.x, blueGoalPos.y, blueDistance),
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
		    dirVector = Sim.Math.createDirVector(currentPos, yellowGoalPos);
			scaledDir = Sim.Math.createMultipliedVector(dirVector, yellowDistance);
		    newPos = Sim.Math.createVectorSum(yellowGoalPos, scaledDir);

			this.x = newPos.x;
			this.y = newPos.y;
	    } else if (blueDistance !== null) {
		    dirVector = Sim.Math.createDirVector(currentPos, blueGoalPos);
		    scaledDir = Sim.Math.createMultipliedVector(dirVector, blueDistance);
		    newPos = Sim.Math.createVectorSum(blueGoalPos, scaledDir);

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
			correctIntersection = 'bottom';
		} else {
			correctIntersection = 'top';
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
		calcOrientationYellow = (Math.PI - (posYellowAngle - zeroAngleYellow)) % Sim.Math.TWO_PI,
		calcOrientationBlue = (-zeroAngleBlue - posBlueAngle) % Sim.Math.TWO_PI;

	while (calcOrientationYellow < 0) {
		calcOrientationYellow += Sim.Math.TWO_PI;
	}

	while (calcOrientationBlue < 0) {
		calcOrientationBlue += Sim.Math.TWO_PI;
	}

	//this.orientation = (calcOrientationYellow + calcOrientationBlue) / 2.0;
	this.orientation = Sim.Math.getAngleAvg(calcOrientationYellow, calcOrientationBlue);

	if (this.orientation < 0) {
		this.orientation += Sim.Math.TWO_PI;
	}

	var angleDiff = Math.abs(Sim.Math.getAngleDiff(this.orientation, sim.game.robots.yellow.orientation));

	if (angleDiff > Math.PI * 0.75) {
		debugger;
	}

	/*sim.dbg.box('Real orientation', Sim.Math.radToDeg(sim.game.robots.yellow.orientation), 1);
	sim.dbg.box('vertical offset', verticalOffset, 1);
	sim.dbg.box('blue angle', blueAngle > 0 ? 'POS' : 'NEG');
	sim.dbg.box('yellow angle', yellowAngle > 0 ? 'POS' : 'NEG');
	sim.dbg.box('front camera goal', frontGoal);
	sim.dbg.box('correct intersection', correctIntersection);
	sim.dbg.box('blue zero angle', Sim.Math.radToDeg(zeroAngleBlue), 1);
	sim.dbg.box('yellow zero angle', Sim.Math.radToDeg(zeroAngleYellow), 1);
	sim.dbg.box('blue goal angle', Sim.Math.radToDeg(posBlueAngle), 1);
	sim.dbg.box('yellow goal angle', Sim.Math.radToDeg(posYellowAngle), 1);
	sim.dbg.box('blue calculated orientation', Sim.Math.radToDeg(calcOrientationBlue), 1);
	sim.dbg.box('yellow calculated orientation', Sim.Math.radToDeg(calcOrientationYellow), 1);*/
};

Sim.IntersectionLocalizer.prototype.getPosition = function() {
    return {
        x: this.x,
        y: this.y,
        orientation: this.orientation
    };
};