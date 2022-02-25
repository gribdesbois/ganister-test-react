const fs = require('fs');

const languages = require('../../config/languages.json');
const mongoDbUtil = require('../utils/mongodbback');
const schemaUtil = require('../utils/schemaUtil');

const { INSTANCE_NAME, INSTANCE_TYPE, CLOUD_STORED_DATAMODEL } = process.env;

const datamodulesPath = './api/models/dm/';
const nodetypesPath = './api/models/dm/nodetypes/';
const methodsPath = './api/models/dm/methods/';
const reportsPath = './api/models/dm/reports/';
const leftPanelPath = './api/models/dm/leftPanelCategories.json';
const localesPath = './assets/locales/';
const assetsPath = './assets/';
const datamodelFile = './build/datamodel.json';


// #region UTILITY FUNCTIONS
const buildMissingFolders = () => {
  // Build potential missing folders
  if (!fs.existsSync(nodetypesPath)) {
    fs.mkdirSync(nodetypesPath, { recursive: true });
  }
  if (!fs.existsSync(methodsPath)) {
    fs.mkdirSync(methodsPath, { recursive: true });
  }
  if (!fs.existsSync(reportsPath)) {
    fs.mkdirSync(reportsPath, { recursive: true });
  }
  if (!fs.existsSync(localesPath)) {
    fs.mkdirSync(localesPath, { recursive: true });
  }
};

const buildLocalesFiles = () => {
  languages.forEach((language) => {
    const path = `${localesPath}locale-${language.key}.json`;
    if (!fs.existsSync(path)) fs.writeFileSync(path, '{}', 'utf-8');
  });
};

const moveNodetypeTranslationsToLocales = (nodetypeName, nodetypeDMKey, locales) => {
  if (Array.isArray(nodetypeDMKey)) {
    // nodetypeDMKey -> nodetype.properties || nodetype.tabs etc. etc.
    nodetypeDMKey.forEach((prop) => {
      if (prop.translations) {
        Object.keys(prop.translations).forEach((lang) => {
          if (prop.translations[lang]) {
            if (!locales[lang]) {
              locales[lang] = {};
            }
            if (!locales[lang].nodetype) {
              locales[lang].nodetype = {};
            }
            if (!locales[lang].nodetype[nodetypeName]) {
              locales[lang].nodetype[nodetypeName] = {};
            }
            locales[lang].nodetype[nodetypeName][prop.name] = prop.translations[lang];
          }
        });
        delete prop.translations;
      }
    });
  } else if (nodetypeDMKey && nodetypeDMKey.translations) {
    // nodetypeDMKey -> nodetype (to set nodetype name translations)
    Object.keys(nodetypeDMKey.translations).forEach((lang) => {
      if (nodetypeDMKey.translations[lang]) {
        if (!locales[lang]) {
          locales[lang] = {};
        }
        if (!locales[lang].default) {
          locales[lang].default = { nodetype: {} };
        }
        locales[lang].default.nodetype[nodetypeName] = nodetypeDMKey.translations[lang];
      }
    });
    delete nodetypeDMKey.translations;
  }
};

const addCoreTranslationsToLocales = (coreTranslations, locales, languageKey) => {
  Object.keys(coreTranslations).forEach((category) => {
    if (coreTranslations[category]) {
      Object.keys(coreTranslations[category]).forEach((key) => {
        if (coreTranslations[category][key]) {
          if (category === 'widget' && key === 'workflows') {
            Object.keys(coreTranslations[category][key]).forEach((workflowKey) => {
              const translation = coreTranslations[category][key][workflowKey][languageKey];
              if (translation) {
                if (!locales[languageKey][category]) {
                  locales[languageKey][category] = {};
                }
                if (!locales[languageKey][category][key]) {
                  locales[languageKey][category][key] = {};
                }
                locales[languageKey][category][key][workflowKey] = translation;
              }
            });
          } else {
            const translation = coreTranslations[category][key][languageKey];

            if (translation) {
              if (!locales[languageKey].default) {
                locales[languageKey].default = {};
              }
              if (!locales[languageKey].default[category]) {
                locales[languageKey].default[category] = {};
              }
              locales[languageKey].default[category][key] = translation;
            }
          }
        }
      });
    }
  });
  return locales;
};

