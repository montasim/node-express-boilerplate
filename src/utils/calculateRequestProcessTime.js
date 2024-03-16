const calculateRequestProcessTime = (requestStartTime, requestEndTime) => {
    try {
        const processingTimeMs = Math.abs(requestEndTime - requestStartTime);

        return `${processingTimeMs} ms`;
    } catch (error) {
        throw new Error(
            `Failed to calculate request processing time: ${error.message}`
        );
    }
};

export default calculateRequestProcessTime;
