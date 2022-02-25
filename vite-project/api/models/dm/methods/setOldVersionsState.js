
module.exports = {
  id: 'method_1f8a2900-e302-11eb-9beb-d9c50b47a41d',
  package: 'core',
  name: 'setOldVersionsState',
  serverOrClient: 'server',
  code: `/*
  This function is async and has the following arguments:
  {
    data: {},
    trigger: '',
    params: {},
    PLM: module,
    DataService: class,
  }

  'data' content depends on selected trigger (see documentation http://localhost:8008/help/tech/)
  If all the triggered process had to fail if this method's execution fails, throw error, else return it.

  Method name : setOldVersionsState
  Created On  : 07-12-2021 (1626088382346)
  Created by  : Claire Stajol
  Description : 
  ---------------------------------------------------------------------------------------------------
*/

try {
  const node = data;
  const { state } = params;
  
  const { lifecycle = {} } = node.datamodel;
  const lifecycleState = lifecycle.states.find((s) => s.name === state);
  if (!lifecycleState) {
    throw ganisterError(\`State '\${state}' not found for '\${node._type}' nodes\`);
  }
  
  const { _releasedOn } = node.properties;
  if (!_releasedOn) {
    throw ganisterError('Node not in a released state');
  }
  
  await PLM.updateOldVersionsState(node, state);
} catch (error) {
  return error;
}
`,
  createdOn: 1626088382346,
  createdBy: {
    id: '5c1e6650-654f-11eb-a2e5-fd01fad4824a',
    name: 'undefined',
  },
  updatedOn: 1626104539686,
  updatedBy: {
    id: '5c1e6650-654f-11eb-a2e5-fd01fad4824a',
    name: 'undefined',
  },
}