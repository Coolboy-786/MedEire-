const { Router } = require('express');
const doctorController  = require('../controllers/doctorController');
const { authenticate }  = require('../middleware/authMiddleware');
const { authorise }     = require('../middleware/roleMiddleware');
const validate          = require('../middleware/validate');
const { consultationSchema, availabilitySchema } = require('../middleware/validate');

const router = Router();

router.use(authenticate, authorise(['doctor']));

router.get('/availability',                                              doctorController.getAvailability);
router.put('/availability',        validate(availabilitySchema),        doctorController.updateAvailability);
router.get('/appointments',                                              doctorController.getAppointments);
router.put('/appointments/:id/consult', validate(consultationSchema),   doctorController.completeConsultation);

module.exports = router;
