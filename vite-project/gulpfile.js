require('dotenv').config();
const {
  src,
  dest,
  series,
  parallel,
} = require('gulp');
const git = require('git-last-commit');
const replace = require('gulp-replace');
const sass = require('gulp-sass')(require('node-sass'));
const moment = require('moment');
const fs = require('fs-extra');
const { zip } = require('zip-a-folder');
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const speccyLoader = require('speccy/lib/loader');

const { version } = require('./package.json');

const datamodelFile = './build/datamodel.json';
const generateForm = require('./api/utils/generateForm');
const CustomMethods = require('./api/modules/customMethods');
const schemaUtil = require('./api/utils/schemaUtil');
const ganisterMail = require('./api/utils/email');
const { mergeFilesIntoDatamodel } = require('./api/middlewares/datamodelMethods');

require('./markdownParser');

const { CLOUD_STORED_DATAMODEL = 'false' } = process.env;

const envTemplate = `

###########################################
#                                         #
# GANISTER ENVIRONMENT CONFIG             #
#                                         #
###########################################

# NODE ENVIRONEMENT
NODE_ENV=dev

# PACKAGES ex: core,cmii,syseng,mro,purchasing,pe,pm,mpp
PACKAGES=core,cmii,syseng,mro,purchasing,pe,pm,mpp

#INSTANCE_TYPE in: DEV, STAGING, PROD
INSTANCE_TYPE=DEV

#################################
# WEB SERVER CONFIG             #
#################################

# WEB SERVER PORT (EX: 8080)
PORT=8008

# WEB SERVER ROOT URL (EX: http://localhost)
URL=http://localhost
WEBURL=http://localhost:8008

# WEB SERVER HOST NAME (EX: localhost)
HOSTNAME=localhost

# WEB SERVER INSTANCE NAME (EX: Corp)
INSTANCE_NAME=GanisterTrial

#################################
#  DATABASE                     #
#################################

# BOLT URL
DB_BOLTURL=

# DB USERNAME
DB_USERNAME=

# DB PASSWORD
DB_PASSWORD=

# DB ENCRYPTED
DB_ENCRYPTED=

#################################
# CI/CD TESTING                 #
#################################

# BOLT URL TEST DB
TESTDB_BOLTURL=

# TEST DB USERNAME
TESTDB_USERNAME=

# TEST DB PASSWORD
TESTDB_PASSWORD=

#################################
# SECURITY                      #
#################################

# JWT SECRET KEY (EX: ganisterDefaultSalt)
JWT_SECRET=ganisterDefaultAuth

# JWT DURATION 7200000 = 2h
JWT_EXPIRATION=7200000

# IP RESTRICTIONS
IPRESTRICTED=false
ALLOWEDIPS=::1,127.0.0.1

################################
# VAULT                        #
################################

# VAULT CONFIG (local or amazonS3)
ACTIVE_VAULT=local

################################
# OTHER OPTIONAL OPTIONS       #
################################
ACTIVE_EMAILS=false
ACTIVE_GOOGLE_LOGIN=false

################################
# EMAIL                        #
################################

ACTIVE_EMAILS=false
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=

################################
# SINGLE SIGNON                #
################################

ACTIVE_GOOGLE_LOGIN=false
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

################################
# CAD EXCHANGER                #
################################

CADEXCHANGER_APPNAME=
CADEXCHANGER_BASEURL=
CADEXCHANGER_CLIENT_ID=
CADEXCHANGER_CLIENT_SECRET=

################################
# LICENSING                    #
################################

LICENCE_KEY=

################################
# CONVERT API                  #
################################

CONVERTAPI_SECRET=

################################
# DATAMODEL BACKUP             #
################################

MLAB_URL=
CLOUD_STORED_DATAMODEL=false

################################
# GITHUB API                   #
################################

GITHUB_API_ACCESS_TOKEN=

`;

//  Create buld and log directory if not exists
if (!fs.existsSync('log')) {
  fs.mkdirSync('log');
}

if (!fs.existsSync('log/errorLog.json')) {
  fs.closeSync(fs.openSync('log/errorLog.json', 'w'));
}

if (!fs.existsSync('build')) {
  fs.mkdirSync('build');
}


