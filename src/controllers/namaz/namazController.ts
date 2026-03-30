import { FastifyRequest, FastifyReply } from 'fastify';

export interface PrayerTimesQuery {
    latitude: number;
    longitude: number;
    date?: string; // YYYY-MM-DD format
    method?: number; // Calculation method
    timezone?: string;
}

interface SunPosition {
    declination: number;
    equationOfTime: number;
}

interface PrayerTimes {
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    date: string;
    hijriDate: string;
    location: {
        latitude: number;
        longitude: number;
    };
}

// Prayer calculation methods
const CALCULATION_METHODS: { [key: number]: { fajrAngle: number; ishaAngle: number; name: string } } = {
    // 1: { fajrAngle: 18, ishaAngle: 17, name: 'University of Islamic Sciences, Karachi' },
    // 2: { fajrAngle: 18, ishaAngle: 18, name: 'Islamic Society of North America (ISNA)' },
    1: { fajrAngle: 17.5, ishaAngle: 19, name: 'Muslim World League' }
    // 4: { fajrAngle: 18, ishaAngle: 17, name: 'Umm Al-Qura University, Makkah' },
    // 5: { fajrAngle: 19.5, ishaAngle: 17.5, name: 'Egyptian General Authority of Survey' },
    // 6: { fajrAngle: 18, ishaAngle: 18, name: 'Institute of Geophysics, University of Tehran' },
};

// Convert degrees to radians
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

// Convert radians to degrees
function toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
}

// Calculate sun position
function getSunPosition(dayOfYear: number): SunPosition {
    const D = dayOfYear;
    const g = 357.529 + 0.98560028 * D;
    const q = 280.459 + 0.98564736 * D;
    const L = q + 1.915 * Math.sin(toRadians(g)) + 0.020 * Math.sin(toRadians(2 * g));
    const e = 23.439 - 0.00000036 * D;
    const RA = toDegrees(Math.atan2(Math.cos(toRadians(e)) * Math.sin(toRadians(L)), Math.cos(toRadians(L))));
    const declination = toDegrees(Math.asin(Math.sin(toRadians(e)) * Math.sin(toRadians(L))));

    // Equation of time
    const EqT = (q - RA) / 15;

    return { declination, equationOfTime: EqT };
}

// Calculate prayer time based on angle
function calculatePrayerTime(
    latitude: number,
    declination: number,
    angle: number,
    direction: 'before' | 'after',
    baseTime: number
): number {
    const latRad = toRadians(latitude);
    const decRad = toRadians(declination);
    const angleRad = toRadians(angle);

    const cosHourAngle = (Math.sin(angleRad) - Math.sin(latRad) * Math.sin(decRad)) /
        (Math.cos(latRad) * Math.cos(decRad));

    if (cosHourAngle > 1 || cosHourAngle < -1) {
        return baseTime; // Sun doesn't reach this angle
    }

    const hourAngle = toDegrees(Math.acos(cosHourAngle)) / 15;

    return direction === 'before' ? baseTime - hourAngle : baseTime + hourAngle;
}

// Format time from decimal hours to HH:MM AM/PM
function formatTime(decimalHours: number): string {
    // Normalize to 24 hours
    decimalHours = ((decimalHours % 24) + 24) % 24;

    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);

    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Get day of year
function getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

// Simple Hijri date approximation
function getHijriDate(gregorianDate: Date): string {
    // Approximate conversion (not precise, but good enough for display)
    const jd = Math.floor((gregorianDate.getTime() / 86400000) + 2440587.5);
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
        Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
    const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
        Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const month = Math.floor((24 * l3) / 709);
    const day = l3 - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;

    const hijriMonths = [
        'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
        'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban',
        'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah'
    ];

    return `${day} ${hijriMonths[month - 1]}, ${year}`;
}

// Calculate all prayer times
function calculatePrayerTimes(
    latitude: number,
    longitude: number,
    date: Date,
    method: number = 1,
    timezone: number = 5.5 // IST default
): PrayerTimes {
    const dayOfYear = getDayOfYear(date);
    const { declination, equationOfTime } = getSunPosition(dayOfYear);

    // Calculate Dhuhr (solar noon)
    const dhuhr = 12 + timezone - longitude / 15 - equationOfTime;

    // Get calculation method
    const calcMethod = CALCULATION_METHODS[method] || CALCULATION_METHODS[1];

    // Calculate other prayer times
    const fajr = calculatePrayerTime(latitude, declination, -calcMethod.fajrAngle, 'before', dhuhr);
    const sunrise = calculatePrayerTime(latitude, declination, -0.833, 'before', dhuhr);
    const maghrib = calculatePrayerTime(latitude, declination, -0.833, 'after', dhuhr);
    const isha = calculatePrayerTime(latitude, declination, -calcMethod.ishaAngle, 'after', dhuhr);

    // Calculate Asr (Hanafi: shadow = 2x object height)
    const latRad = toRadians(latitude);
    const decRad = toRadians(declination);
    const asrAngle = toDegrees(Math.atan(1 / (2 + Math.tan(Math.abs(latRad - decRad)))));
    const asr = calculatePrayerTime(latitude, declination, asrAngle, 'after', dhuhr);

    return {
        fajr: formatTime(fajr),
        sunrise: formatTime(sunrise),
        dhuhr: formatTime(dhuhr),
        asr: formatTime(asr),
        maghrib: formatTime(maghrib),
        isha: formatTime(isha),
        date: date.toISOString().split('T')[0],
        hijriDate: getHijriDate(date),
        location: { latitude, longitude },
    };
}

/**
 * Get prayer times for a location
 */
export async function getPrayerTimes(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as PrayerTimesQuery;
    const { latitude, longitude, date, method = 1 } = query;

    if (latitude === undefined || longitude === undefined) {
        return reply.status(400).send({
            success: false,
            error: { message: 'Latitude and longitude are required' },
        });
    }

    const targetDate = date ? new Date(date) : new Date();

    // Calculate timezone offset based on longitude (approximate)
    const timezoneOffset = Math.round(longitude / 15);

    const prayerTimes = calculatePrayerTimes(
        latitude,
        longitude,
        targetDate,
        method,
        timezoneOffset
    );

    return reply.send({
        success: true,
        data: prayerTimes,
        meta: {
            method: CALCULATION_METHODS[method]?.name || 'Unknown',
            timezone: `UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`,
        },
    });
}

/**
 * Get prayer times for a week
 */
export async function getWeeklyPrayerTimes(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as PrayerTimesQuery;
    const { latitude, longitude, date, method = 1 } = query;

    if (latitude === undefined || longitude === undefined) {
        return reply.status(400).send({
            success: false,
            error: { message: 'Latitude and longitude are required' },
        });
    }

    const startDate = date ? new Date(date) : new Date();
    const timezoneOffset = Math.round(longitude / 15);

    const weeklyTimes = [];
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        weeklyTimes.push(calculatePrayerTimes(
            latitude,
            longitude,
            currentDate,
            method,
            timezoneOffset
        ));
    }

    return reply.send({
        success: true,
        data: weeklyTimes,
        meta: {
            method: CALCULATION_METHODS[method]?.name || 'Unknown',
            timezone: `UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`,
        },
    });
}

/**
 * Get available calculation methods
 */
export async function getCalculationMethods(request: FastifyRequest, reply: FastifyReply) {
    const methods = Object.entries(CALCULATION_METHODS).map(([id, method]) => ({
        id: parseInt(id),
        name: method.name,
        fajrAngle: method.fajrAngle,
        ishaAngle: method.ishaAngle,
    }));

    return reply.send({
        success: true,
        data: methods,
    });
}
