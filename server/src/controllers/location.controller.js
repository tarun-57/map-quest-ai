const locationService = require('../services/location.service');

async function randomLocation(req, res) {
  const { scope, value } = req.body || {};
  const location = locationService.getRandomLocation({ scope, value });
  res.json(location);
}

module.exports = { randomLocation };
