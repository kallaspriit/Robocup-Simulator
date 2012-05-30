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
	this.containerId = 'canvas';
	this.wrap = null;
	this.canvasWidth = null;
	this.canvasHeight = null;
	this.widthToHeightRatio = null;
	this.canvasToWorldRatio = null;
	this.bg = null;
	this.c = null;
	
	// appearance
	this.bgStyle = {fill: '#0C0', stroke: 'none'};
	this.fieldStyle = {fill: '#0F0', stroke: 'none'};
	this.wallStyle = {fill: '#030', stroke: 'none'};
	this.lineStyle = {fill: '#FFF', stroke: 'none'};
	this.centerCircleOuterStyle = {fill: '#FFF', stroke: 'none'};
	this.centerCircleInnerStyle = {fill: '#0F0', stroke: 'none'};
	this.leftGoalStyle = {fill: '#DD0', stroke: 'none'};
	this.rightGoalStyle = {fill: '#00D', stroke: 'none'};
	
	this.fieldOffsetX = -(sim.conf.world.width - sim.conf.field.width) / 2;
	this.fieldOffsetY = -(sim.conf.world.height - sim.conf.field.height) / 2;
	
	// objects
	this.robot = null;
	this.robotFrame = null;
	this.robotDir = null;
	this.yellowScore = null;
	this.blueScore = null;
};

Sim.Renderer.prototype.init = function() {
	this.initCanvas();
	this.initGameListeners();
};

Sim.Renderer.prototype.initCanvas = function() {
	this.widthToHeightRatio = sim.conf.world.width / sim.conf.world.height;
	this.wrap = $('#' + this.containerId);
	this.canvasWidth = this.wrap.width();
	this.canvasHeight = this.canvasWidth / this.widthToHeightRatio;
	this.canvasToWorldRatio = this.canvasWidth / sim.conf.world.width;
	this.wrap.height(this.canvasHeight);
	
	this.c = Raphael(this.containerId, this.canvasWidth, this.canvasHeight);
	this.c.setViewBox(this.fieldOffsetX, this.fieldOffsetY, sim.conf.world.width, sim.conf.world.height);
	
	this.draw();
	
	var self = this;
	
	this.wrap.resize(function() {
		self.canvasWidth = $(this).width();
		self.canvasHeight = self.canvasWidth / self.widthToHeightRatio;
		self.canvasToWorldRatio = self.canvasWidth / sim.conf.world.width;
		
		self.wrap.height(self.canvasHeight);

		self.c.setSize(self.canvasWidth, self.canvasHeight);
	});
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
};

Sim.Renderer.prototype.run = function() {
	/*
	var self = this;
	
	window.requestAnimationFrame(function(time){
		self.draw();
		self.run();
	});
	*/
};

Sim.Renderer.prototype.draw = function() {
	this.drawBackground();
	this.drawField();
	this.drawGoals();
	//this.drawGrid();
	
	this.l1 = this.c.circle(0, 0, 0.15);
	this.l1c = this.c.circle(0, 0, 0);
	this.l2 = this.c.circle(0, 0, 0.15);
	this.l2c = this.c.circle(0, 0, 0);
	
	this.a1c = this.c.circle(0, 0, 0);
	this.a2c = this.c.circle(0, 0, 0);
	
	this.l1.attr({stroke: 'none', fill: 'rgba(255, 0, 0, 0.5)'}).hide();
	this.l1c.attr({stroke: '#FF0', fill: 'none', 'stroke-width': 1}).hide();
	this.l2.attr({stroke: 'none', fill: 'rgba(255, 0, 0, 0.5)'}).hide();
	this.l2c.attr({stroke: '#00F', fill: 'none', 'stroke-width': 1}).hide();
	
	this.a1c.attr({stroke: '#FF0', fill: 'none', 'stroke-width': 1}).hide();
	this.a2c.attr({stroke: '#00F', fill: 'none', 'stroke-width': 1}).hide();
};

