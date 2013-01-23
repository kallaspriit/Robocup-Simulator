function LinearKalmanFilter(
	stateTransitionMatrix,		// A
	controlMatrix,				// B
	observationMatrix,			// H
	initialStateEstimate,		// X
	initialCovarianceEstimate,	// P
	processErrorEstimate,		// Q
	measurementErrorEstimate	// R
) {
	this.stateTransitionMatrix = stateTransitionMatrix;
	this.controlMatrix = controlMatrix;
	this.observationMatrix = observationMatrix;
	this.stateEstimate = initialStateEstimate;
	this.covarianceEstimate = initialCovarianceEstimate;
	this.processErrorEstimate = processErrorEstimate;
	this.measurementErrorEstimate = measurementErrorEstimate;
};

LinearKalmanFilter.prototype.getStateEstimate = function() {
	return this.stateEstimate;
};

LinearKalmanFilter.prototype.step = function(controlVector, measurementVector) {
	// prediction step
	var predictedStateEstimate = this.stateTransitionMatrix
			.mul(this.stateEstimate)
			.add(this.controlMatrix.mul(controlVector)),
		predictedProbabilityEstimate = this.stateTransitionMatrix
			.mul(this.covarianceEstimate)
			.mul(this.stateTransitionMatrix.transpose())
			.add(this.processErrorEstimate);
	
	// observation step
	var innovation = measurementVector
			.sub(this.observationMatrix.mul(predictedStateEstimate)),
		innovationCovariance = this.observationMatrix
			.mul(predictedProbabilityEstimate)
			.mul(this.observationMatrix.transpose())
			.add(this.measurementErrorEstimate);
	
	// update step
	var kalmanGain = predictedProbabilityEstimate
			.mul(this.observationMatrix.transpose())
			.mul(innovationCovariance.inverse());
	
	this.stateEstimate = predictedStateEstimate
			.add(kalmanGain.mul(innovation));
	
	this.covarianceEstimate = this.covarianceEstimate.identity()
			.sub(kalmanGain.mul(this.observationMatrix))
			.mul(predictedProbabilityEstimate);
};