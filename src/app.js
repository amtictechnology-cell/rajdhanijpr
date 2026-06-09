const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
// Twilio Routes import removed — not needed here
const indexRoutes = require('./routes/indexRoutes');

const app = express();

// Middlewares
app.use(helmet());
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:4200",
    "http://127.0.0.1:3000",
    "http://localhost:4500",
    "http://localhost:4600",
    "http://127.0.0.1:4500",
    "http://127.0.0.1:4600",
    
];

app.use(cors({
    origin: function (origin, callback) {
        // Allows requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

        if (allowedOrigins.includes(normalizedOrigin) || normalizedOrigin.endsWith('.vercel.app')) {
            return callback(null, true);
        } else {
            console.error(`[CORS Error] Origin blocked: ${origin}`);
            return callback(new Error(`Not allowed by CORS. Blocked Origin: ${origin}`));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Http Logger
app.use(morgan('combined', { stream: logger.stream }));

app.use('/api/v1', indexRoutes)
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'backend server is running' });
})

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is running smoothly' });
});

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Resource not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

module.exports = app;
