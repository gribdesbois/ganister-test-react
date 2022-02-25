const router = require('express-promise-router')();
const passport = require('passport');

const controller = require('../../controllers/external-apis/z2DataController');
const config = require('../../../config/config');

require('../../middlewares/passport');

// passport strategies
const passportJWT = passport.authenticate(['jwt', 'apikey'], { session: false });

router.use((req, res, next) => {
  if (!config.z2DataApiKey) return res.status(404).send({ error: true, message: 'Z2 Data API Key is missing from configuration' });
  next();
});

router.route('/searchParts')
  .post(passportJWT, controller.searchParts);

router.route('/getPartDetail')
  .post(passportJWT, controller.getPartDetail);


module.exports = router;