const addTranslationsToNodetype = (nodetypeName, nodetypeKey, locale, languageKey) => {
  if (nodetypeKey && Array.isArray(nodetypeKey)) {
    // example: nodetypeKey -> nodetype.properties, nodetype.ui.tabs, etc.
    nodetypeKey.forEach((object) => {
      // example: nodetypeKey -> { name: '_ref', ... }
      if (!object.translations) {
        object.translations = {};
      }
      const translation = locale.nodetype[nodetypeName][object.name];
      if (translation) {
        object.translations[languageKey] = translation;
      }
    });
  }
};
// #endregion UTILITY FUNCTIONS


/**
 * dmRestructure
 */
const mergeFilesIntoDatamodel = async () => {
  let datamodel = {
    instanceName: INSTANCE_NAME,
    instanceType: INSTANCE_TYPE,
    packages: [],
    nodetypeDefinitions: [],
    methods: [],
    leftPanelCategories: [],
    listOfValues: [],
    reports: [],
    uxConfig: {},
  };
  const locales = {};

  try {
    buildMissingFolders();
    buildLocalesFiles();

    // restructure packages
    datamodel.packages = JSON.parse(fs.readFileSync(`${datamodulesPath}packages.json`, 'utf8'));

    // restructure nodetypes
    fs.readdirSync(nodetypesPath).forEach((nodetypeFile) => {
      const nodetypeJSON = fs.readFileSync(`${nodetypesPath}${nodetypeFile}`, 'utf8');
      const nodetype = JSON.parse(nodetypeJSON);

      // restructure nodetype translations
      const nodetypeKeys = [
        nodetype,
        nodetype.properties,
        nodetype.actions,
        nodetype.instanciations,
        nodetype.ui.tabs,
      ];
      nodetypeKeys.forEach((nodetypeKey) => {
        if (nodetypeKey) {
          moveNodetypeTranslationsToLocales(nodetype.name, nodetypeKey, locales);
        }
      });

      datamodel.nodetypeDefinitions.push(nodetype);
    });

    // add corresponding coreTranslations in each locales files
    const coreTranslationsJSON = fs.readFileSync(`${datamodulesPath}coreTranslations.json`, 'utf8');
    const coreTranslations = JSON.parse(coreTranslationsJSON);

    Object.keys(locales).forEach((languageKey) => {
      if (locales[languageKey]) {
        addCoreTranslationsToLocales(coreTranslations, locales, languageKey);
        const localeJSON = JSON.stringify(locales[languageKey], null, '\t');

        fs.writeFileSync(`${localesPath}locale-${languageKey}.json`, localeJSON, 'utf-8');
      }
    });

    // restructure methods
    fs.readdirSync(methodsPath).forEach((methodFile) => {
      // eslint-disable-next-line
      const method = require(`../models/dm/methods/${methodFile}`);
      datamodel.methods.push(method);
    });

    // restructure leftPanelCategories
    if (!fs.existsSync(leftPanelPath)) {
      fs.copyFileSync('./api/models/leftPanelCategories.json', leftPanelPath);
    }
    datamodel.leftPanelCategories = JSON.parse(fs.readFileSync(leftPanelPath, 'utf8'));

    // restructure list of values
    datamodel.listOfValues = JSON.parse(fs.readFileSync(`${datamodulesPath}listOfValues.json`, 'utf8'));

    // restructure reports
    fs.readdirSync(reportsPath).forEach((reportFile) => {
      const reportJSON = fs.readFileSync(`${reportsPath}${reportFile}`, 'utf8');
      const report = JSON.parse(reportJSON);
      datamodel.reports.push(report);
    });

    // restructure uxConfig
    datamodel.uxConfig = JSON.parse(fs.readFileSync(`${datamodulesPath}uxConfig.json`, 'utf8'));

    // if datamodel cloud enabled, restore from cloud
    datamodel = await mongoDbUtil.checkDatamodelCloudBackup(datamodel);

    // write final file
    fs.writeFileSync(datamodelFile, JSON.stringify(datamodel, null, '\t'), 'utf-8');
    fs.copyFileSync(`${datamodulesPath}uxConfig.json`, `${assetsPath}uxConfig.json`);

    return datamodel;
  } catch (err) {
    console.error(err);
    return {
      error: true,
      code: 500,
      message: err,
    };
  }
};

