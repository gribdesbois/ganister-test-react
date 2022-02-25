const { CronJob } = require('cron');
const fs = require('fs');
const _ = require('lodash');
const config = require('./config/config');

const driver = require('./config/config').db;
const upload = require('./api/controllers/uploadController');

const counter = () => {
  const job = new CronJob('* */24 * * * *', async () => {
    getDbMetrics();
  }, null, true, 'America/Los_Angeles');
  job.start();
};


const userProfilePict = () => {
  const job = new CronJob('* */2 * * * *', async () => {
    getProfilePictPublicUrls();
  }, null, true, 'America/Los_Angeles');
  job.start();
};

// if using S3
const getProfilePictPublicUrls = async () => {
  try {
    if (config.vault === 'amazonS3') {
      const session = driver.session();
      const result = await session.run(`
      MATCH
        (n:user)
      RETURN
        n as users
    `);

      const users = result.records;
      users.forEach((user) => {
        const userRec = user.get('users');
        if (userRec.properties.s3Key && userRec.properties.s3Filename) {
          upload.downloadAmazonS3File(userRec.properties.s3Key, userRec.properties.s3Filename)
        }
      });
    }
  } catch (err) {
    console.error('could not get profile picture public urls', err);
  }

}
getProfilePictPublicUrls();

const getDbMetrics = async () => {
  try {
    const session = driver.session();
    const result = await session.run(`
    MATCH
      (n)
    OPTIONAL MATCH
      (n)-[x]->()
    RETURN
      count(DISTINCT n) AS nodes, count(x) AS relationships
  `);
    const nodes = result.records[0].get('nodes');
    const relationships = result.records[0].get('relationships');
    const row = { timestamp: Date.now(), nodes, relationships };
    fs.appendFile('./log/dbAnalytics.log', `\n  ${JSON.stringify(row)}`, (err) => {
      if (err) throw err;
    });
  } catch (err) {
    console.error('could not get db metrics', err);
  }
}
getDbMetrics();

module.exports = {
  counter,
  userProfilePict,
};