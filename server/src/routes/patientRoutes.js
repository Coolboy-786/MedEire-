const { Router } = require('express');
const triageController      = require('../controllers/triageController');
const appointmentController = require('../controllers/appointmentController');
const { authenticate }      = require('../middleware/authMiddleware');
const { authorise }         = require('../middleware/roleMiddleware');
const validate              = require('../middleware/validate');
const { triageSchema, bookAppointmentSchema } = require('../middleware/validate');

const router = Router();

router.use(authenticate, authorise(['patient']));

router.post('/triage',             validate(triageSchema),           triageController.classify);
router.get('/doctors',                                                appointmentController.getAvailableDoctors);
router.post('/appointments',       validate(bookAppointmentSchema),  appointmentController.book);
router.get('/appointments',                                           appointmentController.getMyAppointments);
router.patch('/appointments/:id/cancel',                             appointmentController.cancel);

module.exports = router;
