/*
██████╗ ███████╗ ██████╗ ██╗   ██╗██╗██████╗ ███████╗███████╗
██╔══██╗██╔════╝██╔═══██╗██║   ██║██║██╔══██╗██╔════╝██╔════╝
██████╔╝█████╗  ██║   ██║██║   ██║██║██████╔╝█████╗  ███████╗
██╔══██╗██╔══╝  ██║▄▄ ██║██║   ██║██║██╔══██╗██╔══╝  ╚════██║
██║  ██║███████╗╚██████╔╝╚██████╔╝██║██║  ██║███████╗███████║
╚═╝  ╚═╝╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝
*/

const superagent = require('superagent');
const prefix = require('superagent-prefix');
const AWS = require('aws-sdk');
const _ = require('lodash');

const config = require('../../../config/config');

const { customError } = require('../../helpers/errorsHelpers');

const driver = config.db;

/*
 ██████╗ ██████╗ ███╗   ██╗███████╗████████╗    ██╗███╗   ██╗██╗████████╗
██╔════╝██╔═══██╗████╗  ██║██╔════╝╚══██╔══╝    ██║████╗  ██║██║╚══██╔══╝
██║     ██║   ██║██╔██╗ ██║███████╗   ██║       ██║██╔██╗ ██║██║   ██║
██║     ██║   ██║██║╚██╗██║╚════██║   ██║       ██║██║╚██╗██║██║   ██║
╚██████╗╚██████╔╝██║ ╚████║███████║   ██║       ██║██║ ╚████║██║   ██║
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝       ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝
*/

const { S3Vault } = config;
const { baseURL, clientId, clientSecret } = config.cadConversion.cadExchanger;
let extensions = {};
let me;
let request;
let token;
let tokenTime;

const excludeConversionFormats = ['pdf'];

/*
██╗   ██╗████████╗██╗██╗     ██╗████████╗██╗   ██╗    ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
██║   ██║╚══██╔══╝██║██║     ██║╚══██╔══╝╚██╗ ██╔╝    ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
██║   ██║   ██║   ██║██║     ██║   ██║    ╚████╔╝     █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗
██║   ██║   ██║   ██║██║     ██║   ██║     ╚██╔╝      ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║
╚██████╔╝   ██║   ██║███████╗██║   ██║      ██║       ██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║
 ╚═════╝    ╚═╝   ╚═╝╚══════╝╚═╝   ╚═╝      ╚═╝       ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
*/

const customSuccess = (data) => {
  return { data, code: 200, error: false };
};

const getAgent = async () => {
  const agent = superagent.agent();
  agent.use(prefix(baseURL));
  agent.accept('application/json');
  let aRes;
  try {
    aRes = await agent
      .post('/oauth2/token')
      .auth(clientId, clientSecret, { type: 'basic' })
      .send({
        grant_type: 'client_credentials',
        scope: 'user:read data:write data:convert data:share',
      });
  } catch (errorObj) {
    if (!(errorObj.response)) {
      console.error('Error: Cannot connect to cadExchanger');
      return false;
    }
    const error = JSON.parse(errorObj.response.error.text);
    console.error(`Error: Cannot connect to cadExchanger! Reason: ${error.error_description}`);
    return false;
  }
  agent.set('Authorization', `${aRes.body.token_type} ${aRes.body.access_token}`);
  token = aRes.body.access_token;
  tokenTime = Date.now();
  me = (await agent.get('/users/me')).body.user;
  extensions = (await agent.get('/files/extensions')).body;
  return agent;
};

if (clientId && clientSecret) {
  getAgent().then((agent) => {
    request = agent;
  });
}

const checkToken = async () => {
  if (token && tokenTime) {
    const timeDiff = Date.now() - tokenTime;
    if (timeDiff > 3500000) {
      request = await getAgent();
      return;
    }
  }
  request = await getAgent();
};

const generateAmazonS3PublicURL = (Key) => {
  const s3bucket = new AWS.S3({
    region: S3Vault.config.region,
    signatureVersion: S3Vault.config.signatureVersion,
    accessKeyId: S3Vault.config.accessKeyId,
    secretAccessKey: S3Vault.config.secretAccessKey,
    Bucket: S3Vault.config.bucket,
  });
  const params = { Bucket: S3Vault.config.bucket, Key, Expires: 60 };
  const url = s3bucket.getSignedUrl('getObject', params);
  return url;
};

