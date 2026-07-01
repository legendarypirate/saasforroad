module.exports = (app) => {
  const controller = require('../controllers/family_member.controller.js');
  const router = require('express').Router();

  router.post('/', controller.create);
  router.get('/', controller.findAll);
  router.delete('/:id', controller.delete);

  app.use('/api/family_member', router);
};
