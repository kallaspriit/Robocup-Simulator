// add cross-browser support for requesting animation frame
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() {callback(currTime + timeToCall);}, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

Sim.Renderer = function(game) {
	this.game = game;
	this.robots = {};
	this.balls = {};
	this.ballCount = 0;
	this.svgContainerId = 'canvas';
	this.wrap = null;
	this.canvasWidth = null;
	this.canvasHeight = null;
	this.widthToHeightRatio = null;
	this.canvasToWorldRatio = null;
	this.bg = null;
	this.c = null;
	this.driveToActive = false;
	this.spawnBallActive = false;
	this.showParticles = false;
	this.showLocalization = false;
	this.showBallLocalizer = false;
	this.driveToOrientation = 0;
	
	// appearance
	this.bgStyle = {fill: '#0C0', stroke: 'none'};
	this.fieldStyle = {fill: '#0F0', stroke: 'none'};
	this.wallStyle = {fill: '#030', stroke: 'none'};
	this.lineStyle = {fill: '#FFF', stroke: 'none'};
	this.centerCircleOuterStyle = {fill: '#FFF', stroke: 'none'};
	this.centerCircleInnerStyle = {fill: '#0F0', stroke: 'none'};
	this.leftGoalStyle = {fill: '#DD0', stroke: 'none'};
	this.rightGoalStyle = {fill: '#00D', stroke: 'none'};
	
	this.fieldOffsetX = -(sim.config.world.width - sim.config.field.width) / 2;
	this.fieldOffsetY = -(sim.config.world.height - sim.config.field.height) / 2;
	
	// objects
	this.field = null;
	this.robot = null;
	this.robotFrame = null;
	this.robotDir = null;
	this.yellowScore = null;
	this.blueScore = null;
	this.driveToIndicator = null;
	this.spawnBallIndicator = null;
};

Sim.Renderer.prototype = new Sim.EventTarget();

Sim.Renderer.Event = {
	DRIVE_TO_REQUESTED: 'drive-to-requested',
	SPAWN_BALL_REQUESTED: 'spawn-ball-requested'
};

Sim.Renderer.prototype.init = function() {
	this.initCanvas();
	this.initGameListeners();
	this.initEventListeners();
};

Sim.Renderer.prototype.initCanvas = function() {
	this.widthToHeightRatio = sim.config.world.width / sim.config.world.height;
	this.heightToWidthRatio = sim.config.world.height / sim.config.world.width;
	this.wrap = $('#' + this.svgContainerId);
	this.canvasWidth = this.wrap.width();
	this.canvasHeight = this.canvasWidth / this.widthToHeightRatio;
	this.canvasToWorldRatio = this.canvasWidth / sim.config.world.width;
	this.wrap.height(this.canvasHeight);
	
	this.c = Raphael(this.svgContainerId, this.canvasWidth, this.canvasHeight);
	this.c.setViewBox(this.fieldOffsetX, this.fieldOffsetY, sim.config.world.width, sim.config.world.height);
	
	this.draw();
	
	var self = this;
	
	this.wrap.resize(function() {
		self.onResize();
	});
};

Sim.Renderer.prototype.onResize = function() {
	var maxWidth = $(window).width(),
		maxHeight = $(window).height();

	this.canvasWidth = this.wrap.width();
	this.canvasHeight = this.canvasWidth / this.widthToHeightRatio;

	if (this.canvasHeight > maxHeight) {
		var div = this.canvasHeight / maxHeight;
		
		this.canvasWidth /= div;
		this.canvasHeight /= div;
		
		this.wrap.css('margin-left', maxWidth / 2 - this.canvasWidth / 2);
	} else {
		this.wrap.css('margin-left', '0');
	}

	this.canvasToWorldRatio = this.canvasWidth / sim.config.world.width;
	this.wrap.height(this.canvasHeight);
	this.c.setSize(this.canvasWidth, this.canvasHeight);
};

