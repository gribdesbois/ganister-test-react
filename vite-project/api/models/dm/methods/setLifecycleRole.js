
module.exports = {
  id: 'method_e36fe8f557d9664067a00348ffc76319',
  package: 'core',
  name: 'setLifecycleRole',
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

  Method name : setLifecycleRole
  Created On  : 07-12-2021 (1626077838167)
  Created by  : Claire Stajol
  Description : 
  ---------------------------------------------------------------------------------------------------
*/

try {
  const node = data;
  const { user } = node;
  const { role } = params;
  
  await PLM.setNodeLifecycleRole(node, user, role);
} catch (error) {
  throw error;
}
`,
  createdOn: undefined,
  createdBy: {
    id: 'undefined',
    name: 'undefined',
  },
  updatedOn: 1626104575178,
  updatedBy: {
    id: '5c1e6650-654f-11eb-a2e5-fd01fad4824a',
    name: 'undefined',
  },
}