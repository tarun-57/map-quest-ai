const { Router } = require('express');
const generateController = require('../controllers/generate.controller');
const { asyncHandler } = require('../middleware/asyncHandler');
const { generateLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.post(
  '/generate',
  generateLimiter,
  asyncHandler(generateController.generate),
);

module.exports = router;