Sim.Renderer.prototype.initGameListeners = function() {
	var self = this;
	
	this.game.bind(Sim.Game.Event.BALL_ADDED, function(e) {
		self.addBall(e.ball);
	});
	
	this.game.bind(Sim.Game.Event.BALL_UPDATED, function(e) {
		self.updateBall(e.ball);
	});
	
	this.game.bind(Sim.Game.Event.BALL_REMOVED, function(e) {
		self.removeBall(e.ball);
	});
	
	this.game.bind(Sim.Game.Event.ROBOT_ADDED, function(e) {
		self.addRobot(e.name, e.robot);
	});
	
	this.game.bind(Sim.Game.Event.ROBOT_UPDATED, function(e) {
		self.updateRobot(e.name, e.robot);
	});
	
	this.game.bind(Sim.Game.Event.SCORE_CHANGED, function(e) {
		self.updateScore(e.yellowScore, e.blueScore);
	});
	
	this.game.bind(Sim.Game.Event.RESTARTED, function(e) {
		self.clear();
	});
};

Sim.Renderer.prototype.initEventListeners = function() {
	var self = this;
	
	$(document.body).mousemove(function(e) {
		self.onMouseMove(e);
	});
	
	$('#' + this.svgContainerId).click(function(e) {
		self.onContainerClick(e);
	});
	
	$(window).mousewheel(function(e, delta, deltaX, deltaY) {
		self.onMouseWheel(e, delta, deltaX, deltaY);
	});
	
	sim.game.bind(Sim.Game.Event.GAME_OVER, function(e) {
		self.showGameOver(e.yellowScore, e.blueScore, e.duration);
	});
};

Sim.Renderer.prototype.onMouseMove = function(e) {
	var pos;
		
	if (this.driveToActive) {
		pos = this.translateCoords(e.clientX, event.clientY);

		Sim.Util.confine(pos, 0, sim.config.field.width, 0, sim.config.field.height, 0.125);

		this.driveToIndicator.attr({
			transform: 'R ' + Sim.Math.radToDeg(this.driveToOrientation) + 'T' + pos.x + ' ' + pos.y
		});
	}

	if (this.spawnBallActive) {
		pos = this.translateCoords(e.clientX, event.clientY);

		Sim.Util.confine(pos, 0, sim.config.field.width, 0, sim.config.field.height, sim.config.ball.radius);

		this.spawnBallIndicator.attr({
			cx: pos.x,
			cy: pos.y
		});
	}
};

Sim.Renderer.prototype.onMouseWheel = function(e, delta, deltaX, deltaY) {
	this.driveToOrientation = (this.driveToOrientation + delta * Math.PI / 8) % Sim.Math.TWO_PI;
		
	var pos = this.translateCoords(e.clientX, e.clientY);

	Sim.Util.confine(pos, 0, sim.config.field.width, 0, sim.config.field.height, 0.125);

	this.driveToIndicator.attr({
		transform: 'R ' + Sim.Math.radToDeg(this.driveToOrientation) + 'T' + pos.x + ' ' + pos.y
	});
};

Sim.Renderer.prototype.onContainerClick = function(e) {
	var pos;
		
	if (this.driveToActive) {
		pos = this.translateCoords(e.clientX, e.clientY);

		Sim.Util.confine(pos, 0, sim.config.field.width, 0, sim.config.field.height, 0.125);

		this.driveToIndicator.hide();

		this.showClickAt(pos.x, pos.y);

		this.fire({
			type: Sim.Renderer.Event.DRIVE_TO_REQUESTED,
			x: pos.x,
			y: pos.y,
			orientation: this.driveToOrientation
		});

		this.driveToActive = false;
	}
	
	if (this.spawnBallActive) {
		pos = this.translateCoords(e.clientX, e.clientY);

		Sim.Util.confine(pos, 0, sim.config.field.width, 0, sim.config.field.height, sim.config.ball.radius);

		this.spawnBallIndicator.hide();

		this.showClickAt(pos.x, pos.y);

		this.fire({
			type: Sim.Renderer.Event.SPAWN_BALL_REQUESTED,
			x: pos.x,
			y: pos.y
		});

		this.spawnBallActive = false;
	}
};

Sim.Renderer.prototype.toggleParticles = function() {
	this.showParticles = !this.showParticles;
	
	for (var name in this.robots) {
		if (!this.robots[name].robot.smart) {
			continue;
		}
		
		for (var i = 0; i < this.robots[name].particles.length; i++) {
			if (!this.showParticles) {
				this.robots[name].particles[i].dir.hide();
			} else {
				this.robots[name].particles[i].dir.show();
			}
		}
	}
};

