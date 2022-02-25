const fs = require('fs');

const { ganisterError } = require('../../utils/errors');

const { isError } = require('../../helpers/errorsHelpers');

const { requireMethods, getCustomMethods } = require('./utilities');

const datamodelPath = './build/datamodel.json';
const customMethodsPath = './build/customMethods.js';
const clientMethodsPath = './client/app/services/app.clientMethodsService.js';

const CustomMethods = {
  generate: () => {
    try {
      const datamodelContent = fs.readFileSync(datamodelPath, 'utf8');
      const datamodel = JSON.parse(datamodelContent);

      //  Add Server Methods
      let customMethodsFileContent = datamodel.methods
        .filter((m) => m.serverOrClient === 'server')
        .map((method) => {
          return `exports.${method.name} = async (data, trigger, params, PLM, DataService) => {\n${method.code}\n};`;
        })
        .join('\n\n');

      customMethodsFileContent = `const { ganisterError } = require('../api/utils/errors');\n\n${customMethodsFileContent}`;

      //  Initialize Client Methods Service File Content (client methods)
      let clientMethodsFileContent = `angular.module("app.ganister.clientMethodsService", [])
      .service("clientMethodsService", function ($http, Notification, nodesModel) {`;

      //  Add Client Methods
      datamodel.methods
        .filter((m) => m.serverOrClient === 'client')
        .forEach((method) => {
          clientMethodsFileContent += `\n\nthis.${method.name} = async ($scope, $rootScope, data = {}) => {\n${method.code}\n};`;
        });
      clientMethodsFileContent += '\n\n});';

      fs.writeFileSync(customMethodsPath, customMethodsFileContent, 'utf-8');
      fs.writeFileSync(clientMethodsPath, clientMethodsFileContent, 'utf-8');
      return true;
    } catch (error) {
      error.error = true; // for debug, will be removed later
      throw error;
    }
  },

  /**
   * Run custom methods for the given trigger
   * @param {object{}} context - Context holding data and errors from custom methods executions
   * @param {object{}} context.data - 'Node' or 'Relationship' instance
   * @param {array} context.errors - Array to hold errors returned from custom methods executions
   * @param {string} trigger - trigger or actionID
   * @param {class} DataService - injection of DataService Class
   * @returns {object} - Returns context with data value after custom methods executions
   */
  run: async (context, trigger, DataService) => {
    if (!context.errors) context.errors = [];

    const { data } = context;

    const empty = Array.isArray(data) && !data.length;
    if (!data || empty) return;

    const methods = getCustomMethods(data, trigger);
    if (!methods.length) return;

    const {
      customMethods,
      businessMethods,
      exposedMethods,
    } = requireMethods();
    const PLM = exposedMethods(DataService);

    /* eslint-disable */
    for (const method of methods) {
      const { name, params = {} } = method;

      const customMethod = customMethods[name] || businessMethods[name];
      if (!customMethod) throw ganisterError(`Method '${name}' not found.`);

      const result = await customMethod(data, trigger, params, PLM, DataService);
      if (isError(result)) {
        const errorProperties = Object.getOwnPropertyNames(result);
        const JSONError = JSON.stringify(result, errorProperties);
        context.errors.push(JSON.parse(JSONError));
      }
    }
    /* eslint-enable */

    return context;
  },
};

module.exports = CustomMethods;
