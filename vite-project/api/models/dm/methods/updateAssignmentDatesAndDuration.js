
module.exports = {
  id: 'method_36f68110-3921-11ea-b529-fbec371b5102',
  package: 'core',
  name: 'updateAssignmentDatesAndDuration',
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

  Method name : updateAssignmentDatesAndDuration
  Created On  : 07-12-2021 (1626077838167)
  Created by  : Claire Stajol
  Description : 
  ---------------------------------------------------------------------------------------------------
*/

try {
  const node = data;
  const { _type, user } = node;
  
  if (_type !== 'assignment') return;

  await PLM.updateAssignmentDates(node);
} catch (error) {
  throw error;
} 
  `,
  createdOn: 1579262540700,
  createdBy: {
    id: '92cf7a40-3d57-11e8-b32b-d98fe87b58e7',
    name: 'Tziortzis Kyprianou',
  },
  updatedOn: 1626104522891,
  updatedBy: {
    id: '5c1e6650-654f-11eb-a2e5-fd01fad4824a',
    name: 'undefined',
  },
}