Sim.Renderer.prototype.toggleLocalization = function() {
	this.showLocalization = !this.showLocalization;
	
	for (var name in this.robots) {
		if (!this.robots[name].robot.smart) {
			continue;
		}
		
		if (!this.showLocalization) {
			for (var ballId in this.robots[name].balls) {
				this.robots[name].balls[ballId].body.remove();
				this.robots[name].balls[ballId].id.remove();
				
				delete this.robots[name].balls[ballId];
			}

			this.robots[name].intersectionLocalizer.hide();
			this.robots[name].odometerLocalizer.hide();
			this.robots[name].kalmanLocalizer.hide();
			this.robots[name].particleLocalizer.hide();
		}
	}
};

Sim.Renderer.prototype.showClickAt = function(x, y) {
	var indicator = this.c.circle(x, y, 0.0);

	indicator.attr({
		'fill': 'none',
		'stroke': '#F00',
		'stroke-width': 5
	}).animate({
		r: 0.5,
		opacity: 0
	}, 250, null, function() {
		this.remove();
	});
};

Sim.Renderer.prototype.showCollisionAt = function(x, y) {
	var indicator = this.c.circle(x, y, 0.0);

	indicator.attr({
		'fill': 'none',
		'stroke': '#F00',
		'stroke-width': 3
	}).animate({
		r: 0.25,
		opacity: 0
	}, 250, null, function() {
		this.remove();
	});
};

Sim.Renderer.prototype.translateCoords = function(clientX, clientY) {
	var svg = this.c.canvas;
	
	var svgPoint = svg.createSVGPoint();

	svgPoint.x = clientX;
	svgPoint.y = clientY;

	return svgPoint.matrixTransform(svg.getScreenCTM().inverse());
};

Sim.Renderer.prototype.showGameOver = function(yellowScore, blueScore, duration)  {
	var scoreText;
	
	if (yellowScore > blueScore) {
		scoreText = 'Yellow Wins!';
	} else if (blueScore > yellowScore) {
		scoreText = 'Blue Wins!';
	} else {
		scoreText = 'It\'s a Draw!';
	}
	
	sim.ui.showModal(
		'<h1>' + scoreText + '</h1>' +
		'<div id="yellow-wrap"><span>' + yellowScore + '</span></div>' +
		'<div id="blue-wrap"><span>' + blueScore + '</span></div>' +
		'<div id="match-duration">The match took ' + Sim.Math.round(duration, 1) + ' seconds</div>' +
		'<button id="restart-btn" class="modal-btn">Restart the match</button>',
		'game-over'
	);
};

Sim.Renderer.prototype.draw = function() {
	this.drawBackground();
	this.drawField();
	this.drawGoals();
	this.drawLocalization();
	this.drawDriveTo();
	this.drawSpawnBall();
	//this.drawGrid();
};

Sim.Renderer.prototype.drawBackground = function() {
	this.bg = this.c.rect(this.fieldOffsetX, this.fieldOffsetY, sim.config.world.width, sim.config.world.height)
	this.bg.attr(this.bgStyle);
};

Sim.Renderer.prototype.drawGrid = function() {
	var majorStep = 1.0,
		minorStep = 0.1,
		majorColor = '#0C0',
		minorColor = '#0E0',
		x,
		y,
		line;
	
	for (x = 0; x < sim.config.world.width; x += minorStep) {
		line = this.c.path('M' + x + ' 0L' + x + ' ' + sim.config.world.height);
		
		if (x % majorStep == 0) {
			line.attr({stroke: majorColor, 'stroke-width': 1});
		} else {
			line.attr({stroke: minorColor, 'stroke-width': 0.5});
		}
		
		line.attr(this.getFieldOffsetTransformAttr());
	}
	
	for (y = 0; y < sim.config.world.height; y += minorStep) {
		line = this.c.path('M0 ' + y + 'L ' + sim.config.world.width + ' ' + y);
		
		if (y % majorStep == 0) {
			line.attr({stroke: majorColor, 'stroke-width': 1});
		} else {
			line.attr({stroke: minorColor, 'stroke-width': 0.5});
		}
		
		line.attr(this.getFieldOffsetTransformAttr());
	}
};

