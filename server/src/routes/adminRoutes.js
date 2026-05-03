const { Router } = require('express');
const adminController     = require('../controllers/adminController');
const analyticsController = require('../controllers/analyticsController');
const { authenticate }    = require('../middleware/authMiddleware');
const { authorise }       = require('../middleware/roleMiddleware');

const router = Router();

// Every admin route requires a valid JWT + admin role.
// authenticate populates req.user; authorise checks req.user.role.
router.use(authenticate, authorise(['admin']));

router.get('/ping',                    adminController.ping);
router.get('/users',                   adminController.getUsers);
router.get('/doctors/pending',         adminController.getPendingDoctors);
router.patch('/doctors/:id/verify',    adminController.verifyDoctor);

// Analytics — reads TriageLog only; date range via ?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/analytics',               analyticsController.getSummary);

module.exports = router;
