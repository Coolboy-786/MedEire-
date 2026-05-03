const Joi             = require('joi');
const analyticsService = require('../services/analyticsService');

// Query-param schema: both dates optional, default to last 30 days.
// Joi.date().iso() accepts YYYY-MM-DD strings and converts to Date objects.
const dateRangeSchema = Joi.object({
  from: Joi.date().iso().default(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d;
  }),
  to: Joi.date().iso().min(Joi.ref('from')).default(() => new Date()),
});

const analyticsController = {
  async getSummary(req, res, next) {
    try {
      const { error, value } = dateRangeSchema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        return next(Object.assign(
          new Error(error.details.map((d) => d.message).join('; ')),
          { status: 400, code: 'VALIDATION_ERROR' }
        ));
      }

      const { from, to } = value;
      // Extend 'to' to end-of-day so the filter includes the whole target date
      to.setHours(23, 59, 59, 999);

      const [total, topSymptoms, regional, severity, trends] = await Promise.all([
        analyticsService.getTotalConsultations(from, to),
        analyticsService.getTopSymptoms(from, to),
        analyticsService.getRegionalDistribution(from, to),
        analyticsService.getSeverityDistribution(from, to),
        analyticsService.getTrends(from, to),
      ]);

      res.json({ from, to, total, topSymptoms, regional, severity, trends });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = analyticsController;