Sim.Renderer.prototype.drawField = function() {
	// main field
	this.field = this.c.rect(0, 0, sim.config.field.width, sim.config.field.height).attr(this.fieldStyle);
	
	// top and bottom wall
	this.c.rect(-sim.config.field.wallWidth, -sim.config.field.wallWidth, sim.config.field.width + sim.config.field.wallWidth * 2, sim.config.field.wallWidth).attr(this.wallStyle);
	this.c.rect(-sim.config.field.wallWidth, sim.config.field.height, sim.config.field.width + sim.config.field.wallWidth * 2, sim.config.field.wallWidth).attr(this.wallStyle);
	
	// left and right wall
	this.c.rect(-sim.config.field.wallWidth, 0, sim.config.field.wallWidth, sim.config.field.height).attr(this.wallStyle);
	this.c.rect(sim.config.field.width, 0, sim.config.field.wallWidth, sim.config.field.height).attr(this.wallStyle);
	
	// top and bottom line
	this.c.rect(0, 0, sim.config.field.width, sim.config.field.wallWidth).attr(this.lineStyle);
	this.c.rect(0, sim.config.field.height - sim.config.field.wallWidth, sim.config.field.width, sim.config.field.wallWidth).attr(this.lineStyle);
	
	// left and right line
	this.c.rect(0, sim.config.field.wallWidth, sim.config.field.wallWidth, sim.config.field.height - sim.config.field.wallWidth * 2).attr(this.lineStyle);
	this.c.rect(sim.config.field.width - sim.config.field.wallWidth, sim.config.field.wallWidth, sim.config.field.wallWidth, sim.config.field.height - sim.config.field.wallWidth * 2).attr(this.lineStyle);
	
	// center circle
	this.c.circle(sim.config.field.width / 2, sim.config.field.height / 2, sim.config.field.centerCircleRadius).attr(this.centerCircleOuterStyle);
	this.c.circle(sim.config.field.width / 2, sim.config.field.height / 2, sim.config.field.centerCircleRadius - sim.config.field.lineWidth).attr(this.centerCircleInnerStyle);
	
	// center vertical line
	this.c.rect(sim.config.field.width / 2 - sim.config.field.wallWidth / 2, sim.config.field.wallWidth, sim.config.field.wallWidth, sim.config.field.height - sim.config.field.wallWidth * 2).attr(this.lineStyle);
};

Sim.Renderer.prototype.drawGoals = function() {
	// left goal
	this.c.rect(-sim.config.field.goalDepth, sim.config.field.height / 2 - sim.config.field.goalWidth / 2, sim.config.field.goalDepth, sim.config.field.goalWidth).attr(this.leftGoalStyle);
	
	this.blueScore = this.c.text(0, 0);
	this.blueScore.attr({
		fill: '#FFF',
		'font-size': 1,
		'transform':
		'S0.4T-0.12 -0.55',
		'text': 0
	});
	
	// right goal
	this.c.rect(sim.config.field.width, sim.config.field.height / 2 - sim.config.field.goalWidth / 2, sim.config.field.goalDepth, sim.config.field.goalWidth).attr(this.rightGoalStyle);
	
	this.yellowScore = this.c.text(0, 0);
	this.yellowScore.attr({
		fill: '#FFF',
		'font-size': 1,
		'transform':
		'S0.4T' + (sim.config.field.width + 0.12) + ' -0.55',
		'text': 0
	});
};

Sim.Renderer.prototype.drawLocalization = function() {
	this.intersectionCircle1 = this.c.circle(0, 0, 0).attr({stroke: '#FF0', fill: 'none', 'stroke-width': 1}).hide();
	this.intersectionCircle2 = this.c.circle(0, 0, 0).attr({stroke: '#00F', fill: 'none', 'stroke-width': 1}).hide();
};

Sim.Renderer.prototype.drawDriveTo = function() {
	this.driveToIndicator = this.c.path('M-0.125 -0.125L0.125 0L-0.125 0.125 L-0.125 -0.125');
	
	this.driveToIndicator.attr({
		stroke: 'none',
		fill: 'rgba(0, 60, 0, 0.5)'
	}).hide();
};

Sim.Renderer.prototype.drawSpawnBall = function() {
	this.spawnBallIndicator = this.c.circle(0, 0, sim.config.ball.radius)
	
	this.spawnBallIndicator.attr({
		stroke: 'none',
		fill: 'rgba(255, 0, 0, 0.5)'
	}).hide();
};

