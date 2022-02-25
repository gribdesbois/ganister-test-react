/*
   __  __                           __        _____           _       __
  / / / /___  ____ __________ _____/ /__     / ___/__________(_)___  / /______
 / / / / __ \/ __ `/ ___/ __ `/ __  / _ \    \__ \/ ___/ ___/ / __ \/ __/ ___/
/ /_/ / /_/ / /_/ / /  / /_/ / /_/ /  __/   ___/ / /__/ /  / / /_/ / /_(__  )
\____/ .___/\__, /_/   \__,_/\__,_/\___/   /____/\___/_/  /_/ .___/\__/____/
    /_/    /____/                                          /_/
*/

/**
 * INIT
 */
const fs = require('fs');
const NODEU = require('uuid');
const _ = require('lodash');
// const winston = require('winston');

const driver = require('../config/config').db;
const datamodel = require('../build/datamodel.json');
const coreItems = require('../api/models/coreItems.js');
let datamodelDiff
try {
  datamodelDiff = require('../api/models/datamodelDiff.json');
} catch (e) {
  console.log('datamodelDiff missing : ok if version is > 1.7.0');
}

const datamodelDiffPath = './api/models/datamodelDiff.json';
const datamodelSchema = require('../api/models/datamodelSchema.json');

const nodetypesDMPath = './api/models/dm/nodetypes';

// const logger = winston.createLogger({
//   level: 'info',
//   format: winston.format.json(),
//   defaultMeta: { service: 'user-service' },
//   transports: [new winston.transports.File({ filename: 'scripts-error.log', level: 'error' }), new winston.transports.File({ filename: 'scripts-combined.log' })],
// });

const {
  splitDatamodelIntoDMFiles,
  mergeFilesIntoDatamodel,
} = require('./datamodelScripts');

