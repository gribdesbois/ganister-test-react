module.exports = (grunt) => {
  grunt.loadNpmTasks('grunt-javascript-obfuscator');

  grunt.initConfig({
    javascript_obfuscator: {
      options: {
        // Task-specific options go here.
        debugProtection: false,
        debugProtectionInterval: false,
      },
      main: {
        src: [
          //  Controllers
          'delivery/api/controllers/configController.js',
          'delivery/api/controllers/datamodelController.js',
          'delivery/api/controllers/filesController.js',
          'delivery/api/controllers/healthReportController.js',
          'delivery/api/controllers/logController.js',
          'delivery/api/controllers/nodesController.js',
          'delivery/api/controllers/relationshipsController.js',
          'delivery/api/controllers/plmController.js',
          'delivery/api/controllers/translationController.js',
          'delivery/api/controllers/uploadController.js',
          'delivery/api/controllers/usersController.js',
          //  Middlewares
          'delivery/api/middlewares/accesses.js',
          'delivery/api/middlewares/basics.js',
          'delivery/api/middlewares/businessMethods.js',
          // 'delivery/api/middlewares/datamodelMethods.js',
          'delivery/api/middlewares/deprecated.js',
          'delivery/api/middlewares/formatData.js',
          'delivery/api/middlewares/licence.js',
          'delivery/api/middlewares/nodes.js',
          'delivery/api/middlewares/params.js',
          'delivery/api/middlewares/plm.js',
          'delivery/api/middlewares/passport.js',
          'delivery/api/middlewares/relationships.js',
          'delivery/api/middlewares/plmStandardsCypher.js',
          //  Routes
          'delivery/api/routes/auth.js',
          'delivery/api/routes/config.js',
          'delivery/api/routes/files.js',
          'delivery/api/routes/health.js',
          'delivery/api/routes/log.js',
          'delivery/api/routes/nodes.js',
          'delivery/api/routes/nodetypes.js',
          'delivery/api/routes/plm.js',
          'delivery/api/routes/relationships.js',
          'delivery/api/routes/translations.js',
          'delivery/api/routes/uploads.js',
          'delivery/api/routes/users.js',
          // Modules
          'delivery/api/modules/database.js',
          'delivery/api/modules/dataService/index.js',
          'delivery/api/modules/dataService/utilities.js',
          'delivery/api/modules/exposedMethods.js',
          // Queries
          'delivery/api/queries/node/crud.js',
          'delivery/api/queries/node/properties.js',
          'delivery/api/queries/relationship/crud.js',
          'delivery/api/queries/relationship/properties.js',
          'delivery/api/queries/global.js',

          //  Utils
          'delivery/api/utils/accesses.js',
          'delivery/api/utils/datamodelUtil.js',
          'delivery/api/utils/email.js',
          'delivery/api/utils/node.js',
          'delivery/api/utils/nodetype.js',
          'delivery/api/utils/relationship.js',
          'delivery/api/utils/schemaUtil.js',
          // 'delivery/api/utils/generateForm.js',
          //  Emails
          'delivery/api/emails/invitationEmail.js',
          //  Helpers
          'delivery/api/helpers/cleanup.js',
          'delivery/api/helpers/controllerHelpers.js',
          'delivery/api/helpers/routeHelpers.js',
          'delivery/api/helpers/node.js',
          'delivery/api/helpers/errorsHelpers.js',
          'delivery/api/helpers/formatDataHelpers.js',
          'delivery/api/helpers/relationship.js',
          'delivery/api/helpers/database/queries.js',
          'delivery/api/helpers/database/records.js',
          'delivery/api/helpers/primitives/queries.js',
          'delivery/api/helpers/primitives/queries.js',
          'delivery/api/helpers/primitives/queries.js',
          'delivery/api/helpers/primitives/queries.js',
          'delivery/api/helpers/primitives/records.js',
          //  Config
          'delivery/config/licence.js',
        ],
      },
    },
  });
};
