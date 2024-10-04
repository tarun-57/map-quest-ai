const express = require('express');
const axios = require('axios');
// import Express from 'express';
// import Axios from 'axios';
// import { config } from 'dotenv';

// const axios = require('axios');
require('dotenv').config();

const app = express();
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
  });

  // console.log(completion.choices[0]);
  return completion.choices[0].message.content;
}

app.post('/api/generate', async (req, res) => {
  const { input } = req.body;

  if (!input) {
    return res.status(400).json({ error: 'Input is required' });
  }

  try {
    const output = await handleAPI(input);
    res.json({ output });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the response from OpenAI' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