Sim.Renderer.prototype.showDriveTo = function() {
	this.driveToIndicator.show();
	this.driveToActive = true;
};

Sim.Renderer.prototype.showSpawnBall = function() {
	this.spawnBallIndicator.show();
	this.spawnBallActive = true;
};

Sim.Renderer.prototype.cancelActions = function() {
	this.driveToIndicator.hide();
	this.spawnBallIndicator.hide();
	this.driveToActive = false;
	this.spawnBallActive = false;
};

Sim.Renderer.prototype.getFieldOffsetTransformAttr = function() {
	return {'transform': 't' + this.fieldOffsetX + ',' + this.fieldOffsetY};
};

Sim.Renderer.prototype.addBall = function(ball) {
	var id = this.ballCount;
	
	ball._id = id;
	
	this.balls[id] = {
		ball: ball
	};
	
	this.c.setStart();
	
	var yellowIndicator = this.c.circle(ball.x, ball.y, sim.config.ball.radius * 3),
		body = this.c.circle(ball.x, ball.y, sim.config.ball.radius);
	
	yellowIndicator.attr({
		fill: 'rgba(255, 255, 0, 0.8)',
		stroke: 'none'
	});
	
	body.attr({
		fill: '#F90',
		stroke: 'none'
	});
	
	this.balls[id].yellowIndicator = yellowIndicator;
	this.balls[id].body = body;
	this.balls[id].visual = this.c.setFinish();
	
	this.ballCount++;
};

Sim.Renderer.prototype.updateBall = function(ball) {
	if (typeof(ball._id) == 'undefined') {
		this.addBall(ball);
	};
	
	var ballObj = this.balls[ball._id];
	
	if (ball._yellowVisible && ball._blueVisible) {
		ballObj.yellowIndicator.attr({fill: 'rgba(255, 255, 255, 0.8)'});
	} else if (ball._yellowVisible) {
		ballObj.yellowIndicator.attr({fill: 'rgba(255, 255, 0, 0.8)'});
	} else if (ball._blueVisible) {
		ballObj.yellowIndicator.attr({fill: 'rgba(0, 0, 255, 0.8)'});
	} else {
		ballObj.yellowIndicator.attr({fill: 'none'});
	}
	
	ballObj.visual.attr({
		cx: ball.x,
		cy: ball.y
	});
};

Sim.Renderer.prototype.removeBall = function(ball) {
	if (typeof(ball) == 'undefined' ||typeof(ball._id) == 'undefined') {
		return;
	}
	
	this.balls[ball._id].visual.remove();
	
	var newBalls = {},
		ballName;
	
	for (ballName in this.balls) {
		if (ballName != ball._id) {
			newBalls[ballName] = this.balls[ballName];
		}
	}
	
	this.balls = newBalls;
};

Sim.Renderer.prototype.createRobotAvatar = function(color, radius, cameraFOV, cameraDistance) {
	this.c.setStart();

	var dirWidth = 0.03,
		frame = this.c.circle(0, 0, radius),
		dir = this.c.path('M-' + radius + ' -' + (dirWidth / 2) + 'M0 -' + (dirWidth / 2) + 'L' + radius + ' -' + (dirWidth / 2) + 'L' + radius + ' ' + (dirWidth / 2) + 'L0 ' + (dirWidth / 2) + 'L0 -' + (dirWidth / 2));

	frame.attr({
		fill: color,
		stroke: 'none'
	});

	dir.attr({
		fill: '#FFF',
		stroke: 'none'
	});

	if (cameraFOV) {
		var cameraFocus = this.c.path(Sim.Util.polygonToPath(cameraFOV, cameraDistance, 0));

		cameraFocus.attr({
			fill: 'rgba(255, 255, 255, 0.35)',
			stroke: 'none'
		});
	}

	return {
		frame: frame,
		dir: dir,
		visual: this.c.setFinish()
	};
};

