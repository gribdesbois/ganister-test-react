/*
██████╗ ███████╗ ██████╗ ██╗   ██╗██╗██████╗ ███████╗███████╗
██╔══██╗██╔════╝██╔═══██╗██║   ██║██║██╔══██╗██╔════╝██╔════╝
██████╔╝█████╗  ██║   ██║██║   ██║██║██████╔╝█████╗  ███████╗
██╔══██╗██╔══╝  ██║▄▄ ██║██║   ██║██║██╔══██╗██╔══╝  ╚════██║
██║  ██║███████╗╚██████╔╝╚██████╔╝██║██║  ██║███████╗███████║
╚═╝  ╚═╝╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝
*/
require('dotenv').config();

//  Licence
require('./config/licence');
const express = require('express');
const compression = require('compression');
const logger = require('morgan');
const _ = require('lodash');
const path = require('path');
const Ajv = require('ajv').default;
const socketIO = require('socket.io');
const fs = require('fs');
const helmet = require('helmet');
const passport = require('passport');
const { I18n } = require('i18n')
const app = express();
const swaggerUi = require('swagger-ui-express');

const driver = require('./config/config').db;
const instanceVersion = require('./package.json').version;

//  Routes
const userRoutes = require('./api/routes/users');
const plmRoutes = require('./api/routes/plm');
const nodesRoutes = require('./api/routes/nodes');
const relationshipsRoutes = require('./api/routes/relationships');
const nodetypeRoutes = require('./api/routes/nodetypes');
const translationRoutes = require('./api/routes/translations');
const uploadRoutes = require('./api/routes/uploads');
const healthRoutes = require('./api/routes/health');
const configRoutes = require('./api/routes/config');
const logRoutes = require('./api/routes/log');
const filesRoutes = require('./api/routes/files');
const authRoutes = require('./api/routes/auth');
const deprecatedRoutes = require('./api/routes/deprecated');
//  External APIs Routes
const githubRoutes = require('./api/routes/external-apis/github');
const gitlabRoutes = require('./api/routes/external-apis/gitlab');
const element14Routes = require('./api/routes/external-apis/element14');
const ihsRoutes = require('./api/routes/external-apis/ihs');
const z2DataRoutes = require('./api/routes/external-apis/z2Data');

const { logAndRespond } = require('./api/helpers/controllerHelpers');

const config = require('./config/config'); // we load the db location from the JSON files
//  Global email Transporter to send emails anywhere
global.ganisterMail = require('./api/utils/email');

// Import schema
const jsonSchema = require('./api/models/datamodelSchema.json');
global.datamodel = require('./build/datamodel.json');


const cronjobs = require('./cronjobs');


const swaggerDocument = require('./help/swagger/document.json');
const ipfilter = require('express-ipfilter').IpFilter;


// Allow the following IPs
console.log('config.ipRestrictions', config.ipRestrictions);
if (config.ipRestrictions && config.ipRestrictions.activated) {
  const ips = config.ipRestrictions.allowedIps;

  // Create the server
  app.use(ipfilter(ips, {
    mode: 'allow',
    log: true,
    logLevel: 'deny',
  }));
}


/*
███╗   ███╗██╗██████╗ ██████╗ ██╗     ███████╗██╗    ██╗ █████╗ ██████╗ ███████╗
████╗ ████║██║██╔══██╗██╔══██╗██║     ██╔════╝██║    ██║██╔══██╗██╔══██╗██╔════╝
██╔████╔██║██║██║  ██║██║  ██║██║     █████╗  ██║ █╗ ██║███████║██████╔╝█████╗
██║╚██╔╝██║██║██║  ██║██║  ██║██║     ██╔══╝  ██║███╗██║██╔══██║██╔══██╗██╔══╝
██║ ╚═╝ ██║██║██████╔╝██████╔╝███████╗███████╗╚███╔███╔╝██║  ██║██║  ██║███████╗
╚═╝     ╚═╝╚═╝╚═════╝ ╚═════╝ ╚══════╝╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
*/


// setup static folders
app.use(express.static('assets'));
app.use(express.static('build'));
app.use(express.static('client'));
app.use(express.static('node_modules'));
app.use(express.static('apps'));

app.use('/help/documentation', express.static('help/_generalDoc'));
app.use('/help/tech', express.static('help/_techDoc'));
if (config.env === 'dev') {
  app.use('/help/internal', express.static('help/_internalDoc'));
}
app.use(compression());

const i18n = new I18n({
  header: 'ganister-language',
  locales: ['en', 'fr'],
  directory: path.join(__dirname, 'api/utils/locales'),
  register: global,
})
app.use(i18n.init);
app.use(helmet());
app.use(logger('dev'));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));


