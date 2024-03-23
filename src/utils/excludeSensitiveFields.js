const excludeSensitiveFields = (details, fields) => {
    fields.forEach(field => delete details[field]);

    return details;
};

export default excludeSensitiveFields;
