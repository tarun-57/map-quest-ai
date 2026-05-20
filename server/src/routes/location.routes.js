const { Router } = require('express');
const locationController = require('../controllers/location.controller');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = Router();

router.post(
  '/random-location',
  asyncHandler(locationController.randomLocation),
);

module.exports = router;
