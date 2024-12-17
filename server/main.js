const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const multer = require('multer');
const util = require('util');
require('dotenv').config();
const fs = require('fs');

// Google Credentials
const { GOOGLE_APPLICATION_CREDENTIALS } = process.env;
process.env.GOOGLE_APPLICATION_CREDENTIALS = GOOGLE_APPLICATION_CREDENTIALS;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Google Cloud Clients
const speechClient = new speech.SpeechClient();
const ttsClient = new textToSpeech.TextToSpeechClient();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const upload = multer();

// Route for the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Content Generation API
app.post('/api/content', async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) return res.status(400).send({ error: 'Question is required' });

        const result = await model.generateContent(question);
        res.status(200).send({ result: result.response.text() });
    } catch (err) {
        console.error('Error generating content:', err.message);
        res.status(500).send({ error: 'Failed to generate content' });
    }
});

// Text-to-Speech API
app.post('/api/text-to-speech', upload.none(), async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).send({ error: 'No text provided for conversion.' });

        const request = {
            input: { text },
            voice: { languageCode: 'hi-IN', name: 'hi-IN-Wavenet-A' },
            audioConfig: { audioEncoding: 'MP3' },
        };

        const [response] = await ttsClient.synthesizeSpeech(request);

        // Send audio buffer as response
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(response.audioContent);
    } catch (err) {
        console.error('Text-to-Speech error:', err.message);
        res.status(500).send({ error: 'Failed to convert text to speech.' });
    }
});

// Speech-to-Text API
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send({ error: 'No audio file uploaded.' });

        const audioBytes = req.file.buffer.toString('base64');

        const [response] = await speechClient.recognize({
            config: {
                encoding: 'LINEAR16',
                languageCode: 'en-US',
            },
            audio: { content: audioBytes },
        });

        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        res.status(200).send({ transcription });
    } catch (err) {
        console.error('Transcription error:', err.message);
        res.status(500).send({ error: 'Failed to transcribe audio.' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
