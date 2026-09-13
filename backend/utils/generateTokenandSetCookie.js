import jwt from "jsonwebtoken";

export const generateAuthToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};

export const generateTokenAndSetCookie = (res, userId) => {
    const token = generateAuthToken(userId);
    const cookieSameSite = process.env.COOKIE_SAME_SITE || "lax";

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: cookieSameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return token;
};