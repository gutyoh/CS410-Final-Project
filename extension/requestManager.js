// Manages the frequency of requests to avoid overloading the IntelliServer API
class RequestManager {
    constructor(requestInterval) {
        this.isProcessing = false; // Indicates if a request to IntelliServer is currently being processed
        this.lastRequestTime = 0; // Timestamp of the last request to IntelliServer
        this.requestInterval = requestInterval; // Minimum time interval between consecutive requests to IntelliServer
    }

    // Determines if a new request to IntelliServer can be made based on the interval and processing status
    canProcessRequest() {
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        return !this.isProcessing && timeSinceLastRequest >= this.requestInterval;
    }

    // Sets the state to processing and records the time of the request to IntelliServer
    startProcessing() {
        this.isProcessing = true;
        this.lastRequestTime = Date.now();
    }

    // Resets the state to not processing, allowing for new requests to IntelliServer
    stopProcessing() {
        this.isProcessing = false;
    }

    // Calculates and returns the time remaining until the next request can be sent to IntelliServer
    getTimeUntilNextRequest() {
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        return ((this.requestInterval - timeSinceLastRequest) / 1000).toFixed(1);
    }
}