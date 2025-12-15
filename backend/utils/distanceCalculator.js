/**
 * Distance Calculator Utility
 * Uses Haversine formula for calculating distance between GPS coordinates
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {object} Distance in km and miles
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    // Validate inputs
    if (!lat1 || !lng1 || !lat2 || !lng2) {
        return { km: 0, miles: 0, valid: false };
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    const distanceMiles = distanceKm * 0.621371;

    return {
        km: Math.round(distanceKm * 100) / 100,
        miles: Math.round(distanceMiles * 100) / 100,
        valid: true
    };
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

/**
 * Calculate estimated time of arrival
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} avgSpeedKmh - Average speed in km/h (default 40 for urban)
 * @returns {object} ETA details
 */
const calculateETA = (distanceKm, avgSpeedKmh = 40) => {
    if (!distanceKm || distanceKm <= 0) {
        return { minutes: 0, arrivalTime: new Date() };
    }

    // Calculate travel time in minutes
    const travelTimeMinutes = Math.ceil((distanceKm / avgSpeedKmh) * 60);

    // Add 5 minute buffer for parking/walking
    const totalMinutes = travelTimeMinutes + 5;

    // Calculate estimated arrival time
    const arrivalTime = new Date();
    arrivalTime.setMinutes(arrivalTime.getMinutes() + totalMinutes);

    return {
        minutes: totalMinutes,
        travelMinutes: travelTimeMinutes,
        bufferMinutes: 5,
        arrivalTime,
        distanceKm
    };
};

/**
 * Calculate mileage reimbursement
 * @param {number} miles - Distance in miles
 * @param {number} ratePerMile - Rate per mile (default $0.65)
 * @returns {object} Reimbursement details
 */
const calculateReimbursement = (miles, ratePerMile = 0.65) => {
    const amount = miles * ratePerMile;
    return {
        miles,
        rate: ratePerMile,
        amount: Math.round(amount * 100) / 100
    };
};

module.exports = {
    calculateDistance,
    calculateETA,
    calculateReimbursement
};