const updateFile = async (id, property, data) => {
  const session = driver.session();
  const query = `MATCH (n:file {_id: $id}) SET n.${property} = '${JSON.stringify(data)}'`;
  const result = await session.run(query, { id });
  session.close();
  if (result.records.length) {
    return true;
  }
  return false;
};

exports.getAuthToken = async () => {
  await checkToken();
  return customSuccess({ token });
};

exports.uploadFile = async (data) => {
  const { filename } = data;
  //  Check if file extension is supported
  const fileExt = filename.split('.').pop().toLowerCase();
  const validFormat = Object.keys(extensions.import).find((formatName) => {
    const sourceFormat = extensions.import[formatName].findIndex((ext) => fileExt === ext) !== -1;
    return sourceFormat;
  });
  if (!validFormat) {
    return customError({ message: 'File format is not supported from CAD Exchanger' });
  }
  try {
    let result;
    if (data.source === 'amazonS3') {
      const publicURL = generateAmazonS3PublicURL(data.sourceKey);
      const agent = superagent.agent();
      const amazonFileResult = await agent.get(publicURL).buffer(true).parse(superagent.parse['octet-stream']);
      const buffer = amazonFileResult.body;
      try {
        result = await request
          .set('Authorization', `Bearer ${token}`)
          .post('/files')
          .type('form')
          .field('parentFolder', me.rootFolder)
          .attach('data', buffer, { filename });
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        result = await request
          .set('Authorization', `Bearer ${token}`)
          .post('/files')
          .type('form')
          .field('parentFolder', me.rootFolder)
          .attach('data', `./assets/${data.sourceKey}`, { filename });
      } catch (err) {
        console.error(err);
      }
    }
    if (result.ok) {
      const { file } = result.body;
      const generatedData = {
        source: 'cadExchanger',
        data: file,
      };
      await updateFile(data._id, 'generated', generatedData);
      return customSuccess(generatedData);
    }
    return customError({ error: false });
  } catch (error) {
    console.error(error);
    if (error.response && error.response.body && error.response.body.errors) {
      const message = error.response.body.errors.map((e) => e.message).join(', ');
      return customError({ message });
    }
    return customError({ message: error.message });
  }
};

exports.publicFile = async (nodeId) => {
  const query = 'MATCH (n:file{_id:$nodeId}) RETURN n';
  const session = driver.session();
  const nodeResult = await session.run(query, { nodeId });
  session.close();
  const nodeRecord = nodeResult.records[0].get('n');
  //  If node not found, return error
  if (!nodeRecord) {
    return customError({ message: 'Node not found' });
  }
  const node = { ...nodeRecord.properties, _type: nodeRecord.labels[0] };
  //  If node don't have the generated property, return error
  if (!node.generated) {
    return customError({ message: 'Node has no cadExchanger info' });
  }
  try {
    node.generated = JSON.parse(node.generated);
  } catch (error) {
    return customError(error);
  }
  //  If node is already public, return success
  if (node.generated.data.public) {
    return customSuccess(true);
  }
  //  Make cadExchanger file public
  try {
    await request
      .set('Authorization', `Bearer ${token}`)
      .put(`/files/${node.generated.data.id}/sharing`)
      .send({ public: true });
  } catch (error) {
    return customError(error);
  }
  node.generated.data.public = true;
  const updateQuery = `MATCH (n:file{_id:$nodeId}) SET n.generated = '${JSON.stringify(node.generated)}' RETURN n`;
  const updateSession = driver.session();
  await updateSession.run(updateQuery, { nodeId });
  session.close();
  return customSuccess(true);
};

exports.getRevision = async (id) => {
  const result = await request
    .set('Authorization', `Bearer ${token}`)
    .get(`/filerevisions/${id}`)
    .send({ public: true });
  if (result.ok) {
    const revision = result.body['file-revision'];
    return customSuccess(revision);
  }
  return customError(result.body);
};

exports.checkCADFileExt = (fileExt) => {
  let isValid = false;
  if (_.isEmpty(extensions.import)) {
    return isValid;
  }
  Object.keys(extensions.import).find((formatName) => {
    const sourceFormat = extensions.import[formatName].find((ext) => fileExt === ext);
    if (sourceFormat && excludeConversionFormats.indexOf(sourceFormat) < 0) {
      isValid = true;
    }
  });
  return isValid;
};
