const express = require('express');
const axios = require('axios');
const cors = require('cors');
// import Express from 'express';
// import Axios from 'axios';
// import { config } from 'dotenv';

// const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
const port = process.env.PORT || 3300;

app.use(express.json());

const OpenAI = require("openai");

// const configs = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY
// })
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
// const openai = require('openai');

async function handleAPI(prompt) {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: prompt }],
    model: "gpt-4o-mini",
    // model: "gpt-3.5-turbo",
  });

  // console.log(completion.choices[0]);
  return completion.choices[0].message.content;
}

app.post('/api/generate', async (req, res) => {
  let { input } = req.body;

  const prompt = `Given the coordinates { lat: ${input.lat}, lng: ${input.lng} }, generate three progressively simpler one-line hints to help a Gen Z audience identify the location. Each hint should include a distinctive and well-known cultural, geographical, or entertainment-related fact that is recognizable to a broad audience born in the late 1990s to early 2010s. Avoid using vague or overly general statements.
    Provide the hints in the following format:
    Hint 1: Hint 2: Hint 3:
    Start the response with "Hint 1:"`

  if (!input) {
    return res.status(400).json({ error: 'Input is required' });
  }

  try {
    const output = await handleAPI(prompt);
    res.json({ output });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the response from OpenAI' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