Sim.Renderer.prototype.drawBackground = function() {
	this.bg = this.c.rect(this.fieldOffsetX, this.fieldOffsetY, sim.conf.world.width, sim.conf.world.height)
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
	
	for (x = 0; x < sim.conf.world.width; x += minorStep) {
		line = this.c.path('M' + x + ' 0L' + x + ' ' + sim.conf.world.height);
		
		if (x % majorStep == 0) {
			line.attr({stroke: majorColor, 'stroke-width': 1});
		} else {
			line.attr({stroke: minorColor, 'stroke-width': 0.5});
		}
		
		line.attr(this.getFieldOffsetTransformAttr());
	}
	
	for (y = 0; y < sim.conf.world.height; y += minorStep) {
		line = this.c.path('M0 ' + y + 'L ' + sim.conf.world.width + ' ' + y);
		
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
	this.c.rect(0, 0, sim.conf.field.width, sim.conf.field.height).attr(this.fieldStyle);
	
	// top and bottom wall
	this.c.rect(-sim.conf.field.wallWidth, -sim.conf.field.wallWidth, sim.conf.field.width + sim.conf.field.wallWidth * 2, sim.conf.field.wallWidth).attr(this.wallStyle);
	this.c.rect(-sim.conf.field.wallWidth, sim.conf.field.height, sim.conf.field.width + sim.conf.field.wallWidth * 2, sim.conf.field.wallWidth).attr(this.wallStyle);
	
	// left and right wall
	this.c.rect(-sim.conf.field.wallWidth, 0, sim.conf.field.wallWidth, sim.conf.field.height).attr(this.wallStyle);
	this.c.rect(sim.conf.field.width, 0, sim.conf.field.wallWidth, sim.conf.field.height).attr(this.wallStyle);
	
	// top and bottom line
	this.c.rect(0, 0, sim.conf.field.width, sim.conf.field.wallWidth).attr(this.lineStyle);
	this.c.rect(0, sim.conf.field.height - sim.conf.field.wallWidth, sim.conf.field.width, sim.conf.field.wallWidth).attr(this.lineStyle);
	
	// left and right line
	this.c.rect(0, sim.conf.field.wallWidth, sim.conf.field.wallWidth, sim.conf.field.height - sim.conf.field.wallWidth * 2).attr(this.lineStyle);
	this.c.rect(sim.conf.field.width - sim.conf.field.wallWidth, sim.conf.field.wallWidth, sim.conf.field.wallWidth, sim.conf.field.height - sim.conf.field.wallWidth * 2).attr(this.lineStyle);
	
	// center circle
	this.c.circle(sim.conf.field.width / 2, sim.conf.field.height / 2, sim.conf.field.centerCircleRadius).attr(this.centerCircleOuterStyle);
	this.c.circle(sim.conf.field.width / 2, sim.conf.field.height / 2, sim.conf.field.centerCircleRadius - sim.conf.field.lineWidth).attr(this.centerCircleInnerStyle);
	
	// center vertical line
	this.c.rect(sim.conf.field.width / 2 - sim.conf.field.wallWidth / 2, sim.conf.field.wallWidth, sim.conf.field.wallWidth, sim.conf.field.height - sim.conf.field.wallWidth * 2).attr(this.lineStyle);
};

Sim.Renderer.prototype.drawGoals = function() {
	// left goal
	this.c.rect(-sim.conf.field.goalDepth, sim.conf.field.height / 2 - sim.conf.field.goalWidth / 2, sim.conf.field.goalDepth, sim.conf.field.goalWidth).attr(this.leftGoalStyle);
	
	this.blueScore = this.c.text(0, 0);
	this.blueScore.attr({
		fill: '#FFF',
		'font-size': 1,
		'transform':
		'S0.4T-0.12 -0.55',
		'text': 0
	});
	
	// right goal
	this.c.rect(sim.conf.field.width, sim.conf.field.height / 2 - sim.conf.field.goalWidth / 2, sim.conf.field.goalDepth, sim.conf.field.goalWidth).attr(this.rightGoalStyle);
	
	this.yellowScore = this.c.text(0, 0);
	this.yellowScore.attr({
		fill: '#FFF',
		'font-size': 1,
		'transform':
		'S0.4T' + (sim.conf.field.width + 0.12) + ' -0.55',
		'text': 0
	});
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
	
	var yellowIndicator = this.c.circle(ball.x, ball.y, sim.conf.ball.radius * 3),
		body = this.c.circle(ball.x, ball.y, sim.conf.ball.radius);
	
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
	
	if (ball._yellowVisible) {
		ballObj.yellowIndicator.attr({fill: 'rgba(255, 255, 0, 0.8)'});
	} else {
		ballObj.yellowIndicator.attr({fill: 'none'});
	}
	
	ballObj.visual.attr({
		cx: ball.x,
		cy: ball.y
	});
};

Sim.Renderer.prototype.removeBall = function(ball) {
	if (typeof(ball._id) == 'undefined') {
		return;
	};
	
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

Sim.Renderer.prototype.addRobot = function(name, robot) {
	this.robots[name] = {
		robot: robot
	};
	
	this.c.setStart();
	
	var dirWidth = 0.03,
		robotFrame = this.c.circle(0, 0, robot.radius),
		robotDir = this.c.path('M-' + robot.radius + ' -' + (dirWidth / 2) + 'M0 -' + (dirWidth / 2) + 'L' + robot.radius + ' -' + (dirWidth / 2) + 'L' + robot.radius + ' ' + (dirWidth / 2) + 'L0 ' + (dirWidth / 2) + 'L0 -' + (dirWidth / 2)),
		cameraFocus1 = this.c.path(Sim.Util.polygonToPath(robot.cameraPoly1, robot.cameraDistance, 0)),
		cameraFocus2 = this.c.path(Sim.Util.polygonToPath(robot.cameraPoly2, robot.cameraDistance * -1, 0)),
		color = robot.side == Sim.Game.Side.YELLOW ? '#DD0' : '#00F';
	
	robotFrame.attr({
		fill: color,
		stroke: 'none'
	});
	
	robotDir.attr({
		fill: '#FFF',
		stroke: 'none'
	});
	
	cameraFocus1.attr({
		fill: 'rgba(255, 255, 255, 0.35)',
		stroke: 'none'
	});
	
	cameraFocus2.attr({
		fill: 'rgba(255, 255, 255, 0.35)',
		stroke: 'none'
	});
	
	this.robots[name].frame = robotFrame;
	this.robots[name].dir = robotDir;
	this.robots[name].visual = this.c.setFinish();
};

Sim.Renderer.prototype.updateRobot = function(name, robot) {
	if (typeof(this.robots[name]) == 'undefined') {
		this.addRobot(name, robot);
	};
	
	this.robots[name].visual.attr({
		transform: 'T' + robot.x + ' ' + robot.y + 'R' + Raphael.deg(robot.orientation)
	});
	
	this.showCommandsQueue(this.robots[name].robot);
};

Sim.Renderer.prototype.updateScore = function(yellowScore, blueScore) {
	this.blueScore.attr('text', blueScore);
	this.yellowScore.attr('text', yellowScore);
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