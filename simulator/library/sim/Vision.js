Sim.Vision = function() {
	
};

Sim.Vision.prototype.getVisibleBalls = function(polygon, x, y, orientation) {
	var globalPolygon = polygon.rotate(orientation).translate(x, y),
		pos = {x: x, y: y},
		balls = [],
		ball,
		distance,
		angle,
		i;
	
	for (i = 0; i < sim.game.balls.length; i++) {
		ball = sim.game.balls[i];

		if (
			globalPolygon.containsPoint(ball.x, ball.y)
		) {
			distance = Sim.Math.getDistanceBetween(pos, ball);
			angle = Sim.Math.getAngleBetween(pos, ball, orientation);
			
			balls.push({
				ball: ball,
				distance: distance,
				angle: angle
			});
		
			//sim.dbg.box('#' + i, Sim.Math.round(distance, 3) + ' / ' +Sim.Math.round(Sim.Math.radToDeg(angle), 1));
		}
	}
	
	return balls;
};

Sim.Vision.prototype.getVisibleGoals = function(polygon, x, y, orientation) {
	var globalPolygon = polygon.rotate(orientation).translate(x, y),
		pos = {x: x, y: y},
		yellowCenterPos = {
			x: 0,
			y: sim.config.field.height / 2
		},
		yellowLeftPos = {
			x: 0,
			y: sim.config.field.height / 2 - sim.config.field.goalWidth / 2
		},
		yellowRightPos = {
			x: 0,
			y: sim.config.field.height / 2 + sim.config.field.goalWidth / 2
		},
		blueCenterPos = {
			x: sim.config.field.width,
			y: sim.config.field.height / 2
		},
		blueLeftPos = {
			x: sim.config.field.width,
			y: sim.config.field.height / 2 - sim.config.field.goalWidth / 2
		},
		blueRightPos = {
			x: sim.config.field.width,
			y: sim.config.field.height / 2 + sim.config.field.goalWidth / 2
		},
		yellowDistance,
		yellowAngle,
		blueDistance,
		blueAngle,
		leftEdgeDistance,
		rightEdgeDistance,
		leftEdgeAngle,
		rightEdgeAngle,
		edgeAngleDiff,
		goals = [];
	
	if (globalPolygon.containsPoint(yellowCenterPos.x, yellowCenterPos.y)) {
		yellowDistance = Sim.Math.getDistanceBetween(yellowCenterPos, pos);
		yellowAngle = Sim.Math.getAngleBetween(yellowCenterPos, pos, orientation);
		
		leftEdgeDistance = null;
		rightEdgeDistance = null;
		leftEdgeAngle = null;
		rightEdgeAngle = null;
		edgeAngleDiff = null;
		
		if (
			globalPolygon.containsPoint(yellowLeftPos.x, yellowLeftPos.y)
			&& globalPolygon.containsPoint(yellowRightPos.x, yellowRightPos.y)
		) {
			leftEdgeDistance = Sim.Math.getDistanceBetween(yellowLeftPos, pos);
			rightEdgeDistance = Sim.Math.getDistanceBetween(yellowRightPos, pos);
			leftEdgeAngle = Sim.Math.getAngleBetween(yellowLeftPos, pos, orientation);
			rightEdgeAngle = Sim.Math.getAngleBetween(yellowRightPos, pos, orientation);
			edgeAngleDiff = Math.abs(leftEdgeAngle - rightEdgeAngle);

			//sim.dbg.box('Yellow', Sim.Math.round(distance1, 3) + ' ; ' + Sim.Math.round(distance2, 3) + ' / ' + Sim.Math.round(Sim.Math.radToDeg(angle1), 1) + ' ; ' + Sim.Math.round(Sim.Math.radToDeg(angle2), 1) + ' ; ' + Sim.Math.round(Sim.Math.radToDeg(yellowGoalAngle), 1));
		}
		
		goals.push({
			side: Sim.Game.Side.YELLOW,
			distance: yellowDistance,
			angle: yellowAngle,
			leftEdgeDistance: leftEdgeDistance,
			rightEdgeDistance: rightEdgeDistance,
			leftEdgeAngle: leftEdgeAngle,
			rightEdgeAngle: rightEdgeAngle,
			edgeAngleDiff: edgeAngleDiff
		});
		
		//sim.dbg.box('Yellow', yellowDistance, 1);
	}
	
	if (globalPolygon.containsPoint(blueCenterPos.x, blueCenterPos.y)) {
		blueDistance = Sim.Math.getDistanceBetween(blueCenterPos, pos);
		blueAngle = Sim.Math.getAngleBetween(blueCenterPos, pos, orientation);
		
		leftEdgeDistance = null;
		rightEdgeDistance = null;
		leftEdgeAngle = null;
		rightEdgeAngle = null;
		edgeAngleDiff = null;
		
		if (
			globalPolygon.containsPoint(blueLeftPos.x, blueLeftPos.y)
			&& globalPolygon.containsPoint(blueRightPos.x, blueRightPos.y)
		) {
			leftEdgeDistance = Sim.Math.getDistanceBetween(blueLeftPos, pos);
			rightEdgeDistance = Sim.Math.getDistanceBetween(blueRightPos, pos);
			leftEdgeAngle = Sim.Math.getAngleBetween(blueLeftPos, pos, orientation);
			rightEdgeAngle = Sim.Math.getAngleBetween(blueRightPos, pos, orientation);
			edgeAngleDiff = Math.abs(leftEdgeAngle - rightEdgeAngle);

			//sim.dbg.box('blue', Sim.Math.round(distance1, 3) + ' ; ' + Sim.Math.round(distance2, 3) + ' / ' + Sim.Math.round(Sim.Math.radToDeg(angle1), 1) + ' ; ' + Sim.Math.round(Sim.Math.radToDeg(angle2), 1) + ' ; ' + Sim.Math.round(Sim.Math.radToDeg(blueGoalAngle), 1));
		}
		
		goals.push({
			side: Sim.Game.Side.BLUE,
			distance: blueDistance,
			angle: blueAngle,
			leftEdgeDistance: leftEdgeDistance,
			rightEdgeDistance: rightEdgeDistance,
			leftEdgeAngle: leftEdgeAngle,
			rightEdgeAngle: rightEdgeAngle,
			edgeAngleDiff: edgeAngleDiff
		});
		
		//sim.dbg.box('Blue', blueDistance, 1);
	}
	
	return goals;
};

Sim.Vision.prototype.getMeasurements = function(polygon, x, y, orientation) {
	var goals = this.getVisibleGoals(polygon, x, y, orientation),
		goal,
		measurements = {},
		i;
	
	for (i = 0; i < goals.length; i++) {
		goal = goals[i];
		
		if (goal.side == Sim.Game.Side.YELLOW) {
			measurements['yellow-goal-center'] = goal.distance;
			//measurements['yellow-goal-left'] = goal.leftEdgeDistance;
			//measurements['yellow-goal-right'] = goal.rightEdgeDistance;
		} else if (goal.side == Sim.Game.Side.BLUE) {
			measurements['blue-goal-center'] = goal.distance;
			//measurements['blue-goal-left'] = goal.leftEdgeDistance;
			//measurements['blue-goal-right'] = goal.rightEdgeDistance;
		}
	}
	
	return measurements;
};