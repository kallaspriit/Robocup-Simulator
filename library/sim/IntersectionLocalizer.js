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
    this.orientation = (this.orientation + omega * dt) % (Math.PI * 2.0);
    this.x += (velocityX * Math.cos(this.orientation) - velocityY * Math.sin(this.orientation)) * dt;
    this.y += (velocityX * Math.sin(this.orientation) + velocityY * Math.cos(this.orientation)) * dt;
};

Sim.IntersectionLocalizer.prototype.update = function(yellowDistance, blueDistance) {
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
        return false;
    }

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
};

Sim.IntersectionLocalizer.prototype.getPosition = function() {
    return {
        x: this.x,
        y: this.y,
        orientation: this.orientation
    };
};