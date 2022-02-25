const { ganisterError } = require('../utils/errors');

module.exports = {
  /**
   * Find a nodetype in datamodel.
   * @param   {String}   nodetypeName nodetype's name or id
   * @returns {Nodetype} Found nodetype
   */
  getNodetype: (nodetypeName) => {
    if (nodetypeName === null || nodetypeName === 'Ganister') return;

    const nodetypeDM = global.datamodel.nodetypeDefinitions.find((nodetypeDefinition) => {
      const { id, name } = nodetypeDefinition;

      if (nodetypeName === id) return true;
      if (nodetypeName === name) return true;
    });

    if (!nodetypeDM) {
      throw ganisterError(`'${nodetypeName}' not found in datamodel.`, 404);
    }

    return nodetypeDM;
  },

  /**
   * Get nodetypes from datamodel
   * @param   {String[]}   nodetypeNames nodetypes' names or ids
   * @returns {Nodetype[]} Found nodetypes
   */
  getNodetypes: (nodetypeNames) => {
    if (nodetypeNames.includes(null)) return [];

    const nodetypesDM = global.datamodel.nodetypeDefinitions.filter((nodetype) => {
      const { id, name } = nodetype;

      if (nodetypeNames.includes(id)) return true;
      if (nodetypeNames.includes(name)) return true;
    });

    const lengthDifference = nodetypeNames.length > nodetypesDM.length;
    if (lengthDifference) {
      const nodetypesNames = nodetypeNames
        .filter((nodetype) => {
          const found = nodetypesDM.find((n) => {
            if (nodetype === n.id) return true;
            if (nodetype === n.name) return true;
          });
          return !found;
        })
        .map((n) => `'${n}'`)
        .join(', ');
      const message = `Following nodetype(s) not found in datamodel: ${nodetypesNames}.`;
      throw ganisterError(message, 404);
    }

    return nodetypesDM;
  },

  /**
   * Returns whether a nodetype is in datamodel or not.
   * @param   {String}  name nodetype's name or id
   * @returns {Boolean} true if nodetype is in datamodel, otherwise false
   */
  isInDatamodel: (name) => {
    try {
      const nodetype = module.exports.getNodetype(name);
      return !!nodetype;
    } catch (e) {
      return false;
    }
  },
};
