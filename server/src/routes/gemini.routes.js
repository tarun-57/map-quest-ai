const { Router } = require('express');
const geminiController = require('../controllers/gemini.controller');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = Router();

router.get('/gemini-status', asyncHandler(geminiController.status));
router.get('/gemini-raw', asyncHandler(geminiController.raw));

module.exports = router;
