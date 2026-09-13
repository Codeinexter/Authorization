import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const token = req.cookies?.token || bearerToken;

    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized - no token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || !decoded.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized - invalid token" });
        }

        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.log("Error in verifyToken", error);
        return res.status(401).json({ success: false, message: "Unauthorized - invalid token" });
    }
};