/**
 * Ganister Config file
 * This module exposes the main configuration informations such as:
 * - database driver
 * - application port
 * - application URL
 * - email sender setup
 * - file vaule configuration
 */
require('dotenv').config();
const neo4j = require('neo4j-driver');

let driver;
const {
  WEBURL,
  ACTIVE_EMAILS,
  ACTIVE_GOOGLE_LOGIN,
  ACTIVE_VAULT,
  CADEXCHANGER_APPNAME,
  CADEXCHANGER_BASEURL,
  CADEXCHANGER_CLIENT_ID,
  CADEXCHANGER_CLIENT_SECRET,
  CONVERTAPI_SECRET,
  DB_BOLTURL,
  DB_PASSWORD,
  DB_USERNAME,
  ELEMENT14_API_KEY,
  DB_ENCRYPTED,
  EMAIL_HOST,
  EMAIL_PASSWORD,
  EMAIL_PORT,
  EMAIL_USER,
  GITHUB_API_ACCESS_TOKEN,
  GITLAB_API_ACCESS_TOKEN,
  GOOGLE_CALLBACK_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  HOSTNAME,
  MLAB_URL,
  CLOUD_STORED_DATAMODEL,
  IHS_USERNAME,
  IHS_PASSWORD,
  Z2DATA_API_KEY,
  INSTANCE_NAME,
  JWT_SECRET,
  JWT_EXPIRATION,
  NODE_ENV,
  PORT,
  PACKAGES,
  IPRESTRICTED,
  ALLOWEDIPS,
  S3_ACCESS_KEY,
  S3_ACCESS_KEY_ID,
  S3_BUCKET,
  S3_REGION,
  S3_SIGNATURE_VERSION,
  TESTDB_BOLTURL,
  TESTDB_PASSWORD,
  TESTDB_USERNAME,
  URL,
} = process.env;

try {
  const db = {
    boltURL: DB_BOLTURL,
    name: 'prodDB',
    password: DB_PASSWORD,
    username: DB_USERNAME,
  };
  const testDB = {
    boltURL: TESTDB_BOLTURL,
    name: 'testDB',
    password: TESTDB_PASSWORD,
    username: TESTDB_USERNAME,
  };
  switch (NODE_ENV) {
    case 'production':
    case 'prod':
    case 'dev':
      driver = neo4j.driver(db.boltURL, neo4j.auth.basic(
        db.username,
        db.password,
      ), { disableLosslessIntegers: true, encrypted: DB_ENCRYPTED === 'true' });
      break;
    default:
      driver = neo4j.driver(testDB.boltURL, neo4j.auth.basic(
        testDB.username,
        testDB.password,
      ), { disableLosslessIntegers: true });
      break;
  }
} catch (error) {
  console.error(`\x1b[41m\x1b[30m Database configuration Error: ${error.message} `);
  console.log(' Please make sure boltURL, username and password for database is configured correctly and restart the application! ');
  console.log(' Application will now exit! \x1b[0m');
  process.exit(1);
}

//  Vault - Local by default, amazonS3 if selected
let S3Vault;

if (S3_ACCESS_KEY && S3_ACCESS_KEY_ID && S3_BUCKET && S3_REGION && S3_SIGNATURE_VERSION) {
  S3Vault = {
    config: {
      accessKeyId: S3_ACCESS_KEY_ID,
      bucket: S3_BUCKET,
      region: S3_REGION,
      secretAccessKey: S3_ACCESS_KEY,
      signatureVersion: S3_SIGNATURE_VERSION || 'v4',
    },
    name: 'amazonS3',
    type: 'amazonS3',
  };
}

module.exports = {
  activeEmails: ACTIVE_EMAILS === 'true',
  activeGoogleLogin: ACTIVE_GOOGLE_LOGIN === 'true',
  convertApiSecret: CONVERTAPI_SECRET || false,
  cadConversion: {
    cadExchanger: {
      appName: CADEXCHANGER_APPNAME,
      baseURL: CADEXCHANGER_BASEURL,
      clientId: CADEXCHANGER_CLIENT_ID,
      clientSecret: CADEXCHANGER_CLIENT_SECRET,
    },
  },
  db: driver,
  element14ApiKey: ELEMENT14_API_KEY,
  email: {
    auth: {
      pass: EMAIL_PASSWORD,
      user: EMAIL_USER,
    },
    host: EMAIL_HOST,
    pool: true,
    port: EMAIL_PORT,
    secure: true,
    tls: {
      rejectUnauthorized: false,
    },
  },
  env: NODE_ENV,
  githubToken: GITHUB_API_ACCESS_TOKEN,
  gitlabToken: GITLAB_API_ACCESS_TOKEN,
  googleAuth: {
    callbackURL: GOOGLE_CALLBACK_URL,
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
  },
  hostName: HOSTNAME,
  ihsUsername: IHS_USERNAME,
  ihsPassword: IHS_PASSWORD,
  instanceName: INSTANCE_NAME,
  z2DataApiKey: Z2DATA_API_KEY,
  JWT_SECRET,
  JWT_EXPIRATION: parseInt(JWT_EXPIRATION, 10) || 7200000,
  port: PORT,
  S3Vault,
  url: URL,
  WEBURL,
  vault: ACTIVE_VAULT || 'local',
  cloudStoredDatamodel: CLOUD_STORED_DATAMODEL,
  MLAB_URL,
  ipRestrictions: {
    activated: IPRESTRICTED === 'true',
    allowedIps: ALLOWEDIPS ? ALLOWEDIPS.split(',') : [],
  },
  packages: PACKAGES.split(','),
};
