const ora = require('ora');
const AWS = require('aws-sdk');
const { S3 } = require('aws-sdk');
const config = require('../../config/config');

const timer = require('../utils');

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

/**
 * uploadFile
 * @param {*} key
 * @param {*} file
 */
const uploadFile = async (key, file, csv) => {
  // check if file exists
  let fileCheck;

  try {
    fileCheck = await S3bucket.headObject({ Key: key, Bucket: S3Vault.config.bucket }).promise();
  } catch (err) {
    console.error("LOG / file: csvLoader.js / line 34 ", err);
  }

  if (fileCheck && csv.info && fileCheck.ContentLength === csv.info.size) {
    const spinner = ora(`${key} already in s3`).start();
    spinner.succeed(`${key} already in s3`);
    return { Key: key };
  }
  const spinner = ora(`Uploading ${key}`).start();
  const result = await S3bucket.upload({
    Key: key,
    Body: file,
    ContentType: 'text/csv',
    Bucket: S3Vault.config.bucket,
  }).promise();
  spinner.succeed(`${key} uploaded`);
  return result;
};


/**
 * downloadFile
 * @param {*} data 
 * @returns 
 */
const downloadCSV = async (files, data) => {
  return files.map((file, index) => {
    const { Key } = file;
    const nodeName = Key.slice(0, -4);
    const params = { Bucket: S3Vault.config.bucket, Key, Expires: 600 };
    let url = S3bucket.getSignedUrl('getObject', params);
    try {
      url = url.replace(/%2F/g, '/');
      data[index].url = url;
    } catch (error) {
      console.error(error);
    }
    return data[index];
  });
};

const uploadCSV = async (data) => {
  console.info(`Uploading ${data.length} CSV files`);
  let uploadedCSVs;
  try {
    const spinner = ora('Start uploading csv files...').start();
    const start = Date.now();
    const csvFiles = data.map((csv) => {
      return uploadFile(`${csv.name}.csv`, csv.content, csv);
    });

    uploadedCSVs = await Promise.all(csvFiles);
    if (uploadedCSVs === undefined) throw new Error('Error on CSV files upload.');

    spinner.succeed(`Sheets csv files uploaded in ${timer(start)}`);
    return uploadedCSVs;
  } catch (err) {
    console.error(err.message);
  }
};

const removeCSV = async (CSVs) => {
  let spinner;
  try {
    spinner = ora('Start deleting CSVs files from S3 Bucket').start();
    const start = Date.now();
    const deleteParam = {
      Bucket: S3Vault.config.bucket,
      Delete: {
        Objects: CSVs.map((csv) => ({ Key: csv.Key })),
      },
    };
    await S3bucket.deleteObjects(deleteParam);
    spinner.succeed(`Files deleted in ${timer(start)}`);
    return spinner.info('Import Completed!');
  } catch (err) {
    spinner.fail('Files not deleted!');
    console.error(err, err.stack);
  }
};

module.exports = { uploadCSV, removeCSV, downloadCSV };