Sim.Renderer.prototype.addRobot = function(name, robot) {
	this.robots[name] = {
		robot: robot
	};

	var avatar = this.createRobotAvatar(
		robot.side == Sim.Game.Side.YELLOW ? '#DD0' : '#00F',
		robot.radius,
		this.robots[name].robot.smart ? robot.cameraFOV : null,
		robot.cameraDistance
	);

	this.robots[name].frame = avatar.frame;
	this.robots[name].dir = avatar.dir;
	this.robots[name].visual = avatar.visual;

	if (this.robots[name].robot.smart) {
		// localizers
		this.robots[name].odometerLocalizer = this.createRobotAvatar(
			'#600',
			robot.radius / 2
		).visual.hide();

		this.robots[name].intersectionLocalizer = this.createRobotAvatar(
			'#660',
			robot.radius / 2
		).visual.hide();

		this.robots[name].kalmanLocalizer = this.createRobotAvatar(
			'#006',
			robot.radius / 2
		).visual.hide();

		this.robots[name].particleLocalizer = this.createRobotAvatar(
			'#060',
			robot.radius / 2
		).visual.hide();

		// particles
		this.robots[name].particles = [];

		for (var i = 0; i < robot.particleLocalizer.particles.length; i++) {
			var particle = robot.particleLocalizer.particles[i],
				particleDirWidth = 0.02,
				particleDirLength = 0.05,
				particleDir = this.c.path('M-' + particleDirLength + ' -' + (particleDirWidth / 2) + 'M0 -' + (particleDirWidth / 2) + 'L' + particleDirLength + ' -' + (particleDirWidth / 2) + 'L' + particleDirLength + ' ' + (particleDirWidth / 2) + 'L0 ' + (particleDirWidth / 2) + 'L0 -' + (particleDirWidth / 2));

			particleDir.attr({
				fill: 'rgba(255, 0, 0, 1)',
				//fill: 'rgb(0, 245, 0)',
				stroke: 'none',
				transform: 'T' + particle.x + ' ' + particle.y + 'R' + Raphael.deg(particle.orientation)
			}).hide();

			this.robots[name].particles[i] = {
				dir: particleDir
			};
		}

		this.robots[name].balls = {};
	}
};

Sim.Renderer.prototype.updateRobot = function(name, robot) {
	if (typeof(this.robots[name]) == 'undefined') {
		this.addRobot(name, robot);
	};
	
	this.robots[name].visual.attr({
		transform: 'T' + robot.x + ' ' + robot.y + 'R' + Raphael.deg(robot.orientation)
	});
	
	this.showCommandsQueue(this.robots[name].robot);

	if (!this.robots[name].robot.smart) {
		return;
	}

	if (this.showLocalization) {
		this.robots[name].odometerLocalizer.show().attr({
			transform: 'T' + robot.odometerLocalizer.x + ' ' + robot.odometerLocalizer.y + 'R' + Raphael.deg(robot.odometerLocalizer.orientation)
		});

		this.robots[name].intersectionLocalizer.show().attr({
			transform: 'T' + robot.intersectionLocalizer.x + ' ' + robot.intersectionLocalizer.y + 'R' + Raphael.deg(robot.intersectionLocalizer.orientation)
		});

		this.robots[name].kalmanLocalizer.show().attr({
			transform: 'T' + robot.kalmanLocalizer.x + ' ' + robot.kalmanLocalizer.y + 'R' + Raphael.deg(robot.kalmanLocalizer.orientation)
		});

		this.robots[name].particleLocalizer.show().attr({
			transform: 'T' + robot.virtualX + ' ' + robot.virtualY + 'R' + Raphael.deg(robot.virtualOrientation)
		});

		/*
		var maxProbability = null,
			minProbability = null,
			totalProbability = 0,
			avgProbability,
			i;

		for (i = 0; i < robot.particleLocalizer.particles.length; i++) {
			if (maxProbability == null || robot.particleLocalizer.particles[i].probability > maxProbability) {
				maxProbability = robot.particleLocalizer.particles[i].probability;
			}

			if (minProbability == null || robot.particleLocalizer.particles[i].probability < minProbability) {
				minProbability = robot.particleLocalizer.particles[i].probability;
			}

			totalProbability += robot.particleLocalizer.particles[i].probability;
		}

		avgProbability = totalProbability / robot.particleLocalizer.particles.length;

		sim.dbg.console('max', maxProbability, 'avg', avgProbability);
		*/

		/*
		robot.particleLocalizer.particles.sort(function(a, b) {
			if (a > b) {
				return -1;
			} else if (b > a) {
				return 1;
			} else {
				return 0;
			}
		});
		*/

		var i;

		if (this.showParticles) {
			for (i = 0; i < robot.particleLocalizer.particles.length; i++) {
				var particle = robot.particleLocalizer.particles[i],
					//particleBody = this.robots[name].particles[i].body,
					particleDir = this.robots[name].particles[i].dir;

				//particleBody.attr({
				//	transform: 'T' + particle.x + ' ' + particle.y
				//});

				//if (i < 50) {
					particleDir.show().attr({
						transform: 'T' + particle.x + ' ' + particle.y + 'R' + Raphael.deg(particle.orientation),
						fill: 'rgba(255, 0, 0, ' + Math.max(Math.min(particle.probability, 1.0), 0.1) + ')'
					});
				//} else {
				//	particleDir.hide();
				//}

				/*this.p.fillStyle = 'rgba(255, 0, 0, 0.5)';
				this.p.rect(particle.x, particle.y, 0.1, 0.1);
				this.p.fill();*/
			}
		}

		if (this.showBallLocalizer) {
			var ball,
				ballId,
				updatedBalls = [];

			for (i = 0; i < robot.ballLocalizer.balls.length; i++) {
				ball = robot.ballLocalizer.balls[i];

				if (typeof(this.robots[name].balls[ball.id]) == 'undefined') {
					this.robots[name].balls[ball.id] = this.createGuessedBall(ball);
				} else {
					this.robots[name].balls[ball.id].body.attr({
						cx: ball.x,
						cy: ball.y
					});
					this.robots[name].balls[ball.id].id.attr({
						'transform': this.getGuessedBallTransform(ball)
					});
				}

				updatedBalls.push(ball.id);
			}

			for (ballId in this.robots[name].balls) {
				if (updatedBalls.indexOf(parseInt(ballId)) == -1) {
					this.robots[name].balls[ballId].body.remove();
					this.robots[name].balls[ballId].id.remove();

					delete this.robots[name].balls[ballId];
				}
			}
		}
	} else {
		this.robots[name].kalmanLocalizer.hide();
		this.robots[name].particleLocalizer.hide();
	}
};

