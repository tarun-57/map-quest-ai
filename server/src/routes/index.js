const { Router } = require('express');
const healthRoutes = require('./health.routes');
const geminiRoutes = require('./gemini.routes');
const generateRoutes = require('./generate.routes');
const locationRoutes = require('./location.routes');

const router = Router();

router.use(healthRoutes);
router.use('/api', geminiRoutes);
router.use('/api', generateRoutes);
router.use('/api', locationRoutes);

module.exports = router;