const fileChanged = (filepath, nodetypeContent) => {
  if (fs.existsSync(filepath)) {
    if (fs.readFileSync(filepath, 'utf8') === nodetypeContent) {
      return false;
    }
  }
  return true;
};

const splitDatamodel = (updatedPart) => {
  // updatedPart = object that contains the section of the datamodel and the name of the object we're looking for
  // example:
  // - for Part nodetype: { section: 'nodetypeDefinitions', name: 'part' }
  // - for SetCreatorAsUser customMethod: { section: 'methods', name: 'setCreatorAsUser' }
  // [WARNING] for uxConfig: { section: 'uxConfig' } -> no name
  buildMissingFolders();
  buildLocalesFiles();

  const { datamodel } = global;
  const {
    nodetypeDefinitions,
    methods,
    listOfValues,
    reports,
    packages,
    leftPanelCategories,
    uxConfig,
  } = datamodel;

  // handle core translations
  const coreTranslations = {};
  const locales = {};
  languages.forEach((lang) => {
    const localeJSON = fs.readFileSync(`${localesPath}locale-${lang.key}.json`, 'utf8');
    const locale = JSON.parse(localeJSON);
    locales[lang.key] = locale;

    if (locale.default) {
      Object.keys(locale.default).forEach((defaultKey) => {
        if (locale.default[defaultKey]) {
          if (defaultKey !== 'nodetype') {
            if (!coreTranslations[defaultKey]) {
              coreTranslations[defaultKey] = {};
            }
            Object.keys(locale.default[defaultKey]).forEach((wordKey) => {
              if (locale.default[defaultKey][wordKey]) {
                if (!coreTranslations[defaultKey][wordKey]) {
                  coreTranslations[defaultKey][wordKey] = {};
                }
                coreTranslations[defaultKey][wordKey][lang.key] = locale.default[defaultKey][wordKey];
              }
            });
          }
        }
      });
    }
    if (locale.widget) {
      Object.keys(locale.widget).forEach((widgetKey) => {
        if (locale.widget[widgetKey]) {
          if (widgetKey === 'workflows') {
            if (!coreTranslations.widget) {
              coreTranslations.widget = {};
            }
            if (!coreTranslations.widget[widgetKey]) {
              coreTranslations.widget[widgetKey] = {};
            }
            Object.keys(locale.widget[widgetKey]).forEach((wordKey) => {
              if (locale.widget[widgetKey][wordKey]) {
                if (!coreTranslations.widget[widgetKey][wordKey]) {
                  coreTranslations.widget[widgetKey][wordKey] = {};
                }
                coreTranslations.widget[widgetKey][wordKey][lang.key] = locale.widget[widgetKey][wordKey];
              }
            });
          }
        }
      });
    }
  });
  const coreTranslationsJSON = JSON.stringify(coreTranslations, null, '\t');

  if (!updatedPart || (updatedPart && (updatedPart.section === 'default' || updatedPart.section === 'widget'))) {
    fs.writeFileSync(`${datamodulesPath}coreTranslations.json`, coreTranslationsJSON, 'utf-8');
  }


  if (!updatedPart || (updatedPart && updatedPart.section === 'nodetypeDefinitions')) {
    // split nodetypes
    nodetypeDefinitions.forEach((nodetype) => {
      if (!updatedPart || (updatedPart && updatedPart.name === nodetype.name)) {
        // remove form build
        if (nodetype.ui && nodetype.ui.form && nodetype.ui.form.ng) {
          nodetype.ui.form.ng = {};
        }

        // add translations in nodetypeDM
        languages.forEach((lang) => {
          const locale = locales[lang.key];
          // add nodetype name translations
          if (locale.default && locale.default.nodetype) {
            if (!nodetype.translations) {
              nodetype.translations = {};
            }
            nodetype.translations[lang.key] = locale.default.nodetype[nodetype.name];
          }
          // add nodetype properties, tabs, actions and states translations
          if (locale.nodetype && locale.nodetype[nodetype.name]) {
            const nodetypeKeys = [
              nodetype.properties,
              nodetype.ui.tabs,
              nodetype.actions,
              nodetype.instanciations,
            ];
            nodetypeKeys.forEach((key) => {
              addTranslationsToNodetype(nodetype.name, key, locale, lang.key);
            });
          }
        });

        const nodetypePath = `${datamodulesPath}nodetypes/${nodetype.name}.json`;
        const nodetypeContent = JSON.stringify(nodetype, null, '\t');
        if (fileChanged(nodetypePath, nodetypeContent)) {
          fs.writeFileSync(nodetypePath, nodetypeContent, 'utf-8');
        }
      }
    });
    schemaUtil.generateNodetypeSchemas({ nodetypeDefinitions });
  }

  if (!updatedPart || (updatedPart && updatedPart.section === 'methods')) {
    // split methods
    methods.forEach((method) => {
      if (!updatedPart || (updatedPart && updatedPart.name === method.name)) {
        const { createdBy, updatedBy } = method;
        const createdById = createdBy ? `'${createdBy.id}'` : undefined;
        const createdByName = createdBy ? `'${createdBy.name}'` : undefined;
        const updatedById = updatedBy ? `'${updatedBy.id}'` : undefined;
        const updatedByName = updatedBy ? `'${updatedBy.name}'` : undefined;

        // escape string literals
        method.code = method.code
          .replace(/\\([\s\S])|(`)/g, '\\$1$2') // escape ``
          .replace(/\\([\s\S])|(\$\{)/g, '\\$1$2'); // escape ${}

        const methodFileContent = `
module.exports = {
  id: '${method.id}',
  package: '${method.package}',
  name: '${method.name}',
  serverOrClient: '${method.serverOrClient}',
  code: \`${method.code}\`,
  createdOn: ${method.createdOn},
  createdBy: {
    id: ${createdById},
    name: ${createdByName},
  },
  updatedOn: ${method.updatedOn},
  updatedBy: {
    id: ${updatedById},
    name: ${updatedByName},
  },
}`; // do not change identation

        fs.writeFileSync(`${datamodulesPath}methods/${method.name}.js`, methodFileContent, 'utf8');
      }
    });
  }

  if (!updatedPart || (updatedPart && updatedPart.section === 'reports')) {
    // split reports
    reports.forEach((report) => {
      if (!updatedPart || (updatedPart && updatedPart.name === report.name)) {
        fs.writeFileSync(`${datamodulesPath}reports/${report.name}.json`, JSON.stringify(report, null, '\t'), 'utf8');
      }
    });
  }

  if (!updatedPart || (updatedPart && updatedPart.section === 'uxConfig')) {
    // write uxConfig
    fs.writeFileSync(`${datamodulesPath}uxConfig.json`, JSON.stringify(uxConfig, null, '\t'), 'utf8');
    fs.copyFileSync(`${datamodulesPath}uxConfig.json`, 'assets/uxConfig.json'); // to have access to custom logos front client side
  }
  if (!updatedPart || (updatedPart && updatedPart.section === 'packages')) {
    // write packages
    fs.writeFileSync(`${datamodulesPath}packages.json`, JSON.stringify(packages, null, '\t'), 'utf8');
  }
  if (!updatedPart || (updatedPart && updatedPart.section === 'listOfValues')) {
    // Write Lovs
    fs.writeFileSync(`${datamodulesPath}listOfValues.json`, JSON.stringify(listOfValues, null, '\t'), 'utf8');
  }
  if (!updatedPart || (updatedPart && updatedPart.section === 'leftPanelCategories')) {
    // Write LeftPanelCategories
    fs.writeFileSync(`${datamodulesPath}leftPanelCategories.json`, JSON.stringify(leftPanelCategories, null, '\t'), 'utf8');
  }
  if (CLOUD_STORED_DATAMODEL === 'true') mongoDbUtil.mongoBackup(datamodel);
};

module.exports = { mergeFilesIntoDatamodel, splitDatamodel };
