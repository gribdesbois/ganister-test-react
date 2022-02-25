const fs = require('fs');
const datamodelMethods = require('../api/middlewares/datamodelMethods');

const coreDmFile = './build/ganisterDatamodel.json';
const customDmFile = './build/datamodel.json';
const checkDmFile = './test/assets/5-check.json';
let coreDm = {};
let customDm = {};
fs.readFile(coreDmFile, { encoding: 'utf8' }, (err, data) => {
  if (err) throw err;
  coreDm = JSON.parse(data);
  console.info('TCL: devDm count', coreDm.nodetypeDefinitions.length);
  console.info('SOURCE FILE OK');
  fs.readFile(customDmFile, { encoding: 'utf8' }, (err2, data2) => {
    if (err2) throw err2;
    customDm = JSON.parse(data2);
    console.info('TCL: nuancesDm count', customDm.nodetypeDefinitions.length);

    console.info('CUSTOM FILE OK');
    datamodelMethods.fixDatamodelIds(coreDm, customDm).then((customDmFixed) => {
      fs.writeFileSync(customDmFile, JSON.stringify(customDmFixed, null, '\t'), { encoding: 'utf8' });
      console.info('fix applied');
    });
  });
});