module.exports = {


  /**
   * uxConfigUpgrade
   * published in 1.3.0
   */
  uxConfigUpgrade: async () => {
    console.time('Apply uxConfigUpgrade');
    const uxConfig = JSON.parse(fs.readFileSync('./assets/uxConfig.json', 'utf8'));
    datamodelDiff.uxConfig = uxConfig;
    datamodelDiff.uxConfig._action = 'edit';
    try {
      fs.writeFileSync(datamodelDiffPath, JSON.stringify(datamodelDiff, null, '\t'), { encoding: 'utf8' });
    } catch (error) {
      console.error('uxConfigUpgrade Error', error);
    }
    console.timeEnd('Apply uxConfigUpgrade');
  },


  /**
   * removeSeparationUpgrade
   * published in 1.3.0
   */
  removeSeparationUpgrade: async () => {
    console.time('Apply removeSeparationUpgrade');
    const nodetypes = _.get(datamodelDiff, 'nodetypeDefinitions', []);
    nodetypes.filter((n) => _.has(n, 'codification.separator') && _.has(n, 'codification.prefix')).forEach((n) => {
      n.codification.prefix += n.codification.separator;
    });
    nodetypes.filter((n) => _.has(n, 'codification.separator')).forEach((n) => delete n.codification.separator);
    try {
      await fs.writeFileSync(datamodelDiffPath, JSON.stringify(datamodelDiff, null, '\t'), { encoding: 'utf8' });
    } catch (error) {
      console.error('removeSeparationUpgrade Error', error);
    }
    console.timeEnd('Apply removeSeparationUpgrade');
  },


  /**
   * fixTranslationUpgrade
   * published in 1.3.0
   */
  fixTranslationUpgrade: async () => {
    console.time('Apply fixTranslationUpgrade');
    const lang = JSON.parse(fs.readFileSync('./assets/locales/locale-default.json', 'utf8'));
    const nodetypes = _.get(datamodel, 'nodetypeDefinitions', []);
    //  Get all nodetypes that has tabs
    nodetypes.filter((n) => _.has(n, 'ui.tabs') && !_.isEmpty(n.ui.tabs)).forEach((n) => {
      if (!_.has(lang, 'nodetype')) {
        lang.nodetype = {};
      }
      //  For each tab, remove label and update default translation
      n.ui.tabs.forEach((t) => {
        //  If nodetype is not in language, add an empty object
        if (!_.has(lang, `nodetype.${n.name}`)) {
          lang.nodetype[n.name] = {};
        }
        lang.nodetype[n.name][t.name] = t.label || t.name;
        //  Delete tab Label
        delete t.label;
      });
    });
    console.log('write locale-default file');
    await fs.writeFileSync('./assets/locales/locale-default.json', JSON.stringify(lang, null, '\t'), { encoding: 'utf8' });
    console.log('write locale-default file Done');
    console.timeEnd('Apply fixTranslationUpgrade');
  },


  /**
   * fixLifecycleOwners
   * published in 1.3.0
   */
  fixLifecycleOwners: async () => {
    console.time('Apply fixLifecycleOwners');
    datamodelDiff.nodetypeDefinitions.forEach((nodetype) => {
      if (nodetype.lifecycle) {
        console.log('nodetype.lifecycle', nodetype.lifecycle);
        nodetype.lifecycle.states.forEach((state) => {
          console.log('state', state);
          if (state.owner && state.owner.id) {
            state.owner = state.owner.id;
          } else if (state.owner == null) {
            delete state.owner;
          } else if (state.owner && typeof state.owner !== 'string') {
            state.owner = 'none';
          }
        });
      }
    });
    fs.writeFileSync(datamodelDiffPath, JSON.stringify(datamodelDiff, null, '\t'), { encoding: 'utf8' });

    console.timeEnd('Apply fixLifecycleOwners');
  },

  /**
 * fixSerializeProp
 * published in 1.4.0
 */
  fixSerializeProp: async () => {
    console.time('Apply fixSerializeProp');
    datamodelDiff.nodetypeDefinitions.forEach((nodetype) => {
      if (nodetype.properties) {
        nodetype.properties.forEach((prop) => {
          if (prop.name === '_serialized') {
            prop.type = 'json';
            prop.core = true;
            delete prop.default;
          }
        });
      }
    });
    fs.writeFileSync(datamodelDiffPath, JSON.stringify(datamodelDiff, null, '\t'), { encoding: 'utf8' });
    console.timeEnd('Apply fixSerializeProp');
  },

  /**
  * fixMembershipAccess
  * published in 1.4.0
  */
  fixMembershipAccess: async () => {
    console.time('Apply fixMembershipAccess');

    const session = driver.session();
    const query = 'MATCH (a:user)-[m:isMemberOf]-(g:Group) WHERE NOT(EXISTS(m.role)) SET m.role="manager" RETURN a,m,g';
    const result = await session.run(query);
    session.close();
    console.log('# rel updated', result.records.length);

    console.timeEnd('Apply fixMembershipAccess');
  },

  /**
  * replacePermissionIdsByNames
  * published in 1.4.1
  */
  replacePermissionIdsByNames: async () => {
    console.time('Apply replacePermissionIdsByNames');

    datamodelDiff.nodetypeDefinitions.forEach((nodetype) => {
      nodetype.permissionSet = nodetype.name;
    });
    fs.writeFileSync(datamodelDiffPath, JSON.stringify(datamodelDiff, null, '\t'), { encoding: 'utf8' });

    console.timeEnd('Apply replacePermissionIdsByNames');
  },

  /**
  * fixTriggerName
  * published in 1.5.0
  */
  fixTriggerName: async () => {
    console.time('Apply fixTriggerName');

    datamodelDiff.nodetypeDefinitions.forEach((nodetype) => {
      nodetype.methods.forEach((method) => {
        if (method.trigger === 'afterCreation') {
          method.trigger = 'afterNodeCreation';
        }
        if (method.trigger === 'afterUpdate') {
          method.trigger = 'afterNodeUpgrade';
        }
        if (method.trigger === 'afterDelete') {
          method.trigger = 'afterNodeDeletion';
        }
        if (method.trigger === 'beforeCreation') {
          method.trigger = 'afterNodeCreation';
        }
        if (method.trigger === 'beforeUpdate') {
          method.trigger = 'afterNodeUpgrade';
        }
        if (method.trigger === 'beforeDelete') {
          method.trigger = 'afterNodeDeletion';
        }
      });
    });
    fs.writeFileSync(datamodelDiffPath, JSON.stringify(datamodelDiff, null, '\t'), { encoding: 'utf8' });

    console.timeEnd('Apply fixTriggerName');
  },

  addReleasedUntilProperty: () => {
    console.time('Add _releasedUntil property to nodetypes');

    datamodelDiff.nodetypeDefinitions.forEach((nodetype) => {
      if (!nodetype || !nodetype.properties) return;
      const newReleasedUntil = {
        name: '_releasedUntil',
        type: 'date',
        unique: false,
        mandatory: false,
        generated: 'api',
        core: true,
        id: `prop_${NODEU.v1()}`,
      };

      const existingReleasedUntil = nodetype.properties.find((property) => property.name === '_releasedUntil');
      if (existingReleasedUntil) {
        Object.assign(newReleasedUntil, existingReleasedUntil);
      }
      nodetype.properties.push(newReleasedUntil);
    });
    fs.writeFileSync(datamodelDiffPath, JSON.stringify(datamodelDiff, null, '\t'), { encoding: 'utf8' });

    console.timeEnd('Add _releasedUntil property to nodetypes');
  },


  /**
   * setRelIds
   * published in 1.6.0
   */
  setRelIds: async () => {
    console.time('Apply setRelIds');

    const session = driver.session();
    const query = ' MATCH (a)-[rel]->(b) WHERE rel.`_id` is NULL SET rel._id = randomUUID() RETURN rel';
    const result = await session.run(query);
    session.close();
    console.log('# rel updated', result.records.length);

    console.timeEnd('Apply setRelIds');
  },

  /**
 * fixGeneratedInfoOnCoreProps
 * published in 1.6.0
 */
  fixGeneratedInfoOnCoreProps: async () => {
    console.time('Apply fixGeneratedInfoOnCoreProps');
    datamodelDiff.nodetypeDefinitions.forEach((nodetype) => {
      if (nodetype.properties) {
        nodetype.properties.forEach((prop) => {
          const coreProp = _.find(coreItems.properties, { name: prop.name });
          if (coreProp && prop.generated !== 'codification') {
            prop.generated = coreProp.generated;
          }
        });
      }
    });
    fs.writeFileSync(datamodelDiffPath, JSON.stringify(datamodelDiff, null, '\t'), { encoding: 'utf8' });
    console.timeEnd('Apply fixGeneratedInfoOnCoreProps');
  },

  /**
* stop managing a datamodelDiff
* published in 1.6.0
*/
  buildDMFiles: async () => {
    console.time('Build DM directories and files.');
    splitDatamodelIntoDMFiles();
    console.timeEnd('Build DM directories and files.');
  },

  /**
* change custom methods format in datamodel files (in actions and transitions)
* published in 1.7.0
*/
  changeCustomMethodsFormats: async () => {
    console.time('Apply changeCustomMethodsFormats');
    const DMFiles = fs.readdirSync(nodetypesDMPath);
    const promises = DMFiles.map(async (file) => {
      const fileContent = fs.readFileSync(`${nodetypesDMPath}/${file}`);
      const nodetypeDM = JSON.parse(fileContent);

      if (nodetypeDM.elementType === 'node') {
        let nodetypeDMChanges = false;

        // change actions methods format
        if (nodetypeDM.actions && nodetypeDM.actions.length) {
          nodetypeDM.actions.forEach((action) => {
            if (action.serverMethod && typeof action.serverMethod === 'string') {
              const method = { name: action.serverMethod };
              action.serverMethod = method;
              nodetypeDMChanges = true;
            }
          });
        }

        // change server methods format in lifecycle transitions
        if (nodetypeDM.lifecycle.transitions && nodetypeDM.lifecycle.transitions.length) {
          nodetypeDM.lifecycle.transitions.forEach((transition) => {
            const methodsTypes = ['server_pre', 'server_post'];
            methodsTypes.forEach((methodType) => {
              if (transition[methodType] && transition[methodType].length) {
                const methodsObjects = transition[methodType].map((serverMethod) => {
                  if (typeof serverMethod === 'string') {
                    return { name: serverMethod };
                  }
                  return serverMethod;
                });
                transition[methodType] = methodsObjects;
                nodetypeDMChanges = true;
              }
            });
          });
        }

        // overwrite datamodel
        if (nodetypeDMChanges) {
          fs.writeFileSync(`${nodetypesDMPath}/${file}`, JSON.stringify(nodetypeDM, null, '\t'));
        }
      }
    });
    await Promise.all(promises);
    console.timeEnd('Apply changeCustomMethodsFormats');
  },

  /**
   * add new core nodetypes
   * publisehd in 2.0.0
   */
  addNewCoreNodetypes: async () => {
    try {
      const nodetypesPath = './upgrade/api/models/dm/nodetypes';
      if (!fs.existsSync(nodetypesPath)) {
        throw new Error(`Can't find directory '${nodetypesPath}'`);
      }

      const files = fs.readdirSync(nodetypesPath);
      files.forEach((file) => {
        const sourcePath = `${nodetypesPath}/${file}`;
        const nodetypeJSON = fs.readFileSync(sourcePath);
        const nodetype = JSON.parse(nodetypeJSON);

        if (nodetype.core) {
          const targetPath = `${nodetypesDMPath}/${file}`;
          if (!fs.existsSync(targetPath)) {
            fs.copyFileSync(sourcePath, targetPath);
          }
        }
      });
    } catch (error) {
      console.error(error);
    }
  },

  /**
   * add new core properties
   * publisehd in 2.0.0
   */
  addNewCoreProperties: async () => {
    try {
      const nodetypesPath = './upgrade/api/models/dm/nodetypes';
      if (!fs.existsSync(nodetypesPath)) {
        throw new Error(`Can't find directory '${nodetypesPath}'`);
      }

      const files = fs.readdirSync(nodetypesPath);
      files.forEach((file) => {
        const originalNodetypePath = `${nodetypesDMPath}/${file}`;
        if (!fs.existsSync(originalNodetypePath)) return;

        const originalNodetypeJSON = fs.readFileSync(originalNodetypePath);
        const originalNodetype = JSON.parse(originalNodetypeJSON);

        const updatedNodetypeJSON = fs.readFileSync(`${nodetypesPath}/${file}`);
        const updatedNodetype = JSON.parse(updatedNodetypeJSON);

        updatedNodetype.properties.forEach((updatedProperty) => {
          if (!updatedProperty.core) return;

          const originalProperty = originalNodetype.properties.find((p) => {
            return p.name === updatedProperty.name;
          });
          if (originalProperty) {
            const { translations } = originalProperty;
            Object.assign(originalProperty, updatedProperty);
            originalProperty.translations = translations;
          } else {
            originalNodetype.properties.push(updatedProperty);
          }
        });

        const data = JSON.stringify(originalNodetype, null, '\t');
        fs.writeFileSync(`${nodetypesDMPath}/${originalNodetype.name}.json`, data);
      });
    } catch (error) {
      console.error(error);
    }
  },

  /**
   * start to set multiple source and target nodetypes to relationship
   * published in 2.0.0
   */
  setRelationshipsForMultipleSourcesAndTargets: async () => {
    try {
      console.time('apply setRelationshipsForMultipleSourcesAndTargets');

      const files = fs.readdirSync(nodetypesDMPath);
      const nodetypes = files.map((file) => {
        const content = fs.readFileSync(`${nodetypesDMPath}/${file}`);
        return JSON.parse(content);
      });

      nodetypes.forEach((nodetype) => {
        if (nodetype.elementType === 'node') return;

        switch (nodetype.name) {
          case 'accessRole': {
            nodetype.directions = [];

            const sourcesNames = ['PermissionSet', 'Group', 'user'];
            const sourcesIds = nodetypes
              .filter((n) => sourcesNames.includes(n.name))
              .map((n) => n.id);

            const targetsIds = nodetypes
              .filter((n) => n.elementType === 'node')
              .map((n) => n.id);

            sourcesIds.forEach((sourceId) => {
              targetsIds.forEach((targetId) => {
                const direction = { source: sourceId, target: targetId };
                nodetype.directions.push(direction);
              });
            });

            break;
          }
          case 'lifecycleRole': {
            nodetype.directions = [];

            const sourcesIds = nodetypes
              .filter((n) => {
                const isNode = n.elementType === 'node';
                const isUser = n.name === 'user';
                const isPromotable = n.lifecycle?.transitions && n.lifecycle.transitions.length > 1;
                return isNode && !isUser && isPromotable;
              })
              .map((n) => n.id);

            const targetsNames = ['Group', 'user'];
            const targetsIds = nodetypes
              .filter((n) => targetsNames.includes(n.name))
              .map((n) => n.id);

            sourcesIds.forEach((sourceId) => {
              targetsIds.forEach((targetId) => {
                const direction = { source: sourceId, target: targetId };
                nodetype.directions.push(direction);
              });
            });

            break;
          }
          case 'generated':
          case 'handlesChangeOf': {
            nodetype.directions = [];

            const sourceNodetype = nodetypes
              .find((n) => n.name === 'eco');

            const targetsIds = nodetypes
              .filter((n) => n.changeMethod === 'eco')
              .map((n) => n.id);

            targetsIds.forEach((targetId) => {
              const direction = { source: sourceNodetype.id, target: targetId };
              nodetype.directions.push(direction);
            });

            break;
          }
          case 'revision': {
            nodetype.directions = [];

            const sourcesIds = nodetypes
              .filter((n) => n.versionnable)
              .map((n) => n.id);

            sourcesIds.forEach((sourceId) => {
              const direction = { source: sourceId, target: sourceId };
              nodetype.directions.push(direction);
            });

            break;
          }
          case 'nodeThumbnail': {
            nodetype.directions = [];

            const sourcesIds = nodetypes
              .filter((n) => n.elementType === 'node' && n.hasThumbnail)
              .map((n) => n.id);

            const targetNodetype = nodetypes.find((n) => n.name === 'file');

            sourcesIds.forEach((sourceId) => {
              const direction = { source: sourceId, target: targetNodetype.id };
              nodetype.directions.push(direction);
            });

            break;
          }
          case 'groupMember': {
            nodetype.directions = [];

            const sourcesIds = nodetypes
              .filter((n) => n.name === 'user' || n.name === 'Group')
              .map((n) => n.id);

            const targetNodetype = nodetypes.find((n) => n.name === 'Group');

            sourcesIds.forEach((sourceId) => {
              const direction = { source: sourceId, target: targetNodetype.id };
              nodetype.directions.push(direction);
            });

            break;
          }
          case 'subscribeTo': {
            nodetype.directions = [];

            const sourceNodetype = nodetypes.find((n) => n.name === 'user');

            const targetsIds = nodetypes
              .filter((n) => n.elementType === 'node' && n.name !== 'PermissionSet')
              .map((n) => n.id);

            targetsIds.forEach((targetId) => {
              const direction = { source: sourceNodetype.id, target: targetId };
              nodetype.directions.push(direction);
            });

            break;
          }
          default:
            const { sourceNodetype, targetNodetype } = nodetype;
            if (sourceNodetype && targetNodetype) {
              nodetype.directions = [{ source: sourceNodetype, target: targetNodetype }];
            }

            break;
        }

        if (nodetype.sourceNodetype) delete nodetype.sourceNodetype;
        if (nodetype.targetNodetype) delete nodetype.targetNodetype;

        const data = JSON.stringify(nodetype, null, '\t');
        fs.writeFileSync(`${nodetypesDMPath}/${nodetype.name}.json`, data);
      });

      console.timeEnd('apply setRelationshipsForMultipleSourcesAndTargets');
    } catch (error) {
      console.error(error);
    }
  },

  /**
   * Keep only groupMember core nodetype
   * Delete identityStructure and userMember
   * published in 2.0.0
   */
  keepOnlyGroupMemberNodetype: async () => {
    console.time('Keep only groupMember relationship nodetype');

    const identityStructurePath = `${nodetypesDMPath}/identityStructure.json`;
    const userMemberPath = `${nodetypesDMPath}/userMembership.json`;

    [identityStructurePath, userMemberPath].forEach((path) => {
      if (fs.existsSync(path)) fs.unlinkSync(path);
    });

    console.timeEnd('Keep only groupMember relationship nodetype');
  },

  /**
   * change custom methods format in datamodel files (in actions and transitions)
   * published in 2.0.0
   */
  changeLifecycleMethodsFormats: async () => {
    try {
      console.time('Apply changeLifecycleMethodsFormats');

      const DMFiles = fs.readdirSync(nodetypesDMPath);
      const promises = DMFiles.map(async (file) => {
        const fileContent = fs.readFileSync(`${nodetypesDMPath}/${file}`);
        const nodetypeDM = JSON.parse(fileContent);

        let nodetypeDMChanges = false;

        // change triggered methods format
        if (nodetypeDM.methods && nodetypeDM.methods.length) {
          nodetypeDM.methods.forEach((method) => {
            if (method.method) {
              method.name = method.method;
              delete method.method;
              nodetypeDMChanges = true;
            }
          });
        }

        // change actions methods format
        if (nodetypeDM.actions && nodetypeDM.actions.length) {
          nodetypeDM.actions.forEach((action) => {
            if (action.serverMethod && typeof action.serverMethod === 'string') {
              const method = { name: action.serverMethod };
              action.serverMethod = method;
              nodetypeDMChanges = true;
            }
          });
        }

        // change server methods format in lifecycle transitions
        if (nodetypeDM.lifecycle.transitions && nodetypeDM.lifecycle.transitions.length) {
          nodetypeDM.lifecycle.transitions.forEach((transition) => {
            const methodsTypes = ['server_pre', 'server_post'];
            methodsTypes.forEach((methodType) => {
              if (transition[methodType] && transition[methodType].length) {
                const methodsObjects = transition[methodType].map((serverMethod) => {
                  if (typeof serverMethod === 'string') {
                    return { name: serverMethod };
                  }
                  return serverMethod;
                });
                transition[methodType] = methodsObjects;
                nodetypeDMChanges = true;
              }
            });
          });
        }

        // overwrite datamodel
        if (nodetypeDMChanges) {
          fs.writeFileSync(
            `${nodetypesDMPath}/${file}`,
            JSON.stringify(nodetypeDM, null, '\t'),
          );
        }
      });
      await Promise.all(promises);

      const { properties, required } = datamodelSchema.properties.nodetypeDefinitions.items.properties.methods.items;
      if (properties.method) {
        properties.name = { type: 'string' };
        delete properties.method;
      }

      const index = required.findIndex((i) => i === 'method');
      if (index > 0) {
        required.splice(index, 1, 'name');
      }

      const updatedSchema = JSON.stringify(datamodelSchema, null, '\t');
      fs.writeFileSync('./api/models/datamodelSchema.json', updatedSchema);

      console.timeEnd('Apply changeLifecycleMethodsFormats');
    } catch (error) {
      console.error(error);
    }
  },


  /**
   * change custom methods triggers format in datamodel files (in actions and transitions)
   * published in 2.0.0
   */
  changeCustomMethodsTriggers: async () => {
    try {
      console.time('Apply changeCustomMethodsTriggers');

      const DMFiles = fs.readdirSync(nodetypesDMPath);
      const promises = DMFiles.map(async (file) => {
        const fileContent = fs.readFileSync(`${nodetypesDMPath}/${file}`);
        const nodetypeDM = JSON.parse(fileContent);

        const { methods = [] } = nodetypeDM;
        methods.forEach((method) => {
          switch (method.trigger) {
            case 'afterGetNodes':
              method.trigger = 'afterGetAll';
              break;
            case 'afterGetNode':
              method.trigger = 'afterGet';
              break;
            case 'beforeCreation':
            // falls through
            case 'beforeNodeCreation':
              method.trigger = 'beforeCreate';
              break;
            case 'afterCreation':
            // falls through
            case 'afterNodeCreation':
              method.trigger = 'afterCreate';
              break;
            case 'beforeNodeUpdate':
              method.trigger = 'beforeUpdate';
              break;
            case 'afterNodeUpdate':
              method.trigger = 'afterUpdate';
              break;
            case 'afterNodeDeletion':
              method.trigger = 'afterDelete';
              break;
            default:
              break;
          }
        });

        const data = JSON.stringify(nodetypeDM, null, '\t');
        fs.writeFileSync(`${nodetypesDMPath}/${file}`, data);
      });
      await Promise.all(promises);

      console.timeEnd('Apply changeCustomMethodsTriggers');
    } catch (error) {
      console.error(error);
    }
  },

  /**
   * change _serialized property type
   * published in 2.0.0
   */
  changeSerializedPropertyType: async () => {
    try {
      console.time('Apply changeSerializedPropertyType');

      const DMFiles = fs.readdirSync(nodetypesDMPath);
      const promises = DMFiles.map(async (file) => {
        const fileContent = fs.readFileSync(`${nodetypesDMPath}/${file}`);
        const nodetypeDM = JSON.parse(fileContent);

        const { properties = [] } = nodetypeDM;
        const serialized = properties.find((p) => p.name === '_serialized');
        if (serialized) {
          serialized.type = 'multiselect';
          if (!serialized.default) serialized.default = [];
        }

        const data = JSON.stringify(nodetypeDM, null, '\t');
        fs.writeFileSync(`${nodetypesDMPath}/${file}`, data);
      });
      await Promise.all(promises);

      const query = `
        MATCH (n)
        WHERE n._serialized = ""
        SET n._serialized = []
      `;

      const session = driver.session();
      await session.run(query);
      await session.close();

      console.timeEnd('Apply changeSerializedPropertyType');
    } catch (error) {
      console.error(error);
    }
  },

  /**
   * change _thumbnail property type
   * published in 2.0.0
   */
  changeThumbnailPropertyType: async () => {
    try {
      console.time('Apply changeThumbnailPropertyType');

      const DMFiles = fs.readdirSync(nodetypesDMPath);
      const nodeThumbnailFile = DMFiles.find((file) => file === 'nodeThumbnail.json');
      const nodeThumbnailFileContent = fs.readFileSync(`${nodetypesDMPath}/${nodeThumbnailFile}`);
      const nodeThumbnailDM = JSON.parse(nodeThumbnailFileContent);

      const promises = DMFiles.map(async (file) => {
        const fileContent = fs.readFileSync(`${nodetypesDMPath}/${file}`);
        const nodetypeDM = JSON.parse(fileContent);

        const thumbnail = nodetypeDM.properties.find((p) => p.name === '_thumbnail');
        if (thumbnail) {
          thumbnail.type = 'node';
          if (thumbnail.default) thumbnail.default = null;
          thumbnail.relationship = nodeThumbnailDM.id;
        }

        const data = JSON.stringify(nodetypeDM, null, '\t');
        fs.writeFileSync(`${nodetypesDMPath}/${file}`, data);
      });
      await Promise.all(promises);

      console.timeEnd('Apply changeThumbnailPropertyType');
    } catch (error) {
      console.error(error);
    }
  },

  /**
   * change File properties
   * published in 2.0.0
   */
  changeFileProperties: async () => {
    try {
      console.time('Apply changeFileProperties');

      const fileContent = fs.readFileSync(`${nodetypesDMPath}/file.json`);
      const nodetypeDM = JSON.parse(fileContent);

      const { properties = [] } = nodetypeDM;
      properties.forEach((property) => {
        const { name } = property;

        if (name === 'name') property.name = 'filename';
        if (name === 'size') property.name = 'filesize';
      });

      const { form = {}, gridColumns = [] } = nodetypeDM.ui;
      if (form.definition?.A) {
        const changeInputProperty = (formItem) => {
          const container = formItem.type === 'container';
          const columns = formItem.columns && formItem.columns[0];
          if (container && columns) {
            formItem.columns[0].forEach((column) => {
              changeInputProperty(column);
            });
          } else {
            if (formItem.property === 'name') formItem.property = 'filename';
            if (formItem.property === 'size') formItem.property = 'filesize';
          }
        };

        for (const formItem of form.definition.A) {
          changeInputProperty(formItem);
        }
      }

      gridColumns.forEach((column) => {
        const { name } = column;

        if (name === 'file.name') column.name = 'file.filename';
        if (name === 'file.size') column.name = 'file.filesize';
      });

      const sourceProperty = properties.find((p) => p.name === 'source');
      if (!sourceProperty) {
        const source = {
          id: NODEU.v4(),
          name: 'source',
          type: 'string',
          unique: false,
          mandatory: false,
          generated: false,
          infoData: false,
          core: false,
        };

        properties.push(source);
      }

      const sourceKeyProperty = properties.find((p) => p.name === 'sourceKey');
      if (!sourceKeyProperty) {
        const sourceKey = {
          id: NODEU.v4(),
          name: 'sourceKey',
          type: 'string',
          unique: false,
          mandatory: false,
          generated: false,
          infoData: false,
          core: false,
        };

        properties.push(sourceKey);
      }

      const data = JSON.stringify(nodetypeDM, null, '\t');
      fs.writeFileSync(`${nodetypesDMPath}/file.json`, data);

      const session = driver.session();

      const query = `
        MATCH (n:file)
        SET
          n.filename = CASE n.name WHEN NULL THEN n.filename ELSE n.name END,
          n.filesize = CASE n.size WHEN NULL THEN n.filesize ELSE n.size END,
          n.name = NULL,
          n.size = NULL
      `;

      await session.run(query);
      await session.close();

      console.timeEnd('Apply changeFileProperties');
    } catch (error) {
      console.error(error);
    }
  },

  /**
   * fix Nodetype properties default value format
   * published in 2.0.0
   */
  fixNodetypepropertiesDefaultValues: async () => {
    try {
      console.time('Apply fixNodetypepropertiesDefaultValues');

      const DMFiles = fs.readdirSync(nodetypesDMPath);
      DMFiles.forEach((file) => {
        const fileContent = fs.readFileSync(`${nodetypesDMPath}/${file}`);
        const nodetypeDM = JSON.parse(fileContent);

        const { properties = [] } = nodetypeDM;
        properties.forEach((property) => {
          const { type, default: value } = property;

          switch (type) {
            case 'date':
            case 'dateTime':
            case 'integer':
            case 'double':
              if (typeof value === 'string') {
                property.default = parseInt(value, 10);
              }
              break;
            case 'boolean':
            case '2-states Boolean':
            case '3-states Boolean':
              if (value && typeof value !== 'boolean') {
                property.default = !!value;
              }
              break;
            case 'multiselect':
            case 'tags':
              if (value && typeof value !== 'object') {
                property.default = [value];
              }
              break;
            case 'node':
              break;
            default:
              if ((value !== undefined && value !== null) && typeof value !== 'string') {
                property.default = typeof value === 'boolean' ? '' : `${value}`;
              }
              break;
          }
        });

        const data = JSON.stringify(nodetypeDM, null, '\t');
        fs.writeFileSync(`${nodetypesDMPath}/${file}`, data);
      });

      console.timeEnd('Apply fixNodetypepropertiesDefaultValues');
    } catch (error) {
      console.error(error);
    }
  },

  /**
   * ensure every relationships have an _id in database
   * published in 2.0.0
   */
  addMissingRelationshipsId: async () => {
    try {
      console.time("Add missing Relationships' Id");

      const session = driver.session();
      const query = `
        MATCH (n)-[r]-()
        WHERE NOT EXISTS(r._id)
        SET r._id = randomUUID()
      `;

      await session.run(query);
      await session.close();

      console.timeEnd("Add missing Relationships' Id");
    } catch (error) {
      console.error(error);
    }
  },

  /**
   * ensure every nodetype properties are saved in the right format in database
   * published in 2.0.0
   */
  fixWrongPropertiesFormat: async () => {
    try {
      console.time("Fix nodetype's properties with wrong format");

      const session = driver.session();
      const txc = session.beginTransaction();

      const DMFiles = fs.readdirSync(nodetypesDMPath);
      for (const file of DMFiles) {
        const fileContent = fs.readFileSync(`${nodetypesDMPath}/${file}`);
        const nodetype = JSON.parse(fileContent);

        const propertiesSubQueries = nodetype.properties.map((property) => {
          const { type, name } = property;

          let subQuery = '';

          switch (type) {
            case 'date':
            case 'dateTime':
            case 'integer':
            case 'double':
              subQuery = `n.${name} = toInteger(n.${name})`;
              break;
            case 'boolean':
            case '2-states Boolean':
            case '3-states Boolean':
              subQuery = `n.${name} = toBoolean(n.${name})`;
              break;
            case 'json':
              subQuery = `n.${name} = case when size(n.${name} + 11) = size(n.${name})+1 then "[]" else n.${name} end`;
              break;
            case 'multiselect':
            case 'tags':
              subQuery = `n.${name} = case when size(n.${name} + 11) = size(n.${name})+1 then [] else n.${name} end`;
              break;
            case 'node':
              break;
            default:
              subQuery = `n.${name} = toString(n.${name})`;
              break;
          }

          return subQuery;
        });

        const propertiesSubQuery = propertiesSubQueries.filter(Boolean).join(',\n');

        const nodeNodetype = nodetype.elementType === 'node';
        const query = `
        MATCH ${nodeNodetype ? `(n:${nodetype.name})` : `()-[n:${nodetype.linkName}]-()`}
        SET ${propertiesSubQuery}
        `;

        // logger.log('info', query);

        await txc.run(query);
      }

      await txc.commit();
      await session.close();

      console.timeEnd("Fix nodetype's properties with wrong format");
    } catch (error) {
      console.error(error);
      // logger.log('error', error);
    }
  },

  /**
   * delete "undefined" and "null" as properties' values in database
   * published in 2.0.0
   */
  deleteFalsyStringsInDatabase: async () => {
    try {
      console.time('Delete false strings in database');

      const nodeProperties = new Set();
      const relationshipProperties = new Set();

      const DMFiles = fs.readdirSync(nodetypesDMPath);
      for (const file of DMFiles) {
        const fileContent = fs.readFileSync(`${nodetypesDMPath}/${file}`);
        const nodetype = JSON.parse(fileContent);

        for (const property of nodetype.properties) {
          if (nodetype.elementType === 'node') {
            nodeProperties.add(property.name);
          } else {
            relationshipProperties.add(property.name);
          }
        }
      }

      const session = driver.session();
      const txc = session.beginTransaction();

      for (const property of nodeProperties) {
        const nodeQuery = `
          WITH ['undefined', 'null', 'false', 'true', ''] as invalidStrings
          MATCH (n)
          WHERE n.${property} IN invalidStrings
          REMOVE n.${property}
        `;

        // logger.log('info', nodeQuery);

        await txc.run(nodeQuery);
      }

      for (const property of relationshipProperties) {
        const relationshipQuery = `
          WITH ['undefined', 'null', 'false', 'true', ''] as invalidStrings
          MATCH ()-[n]-()
          WHERE n.${property} IN invalidStrings
          REMOVE n.${property}
        `;

        // logger.log('info', relationshipQuery);

        await txc.run(relationshipQuery);
      }

      await txc.commit();
      await session.close();

      console.timeEnd('Delete false strings in database');
    } catch (error) {
      console.error(error);
      // logger.log('error', error);
    }
  },

  /**
   * add nodetypeName as '_type' property to relationships
   * published in 2.0.0
   */
  addNodetypeNameToRelationshipsInDatabase: async () => {
    try {
      console.time('Add nodetypeName to relationships in database');

      const DMFiles = fs.readdirSync(nodetypesDMPath);
      const nodetypes = DMFiles.map((file) => {
        const fileContent = fs.readFileSync(`${nodetypesDMPath}/${file}`);
        return JSON.parse(fileContent);
      });

      for (const nodetype of nodetypes) {
        const session = driver.session();
        const txc = session.beginTransaction();

        const { name, linkName, directions = [] } = nodetype;

        if (name === 'accessRole') {
          const query = `
            MATCH ()-[r:${linkName}]->()
            WHERE r._type <> $name OR r._type IS NULL
            SET r._type = $name
          `;

          // logger.log('info', query);

          await txc.run(query, { name });
        } else {
          for (const direction of directions) {
            const { source, target } = direction;

            const sourceNodetype = nodetypes.find(({ id }) => id === source);
            const targetNodetype = nodetypes.find(({ id }) => id === target);

            const { name: sourceName } = sourceNodetype || {};
            const { name: targetName } = targetNodetype || {};

            if (!sourceName || !targetName) return;

            const query = `
              MATCH (:${sourceName})-[r:${linkName}]->(:${targetName})
              WHERE r._type <> $name OR r._type IS NULL
              SET r._type = $name
            `;

            // logger.log('info', query);

            await txc.run(query, { name });
          }
        }

        await txc.commit();
        await session.close();
      }

      console.timeEnd('Add nodetypeName to relationships in database');
    } catch (error) {
      console.error(error);
      // logger.log('error', error);
    }
  },

  /**
   * delete property of type node from node properties
   * published in 2.0.0
   */
  deletePropertiesOfTypeNodeFromNodes: async () => {
    try {
      console.time('Delete properties of type node from nodes properties');

      const DMFiles = fs.readdirSync(nodetypesDMPath);
      const nodetypes = DMFiles.map((file) => {
        const fileContent = fs.readFileSync(`${nodetypesDMPath}/${file}`);
        return JSON.parse(fileContent);
      });

      const session = driver.session();
      const txc = session.beginTransaction();

      for (const nodetype of nodetypes) {
        if (nodetype.elementType === 'node') {
          const propertiesOfTypeNode = nodetype.properties.filter((property) => {
            return property.type === 'node';
          });

          if (propertiesOfTypeNode.length) {
            const propertiesFilters = propertiesOfTypeNode
              .map((p) => `n.${p.name} IS NOT NULL`)
              .join(' OR ');

            const setProperties = propertiesOfTypeNode
              .map((p) => `n.${p.name} = NULL`)
              .join(', ');

            const query = `
              MATCH (n:${nodetype.name})
              WHERE ${propertiesFilters}
              SET ${setProperties}
            `;

            // logger.log('info', query);

            await txc.run(query);
          }
        }
      }

      await txc.commit();
      await session.close();

      console.timeEnd('Delete properties of type node from nodes properties');
    } catch (error) {
      console.error(error);
      // logger.log('error', error);
    }
  },
};
