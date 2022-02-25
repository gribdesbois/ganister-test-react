module.exports = {
  // do not change custom method's indentation
  method: {
    id: 'method_c71ce8b0-37aa-11ea-8188-63be1e020a5b',
    package: 'core',
    name: 'modifyNodeByCustomMethod',
    serverOrClient: 'server',
    code: `/*
  Async function with following arguments:
    {
      data: {}
      trigger: '',
      params: {},
      DataService: class,
    }

  'data' content depends on selected trigger (see documentation http://localhost:8008/help/tech/)
  If the triggered process had to fail on method fail, throw error, else return it.

  Method name : modifyNodeByCustomMethod
  Created On  : 07-12-2021 (1626077838167)
  Created by  : Manager1 LastName1
  Description :
  ---------------------------------------------------------------------------------------------------
*/

const unsavedTriggers = ['beforeGet', 'beforeDelete', 'afterDelete'];

try {
  const node = data;
  const { paramsKey } = params;
  
  if (!node.properties) node.properties = {};

  if (unsavedTriggers.includes(trigger)) throw new Error(trigger);

  let key; 
  if (trigger.startsWith('action_')) {
    key = 'customProperty';
  } else {
    key = trigger.includes('before') ? 'name' : 'description';
  }

  const value = paramsKey || 'Random value';
  node.properties[key] = \`[\${trigger}] - \${value}\`;

  return node;
} catch (error) {
  if (unsavedTriggers.includes(trigger)) {
    return error;
  }
  throw error;
}`,
    createdOn: Date.now(),
    createdBy: { id: 'api', name: 'api' },
  },
};
