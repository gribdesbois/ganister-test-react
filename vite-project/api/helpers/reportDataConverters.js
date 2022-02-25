const _ = require('lodash');

module.exports = {
  'ganister-state': (value, options) => {
    // retrieve nodetype
    try {
      const ntName = options.nodetype;
      // retrieve
      if (!ntName) return value;
      const nodetypeDef = _.find(global.datamodel.nodetypeDefinitions, { name: ntName });
      if (!nodetypeDef) return value;
      const state = _.find(nodetypeDef.lifecycle.states, { name: value });
      if (!state) return value;
      return state.label;
    } catch (error) {
      console.error('ganister-state-error', error);
      return value;
    }
  },
  'ganister-lov': (value, options) => {
    if (!value) return '';
    // retrieve nodetype
    try {
      const { lovName } = options;
      // retrieve
      if (!lovName) return value;
      const lovRef = _.find(global.datamodel.listOfValues, { name: lovName });
      if (!lovRef) return value;
      const lovResult = _.find(lovRef.items, { value });
      if (lovResult) return lovResult.label;
      return value;
    } catch (error) {
      console.error('ganister-lov-error', error);
      return value;
    }
  },
};