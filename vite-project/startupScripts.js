
require('dotenv').config();
const ora = require('ora');

const Database = require('./api/modules/database');
const DataService = require('./api/modules/dataService');

const instanceVersion = require('./package.json').version;

const driver = require('./config/config').db;

global.datamodel = require('./build/datamodel.json');

const verifyDriverConnection = async () => {
  try {
    await driver.verifyConnectivity();
  } catch (error) {
    console.error(`\x1b[41m\x1b[30m Database configuration Error: ${error.message} `);
    console.log(' Application will now exit! \x1b[0m');
    process.exit(0);
  }
};

async function reset() {
  const spinner = ora('Cleaning DB').start();

  const query = 'MATCH (n) DETACH DELETE n RETURN n';
  await Database.runQuery(query);

  spinner.succeed('Cleaning DB');
}

async function initScript() {
  let spinner;

  try {
    const globalSpinner = ora('Initializing Database...').start();

    await verifyDriverConnection();

    spinner = ora('Creating codification node').start();

    const codificationQuery = 'MERGE (n:Ganister { type: "codification", ganisterVersion: $version }) RETURN n';
    const params = { version: instanceVersion };
    await Database.runQuery(codificationQuery, params);

    spinner.succeed('Codification node created');

    spinner = ora('Creating PermissionSets').start();

    const promises = global.datamodel.nodetypeDefinitions
      .filter((nodetype) => nodetype.elementType === 'node')
      .map(async (nodetype) => {
        const { name } = nodetype;

        const permissionSetParams = {
          _type: 'PermissionSet',
          properties: {
            name,
            _createdOn: Date.now(),
          },
        };
        const permissionSet = await DataService.new(permissionSetParams);
        const { data } = await DataService.save(permissionSet);

        return data;
      });
    const permissionSets = await Promise.all(promises);

    spinner.succeed('Creating PermissionSets');


    spinner = ora('Creating admin Group').start();

    const groupParams = {
      _type: 'Group',
      properties: {
        name: 'Administrator',
        _createdBy: 'api',
        _createdByName: 'api',
      },
    };
    const group = await DataService.new(groupParams);
    await DataService.save(group);

    spinner.succeed('Creating admin Group');


    spinner = ora('Creating admin user').start();

    const userParams = {
      _type: 'user',
      properties: {
        firstName: 'FirstName',
        lastName: 'LastName',
        email: 'test@ganister.eu',
        password: '3dc3f2949d90fbb803a99177a338b53f', // 'ganister'
        _isAdmin: true,
        active: true,
        language: 'en',
        pict: 'images/userLogo.png',
      },
    };
    const user = await DataService.new(userParams);
    await DataService.save(user);

    const isMemberOfParams = {
      _type: 'groupMember',
      source: user,
      target: group,
      user,
    };
    const isMemberOf = await DataService.new(isMemberOfParams);
    await DataService.save(isMemberOf);

    spinner.succeed('Creating admin user');


    spinner = ora('Creating default accesses Relationships').start();

    const accessesPromises = permissionSets.map(async (permissionSet) => {
      const accessRoleParams = {
        _type: 'accessRole',
        properties: {
          role: 'manager',
          canCreate: true,
        },
        source: group,
        target: permissionSet,
        user,
      };
      const accessRole = await DataService.new(accessRoleParams);
      await DataService.save(accessRole);

      return accessRole;
    });
    await Promise.all(accessesPromises);

    spinner.succeed('Creating default accesses Relationships');

    globalSpinner.succeed('Database initialized');
  } catch (error) {
    spinner.fail(error.message);
  }
  process.exit();
}


const runScripts = async () => {
  if (process.env.NODE_ENV === 'test') {
    await reset();
  }
  await initScript();
}

runScripts();

