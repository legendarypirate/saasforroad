module.exports = (app) => {
  const controller = require('../controllers/emergency_contact.controller.js');
  const router = require('express').Router();

  router.post('/', controller.create);
  router.get('/', controller.findAll);
  router.delete('/:id', controller.delete);

  app.use('/api/emergency_contact', router);
};
