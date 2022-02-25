const objectsHelpers = require('./object');
const arraysHelpers = require('./array');
const stringsHelpers = require('./string');

module.exports = {
  ...objectsHelpers,
  ...arraysHelpers,
  ...stringsHelpers,
};
