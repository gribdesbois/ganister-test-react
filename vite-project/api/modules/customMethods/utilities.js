const { ganisterError } = require('../../utils/errors');
const { getNodetype, lastOf } = require('../../helpers');

// UTILITIES

const getTriggeredMethods = (nodetype, trigger) => {
  const { _type } = nodetype;

  const nodetypeDM = getNodetype(_type);
  if (!nodetypeDM) return [];

  const serverMethods = global.datamodel.methods
    .filter((m) => m.serverOrClient === 'server')
    .map((m) => m.name);

  const { methods = [] } = nodetypeDM;
  const triggeredMethods = methods
    .filter((m) => m.trigger === trigger)
    .filter((m) => serverMethods.includes(m.name));

  return triggeredMethods;
};

const getPromotionMethods = (nodetype, trigger) => {
  const promotion = lastOf(nodetype.properties._promotions);

  const { transitions = [], states = [] } = nodetype.datamodel.lifecycle;

  const fromState = states.find((s) => s.name === promotion.fromState);
  const toState = states.find((s) => s.name === promotion.toState);

  const transition = transitions.find((t) => {
    const sameFromId = t.from === fromState?.id;
    const sameToId = t.to === toState?.id;
    return sameFromId && sameToId;
  });
  if (!transition) {
    throw ganisterError('Transition not found.');
  }

  const beforeTrigger = trigger.includes('before');
  const preMethods = transition.server_pre || [];
  const postMethods = transition.server_post || [];

  const methods = beforeTrigger ? preMethods : postMethods;
  methods.forEach((m) => m.trigger = trigger);
  return methods;
};

const getActionMethod = (nodetype, actionId) => {
  const { _type, _id, user = {} } = nodetype;

  const nodetypeDM = getNodetype(_type);
  if (!nodetypeDM) return;

  const { actions = [] } = nodetypeDM;
  const action = actions.find((a) => a.id === actionId);
  if (!action) {
    throw ganisterError('Node action not found');
  }

  const { accessLevel, serverMethod } = action;

  const accesses = [
    'none',
    'visitor',
    'reader',
    'writer',
    'manager',
  ];
  const { highestAccess } = user;

  const accessIndex = accesses.indexOf(accessLevel);
  const userAccessIndex = accesses.indexOf(highestAccess);
  const access = accessIndex <= userAccessIndex;
  if (!access) {
    const nodeOrNodetype = _id ? 'node' : 'nodetype';
    const message = `Need required access level to run ${nodeOrNodetype} action`;
    throw ganisterError(message, 403);
  }

  return serverMethod;
};

// MODULE

module.exports = {
  requireMethods: () => {
    const customMethodsPath = '../../../build/customMethods';
    const businessMethodsPath = '../../middlewares/businessMethods';

    /* eslint-disable */
    delete require.cache[require.resolve(customMethodsPath)];
    const customMethods = require(customMethodsPath);

    delete require.cache[require.resolve(businessMethodsPath)];
    const businessMethods = require(businessMethodsPath);

    const exposedMethods = require('../exposedMethods');
    /* eslint-enable */

    return {
      customMethods,
      businessMethods,
      exposedMethods,
    };
  },

  getCustomMethods: (data, trigger) => {
    const nodetype = Array.isArray(data) ? data[0] : data;

    let methods = [];

    const actiontrigger = trigger.startsWith('action_');
    const promotionTrigger = trigger.includes('Promotion');

    if (actiontrigger) {
      const method = getActionMethod(nodetype, trigger);
      if (method) methods = [method];
    } else if (promotionTrigger) {
      methods = getPromotionMethods(nodetype, trigger);
    } else {
      methods = getTriggeredMethods(nodetype, trigger);
    }

    return methods;
  },
};
