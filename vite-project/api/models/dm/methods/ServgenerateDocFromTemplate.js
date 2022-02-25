
module.exports = {
  id: 'method_ce6816d0-7b6a-11eb-91c8-bb5a38cd2aca',
  package: 'core',
  name: 'ServgenerateDocFromTemplate',
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

  Method name : ServGenerateDocFromTemplate
  Created On  : 07-12-2021 (1626077838167)
  Created by  : undefined
  Description : 
  ---------------------------------------------------------------------------------------------------
*/

try {
  const node = data;
  const { _id, user } = node;
  
  const query = \`
  	MATCH (n: { _id: $_id })-[]->(f:file)
    RETURN f
  \`;
  const params = { _id };
  
  const [record] = await PLM.runQuery(query, params);
  const field = record?.get('f');
  if (!field) return;
  
  const { sourceKey } = field.properties;
  await PLM.duplicateFile(sourceKey);
  
  const file = await DataService.new('Node', field);
  await file.save();
  
  const documentParams = {
    _type: 'document',
    properties: {
      name: node.properties?.name,
    },
    user,
  };
  const document = await DataService.new('Node', documentParams);
  await document.save();
  
  const relationshipParams = {
    _type: 'relatedFiles',
    properties: {
      
    },
    source: document,
    target: file,
    user,
  };
  const relationship = await DataService.new('Relationship', relationshipParams);
  await relationship.save();
  
  return node;
} catch (error) {
  throw error;
}
`,
  createdOn: 1614698422456,
  createdBy: {
    id: 'a99cf630-654f-11eb-a2e5-fd01fad4824a',
    name: 'Miche Dubois',
  },
  updatedOn: 1634118753804,
  updatedBy: {
    id: '5c1e6650-654f-11eb-a2e5-fd01fad4824a',
    name: 'undefined',
  },
}