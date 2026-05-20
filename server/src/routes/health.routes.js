const { Router } = require('express');
const healthController = require('../controllers/health.controller');

const router = Router();

router.get('/healthz', healthController.healthz);
router.get('/readyz', healthController.readyz);

module.exports = router;
