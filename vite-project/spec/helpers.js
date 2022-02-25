const fs = require('fs');
const faker = require('faker');

module.exports = {
  readDatamodel: () => {
    const data = fs.readFileSync('./build/datamodel.json', 'utf-8');
    const datamodel = JSON.parse(data);

    return datamodel;
  },

  getFakeValue: (valueType) => {
    let fakerValue;

    switch (valueType) {
      case 'date':
      case 'dateTime':
      case 'integer':
      case 'double':
        fakerValue = faker.datatype.number();
        break;
      case 'boolean':
      case '2-states Boolean':
      case '3-states Boolean':
        fakerValue = faker.datatype.boolean();
        break;
      case 'json':
        fakerValue = faker.datatype.json();
        break;
      case 'multiselect':
      case 'tags':
        fakerValue = faker.datatype.array();
        break;
      case 'node':
        fakerValue = faker.datatype.json();
        fakerValue = JSON.parse(fakerValue);
        break;
      case 'email':
        fakerValue = faker.internet.email();
        break;
      default:
        fakerValue = faker.datatype.string();
        break;
    }

    return fakerValue;
  },

  mockNodetype: (nodetypeName) => {
    const datamodel = module.exports.readDatamodel();
    const nodetypeDM = datamodel.nodetypeDefinitions.find((n) => n.name === nodetypeName);

    const schemasFiles = fs.readdirSync('./api/models/schemas');
    const schemaFile = schemasFiles.find((file) => file === `${nodetypeName}.json`);
    const schemaData = fs.readFileSync(`./api/models/schemas/${schemaFile}`);
    const schema = JSON.parse(schemaData);
    const { properties: propertiesSchemas } = schema.properties.properties;

    const response = {
      _type: nodetypeName,
      properties: {},
    };

    nodetypeDM.properties
      .filter((property) => property.mandatory && !property.generated)
      .forEach((property) => {
        const { name, type } = property;
        const propertySchema = propertiesSchemas[name];

        const defaultValue = propertySchema.default || propertySchema.enum?.[0];
        const fakeValue = module.exports.getFakeValue(type);

        response.properties[name] = defaultValue || fakeValue;
      });

    return response;
  },
};
