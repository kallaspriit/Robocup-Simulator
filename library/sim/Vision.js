Sim.Vision = function() {
	
};

Sim.Vision.prototype.getVisibleBalls = function(polygon, x, y, orientation) {
	var globalPolygon = polygon.rotate(orientation).translate(x, y),
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
			distance = Sim.Math.getDistanceBetween(this, ball) - this.radius;
			angle = Sim.Math.getAngleBetween(this, ball, this.orientation);
			
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
			y: sim.conf.field.height / 2
		},
		yellowLeftPos = {
			x: 0,
			y: sim.conf.field.height / 2 - sim.conf.field.goalWidth / 2
		},
		yellowRightPos = {
			x: 0,
			y: sim.conf.field.height / 2 + sim.conf.field.goalWidth / 2
		},
		blueCenterPos = {
			x: sim.conf.field.width,
			y: sim.conf.field.height / 2
		},
		blueLeftPos = {
			x: sim.conf.field.width,
			y: sim.conf.field.height / 2 - sim.conf.field.goalWidth / 2
		},
		blueRightPos = {
			x: sim.conf.field.width,
			y: sim.conf.field.height / 2 + sim.conf.field.goalWidth / 2
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
		yellowDistance = Sim.Math.getDistanceBetween(pos, yellowCenterPos);
		yellowAngle = Sim.Math.getAngleBetween(pos, yellowCenterPos, orientation);
		
		leftEdgeDistance = null;
		rightEdgeDistance = null;
		leftEdgeAngle = null;
		rightEdgeAngle = null;
		edgeAngleDiff = null;
		
		if (
			globalPolygon.containsPoint(yellowLeftPos.x, yellowLeftPos.y)
			&& globalPolygon.containsPoint(yellowRightPos.x, yellowRightPos.y)
		) {
			leftEdgeDistance = Sim.Math.getDistanceBetween(pos, yellowLeftPos);
			rightEdgeDistance = Sim.Math.getDistanceBetween(pos, yellowRightPos);
			leftEdgeAngle = Sim.Math.getAngleBetween(pos, yellowLeftPos, orientation);
			rightEdgeAngle = Sim.Math.getAngleBetween(pos, yellowRightPos, orientation);
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
		blueDistance = Sim.Math.getDistanceBetween(pos, blueCenterPos);
		blueAngle = Sim.Math.getAngleBetween(pos, blueCenterPos, orientation);
		
		leftEdgeDistance = null;
		rightEdgeDistance = null;
		leftEdgeAngle = null;
		rightEdgeAngle = null;
		edgeAngleDiff = null;
		
		if (
			globalPolygon.containsPoint(blueLeftPos.x, blueLeftPos.y)
			&& globalPolygon.containsPoint(blueRightPos.x, blueRightPos.y)
		) {
			leftEdgeDistance = Sim.Math.getDistanceBetween(pos, blueLeftPos);
			rightEdgeDistance = Sim.Math.getDistanceBetween(pos, blueRightPos);
			leftEdgeAngle = Sim.Math.getAngleBetween(pos, blueLeftPos, orientation);
			rightEdgeAngle = Sim.Math.getAngleBetween(pos, blueRightPos, orientation);
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