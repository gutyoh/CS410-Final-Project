class RequestManager {
    constructor(requestInterval) {
        this.isProcessing = false;
        this.lastRequestTime = 0;
        this.requestInterval = requestInterval;
    }

    canProcessRequest() {
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        return !this.isProcessing && timeSinceLastRequest >= this.requestInterval;
    }

    startProcessing() {
        this.isProcessing = true;
        this.lastRequestTime = Date.now();
    }

    stopProcessing() {
        this.isProcessing = false;
    }

    getTimeUntilNextRequest() {
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        return ((this.requestInterval - timeSinceLastRequest) / 1000).toFixed(1);
    }
}