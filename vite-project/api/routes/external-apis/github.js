const router = require('express-promise-router')();
const passport = require('passport');

const githubController = require('../../controllers/external-apis/githubController');
const config = require('../../../config/config');

require('../../middlewares/passport');

// passport strategies
const passportJWT = passport.authenticate(['jwt', 'apikey'], { session: false });

router.use((req, res, next) => {
  if (!config.githubToken) return res.status(404).send({ error: true, message: 'Github Token is missing from configuration' });
  next();
});

router.route('/issues')
  .get(passportJWT, githubController.getIssues);

router.route('/issues/listForRepo')
  .post(passportJWT, githubController.issuesListForRepo);

router.route('/commits/listCommits')
  .post(passportJWT, githubController.listCommits);

module.exports = router;
