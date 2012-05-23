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
	
	this.game.bind(Sim.Game.Event.ROBOT_ADDED, function(e) {
		self.addRobot(e.name, e.robot);
	});
	
	this.game.bind(Sim.Game.Event.ROBOT_UPDATED, function(e) {
		self.updateRobot(e.name, e.robot);
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
	
	// right goal
	this.c.rect(sim.conf.field.width, sim.conf.field.height / 2 - sim.conf.field.goalWidth / 2, sim.conf.field.goalDepth, sim.conf.field.goalWidth).attr(this.rightGoalStyle);
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
	
	var visual = this.c.circle(ball.x, ball.y, sim.conf.ball.radius);
	
	visual.attr({
		fill: '#F90',
		stroke: 'none'
	});
	
	this.balls[id].visual = visual;
	
	this.ballCount++;
};

Sim.Renderer.prototype.updateBall = function(ball) {
	if (typeof(ball._id) == 'undefined') {
		this.addBall(ball);
	};
	
	/*this.balls[ball._id].visual.attr({
		transform: 'T' + ball.x + ' ' + ball.y
	});*/
	
	this.balls[ball._id].visual.attr({
		cx: ball.x,
		cy: ball.y
	});
};

Sim.Renderer.prototype.addRobot = function(name, robot) {
	this.robots[name] = {
		robot: robot
	};
	
	this.c.setStart();
	
	var dirWidth = 0.03,
		robotFrame = this.c.circle(0, 0, robot.radius),
		robotDir = this.c.path('M-' + robot.radius + ' -' + (dirWidth / 2) + 'M0 -' + (dirWidth / 2) + 'L' + robot.radius + ' -' + (dirWidth / 2) + 'L' + robot.radius + ' ' + (dirWidth / 2) + 'L0 ' + (dirWidth / 2) + 'L0 -' + (dirWidth / 2)),
		cameraFocus = this.c.path('M-' + robot.cameraDistance + ' 0M0 0L' + robot.cameraDistance + ' -' + (robot.cameraWidth / 2) + 'L' + robot.cameraDistance + ' ' + (robot.cameraWidth / 2) + 'L0 0'),
		color = robot.side == Sim.Game.Side.YELLOW ? '#DD0' : '#00F';
	
	robotFrame.attr({
		fill: color,
		stroke: 'none'
	});
	
	robotDir.attr({
		fill: '#FFF',
		stroke: 'none'
	});
	
	cameraFocus.attr({
		fill: 'rgba(255, 255, 255, 0.5)',
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
};