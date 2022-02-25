const router = require('express-promise-router')();
const passport = require('passport');

const controller = require('../../controllers/external-apis/ihsController');
const config = require('../../../config/config');

require('../../middlewares/passport');

// passport strategies
const passportJWT = passport.authenticate(['jwt', 'apikey'], { session: false });

router.use((req, res, next) => {
  if (!config.ihsUsername || !config.ihsPassword) return res.status(404).send({ error: true, message: 'IHS API Username or Password is missing from configuration' });
  next();
});

router.route('/searchParts')
  .post(passportJWT, controller.searchParts);

module.exports = router;