app.use(passport.initialize());

const options = {
  customCss: '.swagger-ui .topbar { display: none }',
  displayRequestDuration: true,
  filter: true,
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));


/*
██████╗  ██████╗ ██╗   ██╗████████╗███████╗███████╗
██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝██╔════╝
██████╔╝██║   ██║██║   ██║   ██║   █████╗  ███████╗
██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝  ╚════██║
██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗███████║
╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚══════╝
 */


app.use('/api/:version/users', userRoutes);
app.use('/api/:version/nodes', nodesRoutes, relationshipsRoutes);
app.use('/api/:version/nodetypes', nodetypeRoutes);
app.use('/api/:version/plm', plmRoutes);
app.use('/api/:version/translations', translationRoutes);
app.use('/api/:version/uploads', uploadRoutes);
app.use('/api/:version/healthReport', healthRoutes);
app.use('/api/:version/config', configRoutes);
app.use('/api/:version/log', logRoutes);
app.use('/api/:version/files', filesRoutes);
app.use('/api/:version/', deprecatedRoutes);
//  External APIs Routes
app.use('/api/:version/external-apis/github', githubRoutes);
app.use('/api/:version/external-apis/gitlab', gitlabRoutes);
app.use('/api/:version/external-apis/element14', element14Routes);
app.use('/api/:version/external-apis/ihs', ihsRoutes);
app.use('/api/:version/external-apis/z2Data', z2DataRoutes);
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views', __dirname);

if (config.activeGoogleLogin) {
  app.use('/auth', authRoutes);
}

/*
██╗   ██╗██╗███████╗██╗    ██╗███████╗
██║   ██║██║██╔════╝██║    ██║██╔════╝
██║   ██║██║█████╗  ██║ █╗ ██║███████╗
╚██╗ ██╔╝██║██╔══╝  ██║███╗██║╚════██║
 ╚████╔╝ ██║███████╗╚███╔███╔╝███████║
  ╚═══╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚══════╝
*/

// G-CONFIG
app.get('/g-config', (req, res) => {
  res.sendFile('./main.html', { root: path.join(__dirname, './apps/config') });
});


// OSS builder
let packages;
fs.readFile('package.json', (err, data) => {
  if (err) throw err;
  packages = JSON.parse(data).dependencies;
});


app.get('/credits/oss', (req, res) => {
  res.render('./views/credits/oss', { packages });
});


// Main CLIENT
app.get('/', (req, res) => {
  res.sendFile('./main.html', { root: path.join(__dirname, './client') });
});

// error Handler

// eslint-disable-next-line
app.use((err, req, res, next) => {
  const { name, title, statusCode = 500 } = err;

  if (statusCode === 404 && name !== 'Ganister Error') {
    return next();
  }

  return logAndRespond(res, err, title);
});

// -------------------------------------- 404 handler ---------------------------------------//
// catch 404
app.use((req, res) => {
  res.status(404).sendFile('./404.html', { root: path.join(__dirname, './views/404/') });
});

/*
██████╗ ███╗   ███╗    ██╗   ██╗ █████╗ ██╗     ██╗██████╗  █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
██╔══██╗████╗ ████║    ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
██║  ██║██╔████╔██║    ██║   ██║███████║██║     ██║██║  ██║███████║   ██║   ██║██║   ██║██╔██╗ ██║
██║  ██║██║╚██╔╝██║    ╚██╗ ██╔╝██╔══██║██║     ██║██║  ██║██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
██████╔╝██║ ╚═╝ ██║     ╚████╔╝ ██║  ██║███████╗██║██████╔╝██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
╚═════╝ ╚═╝     ╚═╝      ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
*/

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, verbose: true }); // options can be passed, e.g. {allErrors: true}
const validate = ajv.compile(jsonSchema);

const valid = validate(global.datamodel);


const versionSession = driver.session();
const query = 'MATCH (g:Ganister) RETURN g.ganisterVersion as version';

versionSession.run(query)
  .then((result) => {
    versionSession.close();
    if (result.records.length > 0) {
      // compare database version and instance version
      const dbVersion = result.records[0].get('version');
      console.log(`
      - Instance Version : ${instanceVersion}
      - DB Version : ${dbVersion}
      `);
      if (instanceVersion !== dbVersion) {
        console.log('   WARNING: DB and Server version are different');
      } else {
        console.log('   SUCCESS: DB and Server version are aligned');
      }
    } else {
      console.error('could not read db version');
    }
  })
  .catch(async (error) => {
    console.error(error);
    await versionSession.close();
  });



