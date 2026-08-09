const rateLimit = require("express-rate-limit");

// Different limiters for different needs
const limiters = {
    // General API limiter
    general: rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 500,
        message: {
            success: false,
            error: 'Too many requests. Please try again in 15 minutes.'
        },
        standardHeaders: true,
        legacyHeaders: false,
    }),

    // Auth limiter (login, register, etc.)
    auth: rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: {
            success: false,
            error: 'Too many authentication attempts. Please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true, // Don't count successful logins
    }),

    // Order creation limiter
    createOrder: rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 10,
        message: {
            success: false,
            error: 'Order limit reached. Maximum 10 orders per hour.'
        },
        standardHeaders: true,
        legacyHeaders: false,
    }),

    // Product API limiter (more lenient)
    product: rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 30, // 30 requests per minute for product lookups
        message: {
            success: false,
            error: 'Too many product requests. Please slow down.'
        },
        standardHeaders: true,
        legacyHeaders: false,
    }),
};

module.exports = limiters;