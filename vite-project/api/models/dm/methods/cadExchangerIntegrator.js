
module.exports = {
  id: 'method_c71ce8b0-37aa-11ea-8188-63be1e020a5b',
  package: 'core',
  name: 'cadExchangerIntegrator',
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

  Method name : cadExchangerItegrator
  Created On  : 07-12-2021 (1626077838167)
  Created by  : undefined
  Description : 
  ---------------------------------------------------------------------------------------------------
*/

try {
  const node = data;
  const { filename, name } = node.properties;
  
  const fileName = filename || name;
  if (!fileName) return;
  
  //  Check if file extension is supported
  const fileExt = fileName.split('.').pop().toLowerCase();
  const isValid = PLM.checkCADFileExt(fileExt);
  if (!isValid) return;
  
  const result = await PLM.uploadFileToCADExchanger(node.user, node.properties)
  node.properties.generated = result.data;
  
  return node;
} catch (error) {
  throw error;
}

  `,
  createdOn: undefined,
  createdBy: {
    id: 'undefined',
    name: 'undefined',
  },
  updatedOn: 1626105225521,
  updatedBy: {
    id: '5c1e6650-654f-11eb-a2e5-fd01fad4824a',
    name: 'undefined',
  },
}