const session = driver.session();
const IndexesQuery = `CALL db.indexes()`;
let nodetypeIndexesQueries = [];
try {
  console.time('   Read indexes');
  session.run(IndexesQuery)
    .then((res) => {
      console.timeEnd('   Read indexes');
      let missingIndexes = global.datamodel.nodetypeDefinitions.filter((nt) => nt.elementType === 'node').map(nt => nt.name);
      res.records.forEach((ind) => {
        const indexName = ind.get('labelsOrTypes')[0];
        missingIndexes = missingIndexes.filter(nt => nt != indexName);
      });
      console.time('   Check missing Nodetypes Indexes in DB');
      const txcNtIndexes = session.beginTransaction();
      nodetypeIndexesQueries = missingIndexes.map((nodetype) => {
        const nodetypeQuery = `
        CREATE INDEX ${nodetype}Id IF NOT EXISTS
        FOR (n:${nodetype})
        ON (n._id)
      `;
        try {
          console.log(nodetypeQuery)
          return (txcNtIndexes.run(nodetypeQuery));
        } catch (error) {
          console.error(error);
        }
      });
      Promise.all(nodetypeIndexesQueries)
        .then(async () => {
          await txcNtIndexes.commit();
          session.close();
          console.timeEnd('   Check missing Nodetypes Indexes in DB');

          const permissionSetSession = driver.session();
          const permissionSetQuery = `
          CREATE INDEX PermissionSetName IF NOT EXISTS
          FOR (n:PermissionSet)
          ON (n.name)
        `;
          console.time('   Check missing PermissionSet Indexes in DB');
          try {
            await permissionSetSession.run(permissionSetQuery)
          } catch (error) {
            console.error(error);
          } finally {
            await permissionSetSession.close();
            console.timeEnd('   Check missing PermissionSet Indexes in DB')
          }
        });
    })
    .catch((error) => {
      console.error(error);
    });
} catch (error) {
  console.error(error);
}



