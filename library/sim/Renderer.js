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
	this.containerId = 'canvas';
	this.wrap = null;
	this.canvasWidth = null;
	this.canvasHeight = null;
	this.widthToHeightRatio = null;
	this.canvasToWorldRatio = null;
	this.bg = null;
	this.c = null;
	
	// dimensions
	this.worldWidth = 6000;
	this.worldHeight = 4000;
	this.fieldWidth = 4500;
	this.fieldHeight = 3000;
	this.lineWidth = 50;
	this.wallWidth = 50;
	this.centerCircleRadius = 400;
	this.goalDepth = 250;
	this.goalWidth = 700;
	
	// appearance
	this.bgStyle = {fill: '#0C0', stroke: 'none'};
	this.fieldStyle = {fill: '#0F0', stroke: 'none'};
	this.wallStyle = {fill: '#030', stroke: 'none'};
	this.lineStyle = {fill: '#FFF', stroke: 'none'};
	this.centerCircleOuterStyle = {fill: '#FFF', stroke: 'none'};
	this.centerCircleInnerStyle = {fill: '#0F0', stroke: 'none'};
	this.leftGoalStyle = {fill: '#FF0', stroke: 'none'};
	this.rightGoalStyle = {fill: '#00F', stroke: 'none'};
	
	this.fieldOffsetX = -(this.worldWidth - this.fieldWidth) / 2;
	this.fieldOffsetY = -(this.worldHeight - this.fieldHeight) / 2;
	
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
	
	this.widthToHeightRatio = this.worldWidth / this.worldHeight;
	
	this.wrap = $('#' + this.containerId);
	this.canvasWidth = this.wrap.width();
	this.canvasHeight = this.canvasWidth / this.widthToHeightRatio;
	this.canvasToWorldRatio = this.canvasWidth / this.worldWidth;
	this.wrap.height(this.canvasHeight);
	
	this.c = Raphael(this.containerId, this.canvasWidth, this.canvasHeight);
	this.c.setViewBox(this.fieldOffsetX, this.fieldOffsetY, this.worldWidth, this.worldHeight);
	
	this.draw();
	
	var self = this;
	
	this.wrap.resize(function() {
		self.canvasWidth = $(this).width();
		self.canvasHeight = self.canvasWidth / self.widthToHeightRatio;
		self.canvasToWorldRatio = self.canvasWidth / self.worldWidth;
		self.wrap.height(self.canvasHeight);
		
		sim.dbg.console('resize!', self.canvasToWorldRatio, self.canvasWidth);
		
		self.c.setSize(self.canvasWidth, self.canvasHeight);
		//self.c.setViewBox(self.fieldOffsetX, self.fieldOffsetY, self.worldWidth, self.worldHeight);
	});
};

