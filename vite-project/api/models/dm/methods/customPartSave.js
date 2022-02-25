
module.exports = {
  id: 'method_2e88e1c0-325e-11ec-950b-6386971debe5',
  package: 'core',
  name: 'customPartSave',
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

  If the triggered process had to fail if this method's execution fails, the error has to be thrown.
  If the triggered process should continue even if this method's execution fail, the error has to be simply returned.
  ganisterError(string, statusCode) function should be used instead of Error object, as it can have a statusCode as a second argument.

  Method name : returnData
  Created On  : 10-21-2021 (1634814063061)
  Created by  : undefined
  Description : 
  ---------------------------------------------------------------------------------------------------
*/

try {
  const { _type, user } = data;
  const { _ref } = data.clientMethodData?.preFields || {};
  
  const node = await DataService.new({ _type, properties: { _ref }, user });
  await DataService.save(node);
  
  data.clientMethodData = { node };
  
} catch (error) {
  console.error(error)
  return error;
}
`,
  createdOn: 1634814063061,
  createdBy: {
    id: '5c1e6650-654f-11eb-a2e5-fd01fad4824a',
    name: 'Claire Stajol',
  },
  updatedOn: 1634818272864,
  updatedBy: {
    id: '5c1e6650-654f-11eb-a2e5-fd01fad4824a',
    name: 'undefined',
  },
}