if (!valid) {
  console.log('\x1b[31m', '   ERROR: Datamodel is not Valid ');
  console.log(validate.errors);
} else {
  /*
  ███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗     ██╗      █████╗ ██╗   ██╗███╗   ██╗ ██████╗██╗  ██╗
  ██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗    ██║     ██╔══██╗██║   ██║████╗  ██║██╔════╝██║  ██║
  ███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝    ██║     ███████║██║   ██║██╔██╗ ██║██║     ███████║
  ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗    ██║     ██╔══██║██║   ██║██║╚██╗██║██║     ██╔══██║
  ███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║    ███████╗██║  ██║╚██████╔╝██║ ╚████║╚██████╗██║  ██║
  ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝
  */


  console.log('\x1b[32m', '\n\n\n   SUCCESS : Your datamodel is Valid     \x1b[0m    ');
  const server = app.listen(config.port, () => {
    console.log('\x1b[32m', '  SUCCESS : Ganister Server is started     \x1b[0m    ');


    console.log(`  \x1b[0m
  ----------------------------------------------------------------------------
  |                                                                          |
  |      ██████╗  █████╗ ███╗   ██╗██╗███████╗████████╗███████╗██████╗       |
  |     ██╔════╝ ██╔══██╗████╗  ██║██║██╔════╝╚══██╔══╝██╔════╝██╔══██╗      |
  |     ██║  ███╗███████║██╔██╗ ██║██║███████╗   ██║   █████╗  ██████╔╝      |
  |     ██║   ██║██╔══██║██║╚██╗██║██║╚════██║   ██║   ██╔══╝  ██╔══██╗      |
  |     ╚██████╔╝██║  ██║██║ ╚████║██║███████║   ██║   ███████╗██║  ██║      |
  |      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝      |
  |                                                                          |
  ----------------------------------------------------------------------------
    PLM is a graph !
  ----------------------------------------------------------------------------
  \x1b[32m  Ganister Server is running at ${config.url}:${config.port} \x1b[0m 
  ----------------------------------------------------------------------------
    Powered by NodeJs/Express/Neo4j
  ----------------------------------------------------------------------------
  \x1b[33m  General Documentation is available here:
  \x1b[32m  ${config.url}:${config.port}/help/documentation \x1b[0m \n
  \x1b[33m  Technical Documentation is available here:
  \x1b[32m  ${config.url}:${config.port}/help/tech \x1b[0m \n
  \x1b[33m  API Documentation is available here:
  \x1b[32m  ${config.url}:${config.port}/api-docs/ \x1b[0m \n
  \x1b[33m  Licence Key: ${global.ganister.validLicence ? 'Valid' : 'Trial'} ${global.ganister.expiredLicence ? ' (Licence Key Expired)' : ''}
  \x1b[32m  Nodes: ${global.ganister.nodes} | Expiration Date: ${global.ganister.expirationDate ? global.ganister.expirationDate : 'No expiration date'} \x1b[0m \n
  ----------------------------------------------------------------------------
  `);
  });

  server.keepAliveTimeout = 240 * 1000;
  server.headersTimeout = 250 * 1000;
  /*

   █████╗ ███╗   ██╗ █████╗ ██╗  ██╗   ██╗████████╗██╗ ██████╗███████╗
  ██╔══██╗████╗  ██║██╔══██╗██║  ╚██╗ ██╔╝╚══██╔══╝██║██╔════╝██╔════╝
  ███████║██╔██╗ ██║███████║██║   ╚████╔╝    ██║   ██║██║     ███████╗
  ██╔══██║██║╚██╗██║██╔══██║██║    ╚██╔╝     ██║   ██║██║     ╚════██║
  ██║  ██║██║ ╚████║██║  ██║███████╗██║      ██║   ██║╚██████╗███████║
  ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚═╝      ╚═╝   ╚═╝ ╚═════╝╚══════╝
  */
  const analyticsFreq = 30000;
  let prevCPUusage = process.cpuUsage();
  let cpuUsages = [];
  const metrics = setInterval(() => {
    cpuUsages = [process.cpuUsage(), prevCPUusage];
    prevCPUusage = process.cpuUsage();
    const result = {
      archi: process.arch,
      cpuUsage: {
        user: Math.round((100 * ((cpuUsages[0].user - cpuUsages[1].user) / 1000)) / analyticsFreq),
        system: Math.round((100 * ((cpuUsages[0].system - cpuUsages[1].system) / 1000)) / analyticsFreq),
      },
      memoryUsage: process.memoryUsage(),
      platform: process.platform,
      upTime: process.uptime(),
      time: Date.now(),
    };
    fs.appendFile(`${__dirname}/log/ressourcesAnalytics.log`, `\n  ${JSON.stringify(result)}`, (err) => {
      if (err) throw err;
    });
  }, analyticsFreq);


  /*
  ███████╗ ██████╗  ██████╗██╗  ██╗███████╗████████╗██╗ ██████╗
  ██╔════╝██╔═══██╗██╔════╝██║ ██╔╝██╔════╝╚══██╔══╝██║██╔═══██╗
  ███████╗██║   ██║██║     █████╔╝ █████╗     ██║   ██║██║   ██║
  ╚════██║██║   ██║██║     ██╔═██╗ ██╔══╝     ██║   ██║██║   ██║
  ███████║╚██████╔╝╚██████╗██║  ██╗███████╗   ██║██╗██║╚██████╔╝
  ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝╚═╝╚═╝ ╚═════╝
  */

  global.io = socketIO(server);
  /* global io */
  io.on('connection', (sck) => {
    const socket = sck;

    //  Get connectedUsers
    function getConnectedUsers() {
      let connectedUsers = [];
      Object.keys(io.sockets.sockets).forEach((id) => {
        if (io.sockets.sockets[id].user) {
          connectedUsers.push(io.sockets.sockets[id].user);
        }
      });
      connectedUsers = _.uniqBy(connectedUsers, '_id');
      return connectedUsers;
    }

    //  When User Logged In, store user object in Socket and return connected Users to clients
    socket.on('loggedIn', (user) => {
      socket.broadcast.emit('userLoggedIn', user);
      socket.user = user;
      io.emit('connectedUsers', getConnectedUsers());
    });

    //  Check if current Socket User is still connected in a different socket
    function userFoundInSockets(userId) {
      const connectedUsers = getConnectedUsers();
      const userFound = connectedUsers.find(item => item._id === userId);
      return userFound !== undefined;
    }

    //  Check if socket disconnected
    socket.on('disconnect', () => {
      //  If a user is disconnected from all sockets, emit actions to clients
      if (socket.user) {
        if (!userFoundInSockets(socket.user._id)) {
          socket.broadcast.emit('disconnectedUser', socket.user);
          socket.broadcast.emit('connectedUsers', getConnectedUsers());
        }
      }
    });
    socket.on('message', (from, msg, to, time) => {
      console.log(`${msg} at ${time}`);
      io.emit('chat message', {
        from, msg, to, time,
      });
    });
  });
}
cronjobs.counter();

module.exports = app; // for testing
