const generateService = require('../services/generate.service');

async function generate(req, res) {
  const result = await generateService.generateHints(req.body);
  res.json(result);
}

module.exports = { generate };
