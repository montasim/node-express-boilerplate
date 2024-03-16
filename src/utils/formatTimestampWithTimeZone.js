const formatTimestampWithTimeZone = (timestamp, locale = 'en-US') => {
    try {
        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZoneName: 'short',
        }).format(new Date(timestamp));
    } catch (error) {
        throw new Error(
            `Failed to format timestamp: ${error.message || error}`
        );
    }
};

export default formatTimestampWithTimeZone;
