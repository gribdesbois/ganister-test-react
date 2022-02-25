const fs = require('fs');
const languages = require('../config/languages.json');

const datamodelPath = './build/datamodel.json';
const datamodulesPath = './api/models/dm/';
const nodetypesPath = './api/models/dm/nodetypes/';
const methodsPath = './api/models/dm/methods/';
const reportsPath = './api/models/dm/reports/';
const localesPath = './assets/locales/';

const defaultFalseValues = [
  { name: 'unique', value: false },
  { name: 'mandatory', value: false },
  { name: 'generated', value: false },
  { name: 'core', value: false },
];

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
    if (!fs.existsSync(path)) fs.writeFileSync(path, '{}', { encoding: 'utf8' });
  });
};

const addTranslationsToNodetype = (nodetypeName, nodetypeKey, locale, languageKey) => {
  if (nodetypeKey && Array.isArray(nodetypeKey)) {
    // example: nodetypeKey -> nodetype.properties, nodetype.ui.tabs, etc.
    nodetypeKey.forEach((object) => {
      // example: nodetypeKey -> { name: '_ref', ... }
      if (!object.translations) {
        object.translations = {};
      }
      object.translations[languageKey] = locale.nodetype[nodetypeName][object.name];
    });
  }
};

const splitDatamodelIntoDMFiles = () => {
  buildMissingFolders()
  buildLocalesFiles();

  const datamodel = JSON.parse(fs.readFileSync(datamodelPath, 'utf8'));
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
      for (defaultKey in locale.default) {
        if (defaultKey !== 'nodetype') {
          if (!coreTranslations[defaultKey]) {
            coreTranslations[defaultKey] = {};
          }
          for (wordKey in locale.default[defaultKey]) {
            if (!coreTranslations[defaultKey][wordKey]) {
              coreTranslations[defaultKey][wordKey] = {};
            }
            coreTranslations[defaultKey][wordKey][lang.key] = locale.default[defaultKey][wordKey];
          }
        }
      }
    }
  });
  const coreTranslationsJSON = JSON.stringify(coreTranslations, null, '\t');
  fs.writeFileSync(`${datamodulesPath}coreTranslations.json`, coreTranslationsJSON, { encoding: 'utf8' });


  // split nodetypes
  nodetypeDefinitions.forEach((nodetype) => {
    // remove form build
    if (nodetype.ui && nodetype.ui.form && nodetype.ui.form.ng) {
      nodetype.ui.form.ng = {};
    }
    // remove default props
    nodetype.properties.forEach((prop) => {
      defaultFalseValues.forEach((def) => {
        if (prop[def.name] === def.value) delete prop[def.name];
      });
    });

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

    fs.writeFileSync(`${datamodulesPath}nodetypes/${nodetype.name}.json`, JSON.stringify(nodetype, null, '\t'), { encoding: 'utf8' });
  });


  // split methods
  methods.forEach((method) => {
    const createdById = method.createdBy ? `'${method.createdBy.id}'` : undefined;
    const createdByName = method.createdBy ? `'${method.createdBy.name}'` : undefined;
    const updatedById = method.updatedBy ? `'${method.updatedBy.id}'` : undefined;
    const updatedByName = method.updatedBy ? `'${method.updatedBy.name}'` : undefined;

    // escape string literals
    const methodCode = method.code
      .replace(/\\([\s\S])|(`)/g, "\\$1$2") // escape ``
      .replace(/\\([\s\S])|(\$\{)/g, "\\$1$2") // escape ${}

    const methodFileContent = `
module.exports = {
  id: '${method.id}',
  package: '${method.package}',
  name: '${method.name}',
  serverOrClient: '${method.serverOrClient}',
  code: \`${methodCode}\`,
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
    fs.writeFileSync(`${datamodulesPath}methods/${method.name}.js`, methodFileContent, { encoding: 'utf8' });
  });

  // split reports
  reports.forEach((report) => {
    fs.writeFileSync(`${datamodulesPath}reports/${report.name}.json`, JSON.stringify(report, null, '\t'), { encoding: 'utf8' });
  });
  // write uxConfig
  fs.writeFileSync(`${datamodulesPath}uxConfig.json`, JSON.stringify(uxConfig, null, '\t'), { encoding: 'utf8' });
  fs.copyFileSync(`${datamodulesPath}uxConfig.json`, `assets/uxConfig.json`); // to have access to custom logos front client side
  // write packages
  fs.writeFileSync(`${datamodulesPath}packages.json`, JSON.stringify(packages, null, '\t'), { encoding: 'utf8' });
  // Write Lovs
  fs.writeFileSync(`${datamodulesPath}listOfValues.json`, JSON.stringify(listOfValues, null, '\t'), { encoding: 'utf8' });
  // write leftPanelCategories
  fs.writeFileSync(`${datamodulesPath}leftPanelCategories.json`, JSON.stringify(leftPanelCategories, null, '\t'), { encoding: 'utf8' });
};


module.exports = { splitDatamodelIntoDMFiles };