Sim.Renderer.prototype.initGameListeners = function() {
	var self = this;
	
	this.game.bind(Sim.Game.Event.ROBOT_UPDATED, function(e) {
		self.updateRobot(e.robot);
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
	this.drawRobots();
	//this.drawGrid();
};

Sim.Renderer.prototype.drawBackground = function() {
	this.bg = this.c.rect(this.fieldOffsetX, this.fieldOffsetY, this.worldWidth, this.worldHeight)
	this.bg.attr(this.bgStyle);
};

Sim.Renderer.prototype.drawGrid = function() {
	var majorStep = 1000,
		minorStep = 100,
		majorColor = '#0C0',
		minorColor = '#0E0',
		x,
		y,
		line;
	
	for (x = 0; x < this.worldWidth; x += minorStep) {
		line = this.c.path('M' + x + ' 0L' + x + ' ' + this.worldHeight);
		
		if (x % majorStep == 0) {
			line.attr({stroke: majorColor, 'stroke-width': 1});
		} else {
			line.attr({stroke: minorColor, 'stroke-width': 0.5});
		}
		
		line.attr(this.getFieldOffsetTransformAttr());
	}
	
	for (y = 0; y < this.worldHeight; y += minorStep) {
		line = this.c.path('M0 ' + y + 'L ' + this.worldWidth + ' ' + y);
		
		if (y % majorStep == 0) {
			line.attr({stroke: majorColor, 'stroke-width': 1});
		} else {
			line.attr({stroke: minorColor, 'stroke-width': 0.5});
		}
		
		line.attr(this.getFieldOffsetTransformAttr());
	}
};

Sim.Renderer.prototype.getFieldOffsetTransformAttr = function() {
	return {'transform': 't' + this.fieldOffsetX + ',' + this.fieldOffsetY};
};

Sim.Renderer.prototype.drawField = function() {
	// main field
	this.c.rect(0, 0, this.fieldWidth, this.fieldHeight).attr(this.fieldStyle);
	
	// top and bottom wall
	this.c.rect(-this.wallWidth, -this.wallWidth, this.fieldWidth + this.wallWidth * 2, this.wallWidth).attr(this.wallStyle);
	this.c.rect(-this.wallWidth, this.fieldHeight, this.fieldWidth + this.wallWidth * 2, this.wallWidth).attr(this.wallStyle);
	
	// left and right wall
	this.c.rect(-this.wallWidth, 0, this.wallWidth, this.fieldHeight).attr(this.wallStyle);
	this.c.rect(this.fieldWidth, 0, this.wallWidth, this.fieldHeight).attr(this.wallStyle);
	
	// top and bottom line
	this.c.rect(0, 0, this.fieldWidth, this.wallWidth).attr(this.lineStyle);
	this.c.rect(0, this.fieldHeight - this.wallWidth, this.fieldWidth, this.wallWidth).attr(this.lineStyle);
	
	// left and right line
	this.c.rect(0, this.wallWidth, this.wallWidth, this.fieldHeight - this.wallWidth * 2).attr(this.lineStyle);
	this.c.rect(this.fieldWidth - this.wallWidth, this.wallWidth, this.wallWidth, this.fieldHeight - this.wallWidth * 2).attr(this.lineStyle);
	
	// center circle
	this.c.circle(this.fieldWidth / 2, this.fieldHeight / 2, this.centerCircleRadius).attr(this.centerCircleOuterStyle);
	this.c.circle(this.fieldWidth / 2, this.fieldHeight / 2, this.centerCircleRadius - this.lineWidth).attr(this.centerCircleInnerStyle);
	
	// center vertical line
	this.c.rect(this.fieldWidth / 2 - this.wallWidth / 2, this.wallWidth, this.wallWidth, this.fieldHeight - this.wallWidth * 2).attr(this.lineStyle);
};

Sim.Renderer.prototype.drawGoals = function() {
	// left goal
	this.c.rect(-this.goalDepth, this.fieldHeight / 2 - this.goalWidth / 2, this.goalDepth, this.goalWidth).attr(this.leftGoalStyle);
	
	// right goal
	this.c.rect(this.fieldWidth, this.fieldHeight / 2 - this.goalWidth / 2, this.goalDepth, this.goalWidth).attr(this.rightGoalStyle);
};

Sim.Renderer.prototype.drawRobots = function() {
	//this.c.setStart();
	
	this.robotFrame = this.c.circle(0, 0, 125),
	//this.robotFrame = this.c.rect(0, 0, 250, 250),
	this.robotDir = this.c.rect(0, 0, 100, 30);
	
	//this.robotFrame.attr({fill: 'url(images/robot-bg.png)', stroke: 'none'});
	this.robotFrame.attr({
		fill: '#666',
		stroke: 'none'
	});
	this.robotDir.attr({
		fill: '#FFF',
		stroke: 'none',
		transform: 't0 -15'
	});
	
	//this.robot = this.c.setFinish();
	
};

Sim.Renderer.prototype.updateRobot = function(robot) {
	/*if (this.robot == null) {
		return;
	}*/
	
	//sim.dbg.console('update', robot.x, robot.y);
	
	this.robotFrame.attr({
		cx: robot.x * 1000,
		cy: robot.y * 1000,
		transform: 'r' + Raphael.deg(robot.orientation)
	});
	
	var dirLength = this.robotDir.attr('width'),
		dirWidth = this.robotDir.attr('height');
	
	this.robotDir.attr({
		x: robot.x * 1000,
		y: robot.y * 1000,
		transform: 't-' + (dirLength / 2) + ' -' + (dirWidth / 2) + 'r' + Raphael.deg(robot.orientation) + 't ' + (dirLength / 2) + ' 0'
	});
	
	//this.robotDir.rotate(1);
	
	//this.robotFrame.rotate(Raphael.deg(robot.orientation));

	//sim.dbg.console('r' + Raphael.deg(robot.orientation));
	
	//this.robotFrame.transform('r' + Raphael.deg(robot.orientation));
};