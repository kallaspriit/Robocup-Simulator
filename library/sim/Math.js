Sim.Math = {};

Sim.Math.Vec2 = function(x_,y_) {
	this.x = x_;
	this.y = y_;
   
	/* vector * scalar */
	this.mulS = function (value) {
		return new Vec2(this.x*value, this.y*value);
	}
	/* vector * vector */
	this.mulV = function(vec_) {
		return new Vec2(this.x * vec_.x, this.y * vec_.y);
	}
	/* vector / scalar */
	this.divS = function(value) {
		return new Vec2(this.x/value,this.y/value);
	}
	/* vector + scalar */
	this.addS = function(value) {
		return new Vec2(this.x+value,this.y+value);
	}
	/* vector + vector */
	this.addV  = function(vec_) {
		return new Vec2(this.x+vec_.x,this.y+vec_.y);
	}
	/* vector - scalar */
	this.subS = function(value) {
		return new Vec2(this.x-value, this.y-value);
	}
	/* vector - vector */
	this.subV = function(vec_) {
		return new Vec2(this.x-vec_.x,this.y-vec_.y);
	}
	/*  vector absolute */
	this.abs = function() {
		return new Vec2(Math.abs(this.x),Math.abs(this.y));
	}
	/* dot product */
	this.dot = function(vec_) {
		return (this.x*vec_.x+this.y*vec_.y);
	}
	/* vector length */
	this.length = function() {
		return Math.sqrt(this.dot(this));
	}
	/* vector length, squared */
	this.lengthSqr = function() {
		return this.dot(this);
	}
	/* 
        vector linear interpolation 
        interpolate between two vectors.
        value should be in 0.0f - 1.0f space
    */
	this.lerp = function(vec_, value) { 
		return new Vec2( 
			this.x+(vec_.x-this.x)*value, 
			this.y+(vec_.y-this.y)*value 
		); 
	}
	/* normalize THIS vector */
	this.normalize  = function() {
		var vlen   = this.length();
		this.x = this.x/ vlen;
		this.y = this.y/ vlen;
	}
}

Sim.Math.round = function(number, decimals) {
	return number.toFixed(decimals);
}

Sim.Math.degToRad = function(degrees) {
	return degrees * Math.PI / 180.0;
}