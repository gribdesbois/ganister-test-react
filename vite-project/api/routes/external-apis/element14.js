const router = require('express-promise-router')();
const passport = require('passport');

const controller = require('../../controllers/external-apis/element14Controller');
const config = require('../../../config/config');

require('../../middlewares/passport');

// passport strategies
const passportJWT = passport.authenticate(['jwt', 'apikey'], { session: false });

router.use((req, res, next) => {
  if (!config.element14ApiKey) return res.status(404).send({ error: true, message: 'Element14 Token is missing from configuration' });
  next();
});

router.route('/searchTerm')
  .post(passportJWT, controller.searchTerm);

module.exports = router;
