Sim.OdometerLocalizer = function() {
    this.x = 0.0;
    this.y = 0.0;
    this.orientation = 0.0;
};

Sim.OdometerLocalizer.prototype.init = function() {

};

Sim.OdometerLocalizer.prototype.setPosition = function(x, y, orientation) {
    this.x = x;
    this.y = y;
    this.orientation = orientation;
};

Sim.OdometerLocalizer.prototype.move = function(velocityX, velocityY, omega, dt) {
    this.orientation = (this.orientation + omega * dt) % Sim.Math.TWO_PI;

    this.x += (velocityX * Math.cos(this.orientation)- velocityY * Math.sin(this.orientation)) * dt;
    this.y += (velocityX * Math.sin(this.orientation) + velocityY * Math.cos(this.orientation)) * dt;
};

Sim.OdometerLocalizer.prototype.getPosition = function() {
    return {
        x: this.x,
        y: this.y,
        orientation: this.orientation
    };
};