const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader;

        // Check if no token
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        // Verify token
        const secret = process.env.JWT_SECRET || 'ashish123';
        const decodedToken = jwt.verify(token, secret);

        if (!decodedToken) {
            return res.status(401).json({
                success: false,
                message: 'Token verification failed'
            });
        }

        // Set user to request object
        req.user = decodedToken;
        
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Token is not valid or expired'
        });
    }
};

module.exports = authMiddleware;
