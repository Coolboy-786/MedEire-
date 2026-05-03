const { Router } = require('express');

const router = Router();

// Health-check — used by Docker, load balancers, and CI smoke tests.
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MedEire API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

router.use('/auth',     require('./authRoutes'));
router.use('/admin',    require('./adminRoutes'));
router.use('/patients', require('./patientRoutes'));
router.use('/doctors',  require('./doctorRoutes'));

module.exports = router;
