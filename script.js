const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { upload } = require('./config/cloudinary.config');
const userRouter = require('./users/user.route');
const connectToDb = require('./db/connectToDB');
const authRouter = require('./auth/auth.route');
const isAuth = require('./middlewares/isAuth.middleware');
const postRouter = require('./posts/posts.route');

const app = express();

// Connect to MongoDB
connectToDb();

// Middleware: CORS
app.use(cors({
    origin: [
        'https://mini-social-front.vercel.app',
        
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware: JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('uploads'));

// Routes
app.use('/users', isAuth, userRouter);
app.use('/posts', isAuth, postRouter);
app.use('/auth', authRouter);

app.post('/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        res.status(200).json({
            message: "File uploaded successfully",
            file: req.file
        });
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ message: "Server error while uploading file" });
    }
});

app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something broke!" });
});

// ✅ Export for Vercel
module.exports = app;
module.exports.handler = serverless(app);