Sim.Renderer.prototype.removeRobot = function(name) {
	this.robots[name].frame.remove();
	this.robots[name].dir.remove();
	this.robots[name].visual.remove();
	
	
	var newRobots = {},
		robotName,
		i;
	
	if (this.robots[name].robot.smart) {
		for (i = 0; i < this.robots[name].particles.length; i++) {
			this.robots[name].particles[i].dir.remove();
		}

		for (i = 0; i < this.robots[name].balls.length; i++) {
			if (
				typeof(this.robots[name].balls[i]) != 'object'
				|| typeof(this.robots[name].balls[i].remove) != 'function'
			) {
				continue;
			}

			this.robots[name].balls[i].remove();
		}
	}
	
	for (robotName in this.robots) {
		if (robotName != name) {
			newRobots[robotName] = this.robots[robotName];
		}
	}
	
	this.robots = newRobots;
};

Sim.Renderer.prototype.createGuessedBall = function(ball) {
	var body = this.c.circle(ball.x, ball.y, sim.config.ball.radius * 2),
		id = this.c.text(0, 0);
	
	body.attr({
		'fill': 'none',
		'stroke': '#F00',
		'stroke-width': '1'
	});
	
	id.attr({
		fill: '#F00',
		'font-size': 1,
		'transform': this.getGuessedBallTransform(ball),
		'text': ball.id
	});
	
	return {
		body: body,
		id: id
	};
};

Sim.Renderer.prototype.getGuessedBallTransform = function(ball) {
	return 'T' + ball.x + ' ' + (ball.y - 0.8) + 'S0.15';
};

Sim.Renderer.prototype.updateScore = function(yellowScore, blueScore) {
	this.blueScore.attr('text', blueScore);
	this.yellowScore.attr('text', yellowScore);
};

Sim.Renderer.prototype.clear = function() {
	for (var ballId in this.balls) {
		this.removeBall(this.balls[ballId]);
	}
	
	for (var robotName in this.robots) {
		this.removeRobot(robotName);
	}
};

Sim.Renderer.prototype.showCommandsQueue = function(robot) {
	var commands = robot.commands,
		wrap = $('#commands'),
		i;
	
	wrap.empty();
	
	for (i = 0; i < commands.length; i++) {
		wrap.append('<li>' + robot.commands[i].toString() + '</li>');
	}
};