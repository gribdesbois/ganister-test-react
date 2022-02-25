
module.exports = {
  id: 'method_023bec80-2da8-11ec-814d-c78900074d18',
  package: 'core',
  name: 'getCityMeteo',
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

  Method name : getCityMeteo
  Created On  : 10-15-2021 (1634296015677)
  Created by  : undefined
  Description : 
  ---------------------------------------------------------------------------------------------------
*/
console.log('location',data.properties.location)
const superagent  = require('superagent');

try {
	superagent
      .get('https://prevision-meteo.ch/services/json/'+data.properties.location)
      .set('accept', 'json')
      .end((err, res) => {
      	console.log('res.body.current_condition',res.body.current_condition)
        if (res.body.current_condition) {
          data.properties.temperature =  res.body.current_condition.tmp.toString();
        }
        return;
      });
} catch (error) {
   	
	throw ganisterError('city not found', 404);
}
`,
  createdOn: 1634296015677,
  createdBy: {
    id: 'a99cf630-654f-11eb-a2e5-fd01fad4824a',
    name: 'Yoann Maingon',
  },
  updatedOn: 1634307331375,
  updatedBy: {
    id: '0700d950-654f-11eb-bcc0-c5cae311491a',
    name: 'undefined',
  },
}