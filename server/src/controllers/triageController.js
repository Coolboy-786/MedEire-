const triageService = require('../services/triageService');

const triageController = {
  async classify(req, res, next) {
    try {
      const { symptoms, county, ageGroup } = req.body;

      // Pass patient's demographic context for anonymised analytics logging
      const patientContext = {
        county:   req.user.county   || county,
        ageGroup: req.user.ageGroup || ageGroup,
        language: req.user.language || 'en',
      };

      const result = await triageService.classify(symptoms, patientContext);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = triageController;
