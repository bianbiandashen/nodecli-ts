module.exports = function(app) {
  app.get('/patrolObj/list', app.generateController('patrolObjController.getPatrolObjlist'));
};
