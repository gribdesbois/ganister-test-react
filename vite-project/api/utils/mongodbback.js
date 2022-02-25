const fs = require('fs');
const mongoose = require('mongoose');
const Ajv = require('ajv');
const jsonSchema = require('../models/datamodelSchema.json');

const localesPath = './assets/locales/';
const { MLAB_URL = 'https://', CLOUD_STORED_DATAMODEL = 'false', INSTANCE_NAME = 'default' } = process.env;

if (CLOUD_STORED_DATAMODEL === 'true') {
  mongoose.connect(MLAB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });
}

exports.mongoose = mongoose;
const dmModel = mongoose.model('datamodel', { name: String, content: Object });

const closeMongoDbConnection = async () => {
  await mongoose.disconnect();
  return true;
};

const checkDatamodelCloudBackup = async (datamodel) => {
  if (CLOUD_STORED_DATAMODEL === 'true') {
    const query = { name: INSTANCE_NAME };
    const dmData = await dmModel.findOne(query);
    if (dmData && dmData.content) {
      datamodel = dmData.content.datamodel || datamodel;
      const { locales } = dmData.content;
      if (locales) {
        locales.forEach((loc) => {
          fs.writeFileSync(`${localesPath}locale-${loc.key}.json`, JSON.stringify(loc.content), { encoding: 'utf8' });
        });
      }
    }
  }
  return datamodel;
};


const mongoBackup = async (datamodelContent) => {
  try {
    const data = {
      datamodel: datamodelContent,
      locales: [],
    };
    fs.readdirSync(localesPath).forEach((localeFile) => {
      // eslint-disable-next-line
      const localeFileContent = JSON.parse(fs.readFileSync(localesPath + localeFile, 'utf8'));
      const regex1 = /-(.*)\./;
      const key = regex1.exec(localeFile);
      data.locales.push({
        key: key[1],
        content: localeFileContent,
      });
    });
    const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, verbose: true }); // op
    const validate = ajv.compile(jsonSchema);
    const valid = validate(data.datamodel);
    if (!valid) {
      console.error(validate.errors);
      return false;
    }
    const query = { name: INSTANCE_NAME };
    const options = { upsert: true };
    // save data to mongodb
    try {
      console.log('💾 MONGO BACKED UP');
      return await dmModel
        .findOneAndUpdate(query, { name: INSTANCE_NAME, content: data }, options)
        .exec();
    } catch (errorMongo) {
      return { errorMongo };
    }
  } catch (e) {
    console.error('(b) cannot write: ', e.message);
    return false;
  }
};

module.exports = { closeMongoDbConnection, mongoBackup, checkDatamodelCloudBackup };
