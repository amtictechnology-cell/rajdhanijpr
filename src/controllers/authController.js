const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Check for hardcoded credentials
        if (email !== 'rajdhaniprintersjpr@gmail.com' || password !== '1234') {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const payload = {
            email: 'rajdhaniprintersjpr@gmail.com',
            role: 'admin'
        };
        
        const secret = process.env.JWT_SECRET || 'ashish123';
        const token = jwt.sign(payload, secret, { expiresIn: '24h' });

        logger.info(`Successful login for user: ${email}`);

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                email: 'rajdhaniprintersjpr@gmail.com',
                role: 'admin'
            }
        });
    } catch (error) {
        logger.error(`Error in login controller: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};
