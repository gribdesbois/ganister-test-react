require('dotenv').config();

const loadtest = require('loadtest');
const ora = require('ora');
const _ = require('lodash');

const driver = require('./config/config').db; // we load the db location from the JSON files

const { AUTHORIZATION } = process.env;

const tests = async () => {
  let spinner = ora('Testing Parts...').start();
  await new Promise((resolve, reject) => {
    loadtest.loadTest({
      url: 'http://localhost:8008/api/v0/nodes/part',
      maxRequests: 100,
      concurrency: 10,
      headers: {
        Authorization: AUTHORIZATION,
      },
    }, (error, result) => {
      if (error) {
        spinner.fail(`Testing Parts Failed: ${error.message}`);
        reject(error);
      }
      spinner.succeed('Testing Parts Succeed');
      console.info(result);
      resolve(result);
    });
  });

  spinner = ora('Testing Documents...').start();
  // eslint-disable-next-line no-async-promise-executor
  await new Promise(async (resolve, reject) => {
    const session = driver.session();
    const documentRes = await session.run('MATCH (d:document) RETURN d LIMIT 1');
    const record = _.get(documentRes, 'records.0');
    if (!record) reject(new Error('No Document found in db'));
    const document = documentRes.records[0].get('d').properties;
    loadtest.loadTest({
      url: `http://localhost:8008/api/v0/nodes/document/${document._id}`,
      maxRequests: 500,
      concurrency: 20,
      headers: {
        Authorization: AUTHORIZATION,
      },
    }, (error, result) => {
      if (error) {
        spinner.fail(`Testing Documents Failed: ${error.message}`);
        reject(error);
      }
      spinner.succeed('Testing Documents Succeed');
      console.info(result);
      resolve(result);
    });
  });
};

tests();