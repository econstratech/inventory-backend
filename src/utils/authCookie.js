// Centralized auth-cookie options. Production: Secure + SameSite=Strict.
// Dev: skip Secure so the cookie works over plain http://localhost.
const AUTH_COOKIE_NAME = 'token';

const buildAuthCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
    };
};

module.exports = {
    AUTH_COOKIE_NAME,
    buildAuthCookieOptions,
};
