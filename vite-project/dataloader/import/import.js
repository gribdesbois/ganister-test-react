require('dotenv').config();
const inquirer = require('inquirer');
const AWS = require('aws-sdk');

//  Get Datamodel
const config = require('../../config/config');

const timer = require('../utils');
const readFiles = require('./filesReader');
const { uploadCSV, removeCSV } = require('./S3Bucket');
const buildQueries = require('./queriesBuilder');
const runQueries = require('./runQueries');

const { S3Vault } = config;

let S3bucket;
if (S3Vault) {
  S3bucket = new AWS.S3({
    accessKeyId: S3Vault.config.accessKeyId,
    secretAccessKey: S3Vault.config.secretAccessKey,
    Bucket: S3Vault.config.bucket,
    region: S3Vault.config.region,
    signatureVersion: S3Vault.config.signatureVersion,
  });
}

const importData = async (excelFilePath, csvFolderPath) => {
  // Warning for Backup and Confirmation to launch Import
  const { backup } = await inquirer.prompt([
    {
      type: 'list',
      name: 'backup',
      message: 'Have you backup your solution?',
      choices: ['Yes', 'No, Exit'],
    },
  ]);
  if (backup !== 'Yes') return console.error('You have to backup your solution before importing new data!');

  const { fileExtension } = await inquirer.prompt([
    {
      type: 'list',
      name: 'fileExtension',
      message: 'Use Excel or CSV files?',
      choices: ['Excel', 'CSV'],
    },
  ]);

  const start = Date.now();

  const data = await readFiles(fileExtension, excelFilePath, csvFolderPath);
  if (data.length === 0) return false;


  // check if the database is locale or remote
  const localeDB = process.env.DB_LOCALE === 'true';

  let CSVs;
  if (!localeDB) {
    CSVs = await uploadCSV(data);
  }

  const { queries, indexQueries } = await buildQueries(CSVs, data);
  await runQueries(queries, indexQueries);

  if (!localeDB && CSVs) await removeCSV(CSVs);

  console.info(`Data Import done in ${timer(start)}`);
  process.exit();
};

module.exports = importData;