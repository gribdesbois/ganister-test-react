/* eslint-disable global-require */
require('dotenv').config();
const inquirer = require('inquirer');
const superagent = require('superagent');
const AdmZip = require('adm-zip');
const fs = require('fs-extra');
const ora = require('ora');
const _ = require('lodash');
const currentVersion = require('./package.json').version;

//  Initialize Database Driver
const driver = require('./config/config').db;

const agent = superagent.agent();

const baseURL = 'https://ganister.eu';

//  Downloaded zip file name
const zipFile = 'ganister.zip';
//  Folder to export the downloaded zip file
const outputDir = './upgrade/';

const start = async () => {
  const { backup } = await inquirer.prompt([
    {
      type: 'list',
      name: 'backup',
      message: 'Have you backup your solution?',
      choices: ['Yes', 'No, Exit'],
    },
  ]);
  if (backup !== 'Yes') return console.warn('You have to backup your solution before running upgrade');

  const { contactEmail } = await inquirer.prompt([
    {
      type: 'input',
      message: 'Enter email',
      name: 'contactEmail',
    },
  ]);
  if (!contactEmail) return console.error('An email is required');
  let spinner = ora('Validating Email...').start();
  try {
    await agent
      .post(`${baseURL}/auth/userVerificationCode`)
      .set('Content-Type', 'application/json')
      .send({ contactEmail })
      .then((res) => res.body);
    spinner.succeed('Process Completed');
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(0);
  }

  const { verificationCode } = await inquirer.prompt([
    {
      type: 'input',
      message: `We sent you a verification code. 
(If you did not receive an email, then your might not have access to upgrades, contact us contact@ganister.eu) 
Please enter the verification code :`,
      name: 'verificationCode',
    },
  ]);
  if (!verificationCode) return console.error('Verification code is required');

  //  Get versions from ganister.eu
  let versions = [];
  try {
    versions = await agent
      .post(`${baseURL}/releases/ganisterReleases`)
      .set('Content-Type', 'application/json')
      .send({ contactEmail, verificationCode })
      .then((res) => res.body);
  } catch (err) {
    console.log(`Verification failed: ${err.message}`);
    process.exit(0);
  }

  // If versions failed, show error message and exit
  if (versions instanceof Error) return `Cannot get versions list: ${versions.message}`;

  //  Filter versions
  const validVersions = versions.filter((v) => v.url).map((v) => v.version);
  if (!validVersions) return console.error('No versions found');

  const { version } = await inquirer.prompt([
    {
      type: 'list',
      name: 'version',
      message: 'Select version',
      choices: validVersions,
    },
  ]);
  const { confirm } = await inquirer.prompt([
    {
      type: 'list',
      name: 'confirm',
      message: `Version ${version} would be installed. Continue?`,
      choices: ['Yes', 'No, Exit'],
    },
  ]);

  if (confirm !== 'Yes') return 0;

  //  Find Current and Target Versions
  const targetVersion = versions.find((v) => v.version === version);
  const targetVersionIndex = versions.findIndex((v) => v.version === version);
  const currentVersionIndex = versions.findIndex((v) => v.version === currentVersion);

  //  Get all the versions between Current Version and Target Version
  let versionsToInstall = versions.slice(targetVersionIndex, currentVersionIndex);
  if (!_.isEmpty(versionsToInstall)) versionsToInstall = _.reverse(versionsToInstall);

  //  Start Spinner
  spinner = ora('Start installing Ganister...').start();

  //  Download Zip File
  try {
    agent
      .post(`${baseURL}${targetVersion.url}`)
      .set('Accept-Encoding', 'gzip, deflate, br')
      .send({ contactEmail, verificationCode })
      .on('error', (err) => {
        spinner.fail(`Ganister Download Failed! Read error below: ${err.message}`);
        return err;
      })
      .pipe(fs.createWriteStream(zipFile))
      .on('finish', async () => {
        try {
          spinner.succeed('File downloaded');
          spinner = ora('Unzipping file...').start();
          const zip = new AdmZip(zipFile);
          zip.extractAllTo(outputDir, true);
          spinner.succeed('File Unzipped');
        } catch (err) {
          spinner.fail(`Zip extract failed: ${err}`);
          return 0;
        }


        // -------------------------------------------------
        // RUN DB QUERIES
        console.log('check DB QUERIES');
        const session = driver.session();
        const txc = session.beginTransaction();
        try {
          let dbQueries = [];
          versionsToInstall.filter((v) => !_.isEmpty(v.dbQueries)).forEach((v) => {
            dbQueries = [...dbQueries, ...v.dbQueries];
          });
          // Todo: Run dbQueries in a transaction
          for (let index = 0; index < dbQueries.length; index++) {
            spinner = ora(`Running DB Query: ${dbQueries[index].name}...`).start();
            // eslint-disable-next-line no-await-in-loop
            await txc.run(dbQueries[index].query);
            spinner.succeed(`DB Query: ${dbQueries[index].name} finished`);
          }


          // -------------------------------------------------
          // Copying new files
          spinner = ora('Start copying unzipped files to ganister folder...').start();


          // Merge and ignore language files
          console.log('\nstart -> Merge and ignore language files');
          console.log('start -> `${outputDir}assets/locales`', `${outputDir}assets/locales`);
          const upgradedFiles = fs.readdirSync(`${outputDir}assets/locales`);
          const localFiles = fs.readdirSync('./assets/locales');
          upgradedFiles.forEach((file) => {
            // merge with existing
            try {
              if (localFiles.includes(file)) {
                const langFile = fs.readFileSync(`${outputDir}assets/locales/${file}`, 'utf8');
                const langFileData = JSON.parse(langFile);
                try {
                  const langSourceFile = fs.readFileSync(`./assets/locales/${file}`, 'utf8');
                  const langSourceFileData = JSON.parse(langSourceFile);
                  Object.keys(langFileData).forEach((key1) => {
                    if (!langSourceFileData[key1]) {
                      langSourceFileData[key1] = {};
                    }
                    Object.keys(langFileData[key1]).forEach((key2) => {
                      if (!langSourceFileData[key1][key2]) {
                        langSourceFileData[key1][key2] = {};
                      }
                      Object.keys(langFileData[key1][key2]).forEach((key3) => {
                        if (!langSourceFileData[key1][key2][key3]) {
                          // console.log('Value Replaced', [key1, key2, key3]);
                          langSourceFileData[key1][key2][key3] = langFileData[key1][key2][key3];
                        }
                      });
                    });
                  });

                  fs.writeFileSync(`./assets/locales/${file}`, JSON.stringify(langSourceFileData), 'utf8');
                } catch (error) {
                  console.log('target file error', error);
                }
              }
              fs.unlinkSync(`${outputDir}assets/locales/${file}`);
            } catch (error) {
              console.log('source file error', error);
            }
          });

          console.log('start -> Merge and ignore language files ==> DONE');


          // copy path folder
          await fs.copy(`${outputDir}dmPatcher`, './dmPatcher', { overwrite: true });

          // -------------------------------------------------
          // LIST ALL SCRIPTS REQUIRED
          const scripts = require('./dmPatcher/scripts.js');
          const applicableScripts = [];
          versionsToInstall.filter((v) => !_.isEmpty(v.scripts)).forEach((v) => {
            v.scripts.forEach((script) => {
              applicableScripts.push(script);
            });
          });
          for (const applicableScript of applicableScripts) {
            // eslint-disable-next-line no-await-in-loop
            try {
              await scripts[applicableScript]();
            } catch (error) {
              console.error(error);
            }
          }


          // Ingnore .env file
          if (fs.existsSync(`${outputDir}.env`)) {
            fs.unlinkSync(`${outputDir}.env`);
            console.info('.env file ignored');
          }

          // Ingnore languages file
          if (fs.existsSync(`${outputDir}config/languages.json`)) {
            fs.unlinkSync(`${outputDir}config/languages.json`);
            console.info('languages.json file ignored');
          }

          // Ignore models/leftPanelCategories file
          if (fs.existsSync(`${outputDir}api/models/leftPanelCategories.json`)) {
            fs.unlinkSync(`${outputDir}api/models/leftPanelCategories.json`);
            console.info('leftPanelCategories.json file ignored');
          }

          // Ignore models/dm folder
          if (fs.existsSync(`${outputDir}api/models/dm`)) {
            fs.rmdirSync(`${outputDir}api/models/dm`, { recursive: true });
            console.info('DM folder ignored');
          }

          await fs.copy(outputDir, './', { overwrite: true });
          spinner.succeed('Files copied');

          spinner = ora(`Start removing ${outputDir} folder...`).start();
          await fs.rmdir(outputDir, { recursive: true }, (err) => {
            if (err) {
              throw err;
            }
          });
          spinner.succeed(`${outputDir} Folder deleted`);


          // UPDATE GANISTER NODE VERSION

          await txc.run(`MATCH (G:Ganister) SET G.ganisterVersion='${targetVersion.version}' RETURN G`);
          await txc.commit();

          console.log(`
            ----------------------------------------------------------------------------
            |                                                                          |
            |      ██████╗  █████╗ ███╗   ██╗██╗███████╗████████╗███████╗██████╗       |
            |     ██╔════╝ ██╔══██╗████╗  ██║██║██╔════╝╚══██╔══╝██╔════╝██╔══██╗      |
            |     ██║  ███╗███████║██╔██╗ ██║██║███████╗   ██║   █████╗  ██████╔╝      |
            |     ██║   ██║██╔══██║██║╚██╗██║██║╚════██║   ██║   ██╔══╝  ██╔══██╗      |
            |     ╚██████╔╝██║  ██║██║ ╚████║██║███████║   ██║   ███████╗██║  ██║      |
            |      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝      |
            |                                                                          |
            ----------------------------------------------------------------------------\n
            \x1b[32m                Version ${targetVersion.version} has been installed!\x1b[0m \n
            ----------------------------------------------------------------------------\n
                                      Changelog \n
            ----------------------------------------------------------------------------\n`);
          versionsToInstall.filter((c) => c.changeLog).map((v) => {
            console.log(`\nVersion ${v.version}\n\n`);
            console.log(`          \x1b[33m${v.changeLog.join('\n          ')}\x1b[0m \n`);
          });
        } catch (error) {
          spinner.fail('Fail');
          console.error(error);
          await txc.rollback();
        } finally {
          await session.close();
          process.exit(0);
        }
      });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(0);
  }
};

start();
