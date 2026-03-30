export const prayerTimesSchema = {
    querystring: {
        type: 'object',
        required: ['latitude', 'longitude'],
        properties: {
            latitude: { type: 'number', minimum: -90, maximum: 90 },
            longitude: { type: 'number', minimum: -180, maximum: 180 },
            date: { type: 'string', format: 'date' },
            method: { type: 'integer', minimum: 1, maximum: 6, default: 1 },
            timezone: { type: 'string' },
        },
    },
};

export const weeklyPrayerTimesSchema = {
    querystring: {
        type: 'object',
        required: ['latitude', 'longitude'],
        properties: {
            latitude: { type: 'number', minimum: -90, maximum: 90 },
            longitude: { type: 'number', minimum: -180, maximum: 180 },
            date: { type: 'string', format: 'date' },
            method: { type: 'integer', minimum: 1, maximum: 6, default: 1 },
        },
    },
};
