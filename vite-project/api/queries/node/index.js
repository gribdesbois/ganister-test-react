const CRUDQueries = require('./crud');
const propertiesQueries = require('./properties');

module.exports = {
  ...CRUDQueries,
  ...propertiesQueries,
};