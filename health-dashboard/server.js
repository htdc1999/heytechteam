require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Google OAuth Constants
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

// Scope for Google Health API v4
const SCOPES = [
    'https://www.googleapis.com/auth/googlehealth.activity_and_fitness'
].join(' ');

app.get('/auth/google', (req, res) => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${encodeURIComponent(SCOPES)}&access_type=offline&prompt=consent`;
    res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).send('No code provided');
    }

    try {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
            params: {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            }
        });

        const { access_token, refresh_token } = tokenResponse.data;
        
        // Store in httpOnly cookies for security in a real app, 
        // but for simplicity here we'll just set it in a regular cookie so frontend can see auth state
        res.cookie('auth_token', access_token, { maxAge: 3600000 }); 
        
        res.redirect('/');
    } catch (error) {
        console.error('Error exchanging code for token', error.response ? error.response.data : error.message);
        res.status(500).send('Authentication failed');
    }
});

app.get('/api/fit-data', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 86400000); // Next day

        const rollupBody = {
            range: {
                start_time: startOfDay.toISOString(),
                end_time: endOfDay.toISOString()
            },
            windowSizeDays: 1
        };

        // 1. Fetch Steps from new Google Health API
        const stepsRes = await axios.post(
            'https://health.googleapis.com/v4/users/me/dataTypes/steps/dataPoints:dailyRollUp',
            rollupBody,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        let steps = 0;
        if (stepsRes.data && stepsRes.data.dataPoints && stepsRes.data.dataPoints.length > 0) {
            // The value is likely nested inside a value object
            steps = stepsRes.data.dataPoints[0].value.intVal || stepsRes.data.dataPoints[0].value.doubleVal || 0;
        }

        // 2. Fetch Active Minutes (replaces Heart Points)
        const hpRes = await axios.post(
            'https://health.googleapis.com/v4/users/me/dataTypes/active-minutes/dataPoints:dailyRollUp',
            rollupBody,
            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );

        let heartPoints = 0;
        if (hpRes.data && hpRes.data.dataPoints && hpRes.data.dataPoints.length > 0) {
            heartPoints = Math.floor(hpRes.data.dataPoints[0].value.intVal || hpRes.data.dataPoints[0].value.doubleVal || 0);
        }
        
        res.json({
            steps: Math.floor(steps),
            heartPoints: heartPoints,
            sleep: "7h 15m", // Mock 
            heartRate: "68 bpm", // Mock
            weight: "165.2 lbs" // Mock
        });

    } catch (error) {
        console.error('Error fetching Health data', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch health data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