// Update commit information
async function writeCommit(cb) {
  git.getLastCommit((err, commit) => {
    if (!err && commit) {
      src(['config/buildInfo.json'])
        .pipe(replace('@@commit@@', commit.shortHash))
        .pipe(replace('@@commitDate@@', moment.unix(commit.committedOn).format('LLL')))
        .pipe(dest('build/'));
    } else {
      src(['config/buildInfo.json'])
        .pipe(dest('build/'));
    }
  });
  // mongoDisconnect();
  cb();
}
exports.writeCommit = writeCommit;

// Update commit information
async function writeShippingCommit(cb) {
  git.getLastCommit((err, commit) => {
    if (!err && commit) {
      src(['config/buildInfo.json'])
        .pipe(replace('@@commit@@', commit.shortHash))
        .pipe(replace('@@commitDate@@', moment.unix(commit.committedOn).format('LLL')))
        .pipe(dest('config/'));
    }
    cb();
  });
  // mongoDisconnect();
}
exports.writeShippingCommit = writeShippingCommit;


/**
 * sassTransform - transforms Sass files into css
 * @param {*} cb
 */
function sassTransform(cb) {
  src('./client/styles/sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('./client/styles'));
    src('./apps/config/style/sass/**/*.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(dest('./apps/config/style'));
  cb();
}
exports.sassTransform = sassTransform;

async function mongoDisconnect() {
  await mongoose.disconnect();
}
exports.mongoDisconnect = mongoDisconnect;

/**
 * generateGanisterDatamodel
 * @param {*} cb
 */
async function generateGanisterDatamodel(cb) {
  await mergeFilesIntoDatamodel();
  cb();
}
exports.generateGanisterDatamodel = generateGanisterDatamodel;

/**
 * forms
 * @param {*} cb
 */
async function forms(cb) {
  const datamodel = fs.readFileSync(datamodelFile, 'utf8');
  const data = JSON.parse(datamodel);
  data.nodetypeDefinitions.map((nodetype) => {
    nodetype.ui.form.ng = {};
    nodetype.ui.form.ng.schema = generateForm.buildNgSchema(nodetype);
    nodetype.ui.form.ng.form = generateForm.buildNGForm(nodetype, data, 'nodetypeDefinitions');
    //  Remove ng.schema and ng.form if form is empty
    if (nodetype.ui.form.ng.form.length === 0) {
      nodetype.ui.form.ng = {};
    }
  });
  fs.writeFileSync(datamodelFile, JSON.stringify(data, null, '\t'), { encoding: 'utf8' });
  cb();
}
exports.forms = forms;

/**
 * generateNodetypesSchemas
 * @param {*} cb
 */
async function generateNodetypesSchemas(cb) {
  const datamodelJSON = fs.readFileSync(datamodelFile, 'utf8');
  const datamodel = JSON.parse(datamodelJSON);

  schemaUtil.generateNodetypeSchemas(datamodel);
  cb();
}
exports.generateNodetypesSchemas = generateNodetypesSchemas;

/**
 * customMethods
 * @param {*} cb
 */
async function customMethods(cb) {
  const result = CustomMethods.generate();
  if (result.error) {
    console.log(`Error Generating customMethod file: ${result.message}`);
  }
  cb();
}
exports.customMethods = customMethods;

/**
 * customMethods
 * @param {*} cb
 */
async function swaggerDocument(cb) {
  const options = {
    resolve: true,
    jsonSchema: true,
  };

  speccyLoader
    .loadSpec('./help/swagger/index.yaml', options)
    .then((spec) => {
      const swaggerJSON = JSON.stringify(spec, null, '\t');
      fs.writeFileSync('./help/swagger/document.json', swaggerJSON);
      cb();
    });
}
exports.swaggerDocument = swaggerDocument;

exports.buildServer = series(
  parallel(
    writeCommit,
    sassTransform,
  ),
  generateGanisterDatamodel,
  generateNodetypesSchemas,
  forms,
  customMethods,
  swaggerDocument,
  mongoDisconnect,
);

async function exportApp(cb) {
  try {
    if (!fs.existsSync('./delivery')) {
      fs.mkdirSync('./delivery');
    }
  } catch (err) {
    console.error(err);
  }
  src([
    './api/**/*',
    './apps/**/*',
    './dmPatcher/**/*',
    './assets/**/*',
    '!./assets/uploads/*',
    './client/**/*',
    './client/styles/style*',
    './config/**/*',
    './dataloader/**/*',
    './help/**/*',
    '!./help/_*/**/*',
    './spec/**/**/*',
    './test/**/*',
    './views/**/*',
    './.env',
    './.gitignore',
    './*.*',
  ], { base: './' })
    .pipe(dest('./delivery/'));
  mongoDisconnect();
  cb();
}

exports.exportApp = exportApp;

async function zipDelivery(cb) {
  try {
    if (!fs.existsSync('./zipDelivery')) {
      fs.mkdirSync('./zipDelivery');
    }
  } catch (err) {
    console.error(err);
  }
  //  Create .env file
  fs.writeFileSync('./delivery/.env', envTemplate);
  await zip('./delivery', './zipDelivery/ganister.zip');
  fs.remove('./delivery', (err) => {
    if (err) console.error('Temp delivery folder remove issue: ', err);
  });
  mongoDisconnect();
  cb();
}
exports.zipDelivery = zipDelivery;

async function uploadAppToAWS(cb) {
  try {
    const filePath = './zipDelivery/ganister.zip';

    if (fs.existsSync(filePath)) {
      const fileVersion = version.replace(/[.]/g, '');
      const devBranch = process.env.npm_package_config_release ? '' : '-DEV';

      const S3Vault = {
        config: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          bucket: process.env.S3_RELEASES_BUCKET,
          region: process.env.S3_REGION,
          secretAccessKey: process.env.S3_ACCESS_KEY,
          signatureVersion: process.env.S3_SIGNATURE_VERSION || 'v4',
        },
        name: 'amazonS3',
        type: 'amazonS3',
      };

      const S3bucket = new AWS.S3({
        ...S3Vault.config,
        Bucket: S3Vault.config.bucket,
        ContentType: 'application/zip',
      });

      const S3Params = {
        Bucket: S3Vault.config.bucket,
        Body: fs.readFileSync(filePath),
        Key: `GANISTERPLM${fileVersion}${devBranch}.zip`,
      };

      await S3bucket.putObject(S3Params, (error) => {
        if (error) {
          return { error };
        }
      }).promise();
    }
  } catch (err) {
    console.error(err);
  }
  cb();
}
exports.uploadAppToAWS = uploadAppToAWS;

async function getCommits(cb) {
  try {
    const params = {
      method: 'GET',
      headers: {
        Authorization: `token ${process.env.GITHUB_API_ACCESS_TOKEN}`,
      }
    };

    fetch('https://api.github.com/repos/Ganister/PLMJS/tags', params)
      .then((response) => response.json())
      .then((data) => {
        // remove release candidates
        const releaseTags = data.filter(tag => tag.name.slice(0, 2) !== 'rc');

        // sort tags by semVer
        const sortedTags = releaseTags
          .map(tag => tag.name.replace(/\d+/g, n => +n + 100000)).sort()
          .map(tagName => tagName.replace(/\d+/g, n => +n - 100000));

        // get the two last tags
        const lastTags = sortedTags.slice(-2);

        fetch(`https://api.github.com/repos/Ganister/PLMJS/compare/${lastTags[0]}...${lastTags[1]}`, params)
          .then((response) => response.json())
          .then(async (content) => {
            // format commit message
            const commitsMessagesText = content.commits.map((commit) => {
              const commitMessage = commit.commit.message.replace(/[\\\n]{2}/g, '",\n"');
              return `"${commitMessage}",\n\n`;
            });
            const commitsFileContent = commitsMessagesText.join('\n');
            const commitsMailContent = commitsFileContent.replace(/[\\\n]/g, '<br>');

            const emailAddresses = ['yoann@ganister.eu', 'pauline@ganister.eu'];
            const promises = emailAddresses.map(async (emailAddress) => {
              await ganisterMail.send({
                to: emailAddress,
                subject: `Commits summary for Release ${lastTags[1]}`,
                text: commitsMailContent,
                html: commitsMailContent,
                attachments: [
                  {
                    filename: 'pullRequests.txt',
                    content: commitsFileContent,
                  },
                ],
              });
            });
            await Promise.all(promises);
            process.exit();
          });
      });
  } catch (err) {
    console.error(err);
  }
  cb();
}
exports.getCommits = getCommits;
