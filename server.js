import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Add the version: "v1" here!
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Endpoint to list all available models
app.get('/list-models', async (req, res) => {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models?key=' + process.env.GEMINI_API_KEY);
    const data = await response.json();
    const models = data.models.map(model => ({
      name: model.name,
      displayName: model.displayName,
      supportedGenerationMethods: model.supportedGenerationMethods
    }));
    res.json({ models: models });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error listing models: " + error.message });
  }
});

app.post('/ask-gemini', async (req, res) => {
  try {
    const modelName = "gemini-2.5-flash";
    const prompt = req.body.prompt;
    
    // Text generation
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    res.json({ 
      type: 'text',
      text: result.response.text() 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ text: "AI Error: " + error.message });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:5500'));