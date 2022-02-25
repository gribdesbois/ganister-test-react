const fs = require('fs');
const datamodelMethods = require('../api/middlewares/datamodelMethods');

const coreDmFile = './build/ganisterDatamodel.json';
const customDmFile = './build/datamodel.json';
const patchDmFile = './test/assets/3-patch.json';
const patchedDmFile = './test/assets/4-patched.json';
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
    datamodelMethods.deepDiffObjects(coreDm, customDm).then((diffDm) => {
      console.info('PATCH CREATED');
      // CREATE THE PATCH
      fs.writeFileSync(patchDmFile, JSON.stringify(diffDm, null, '\t'), { encoding: 'utf8' });
      console.info('PATCH SAVED');
      datamodelMethods.deepPatchObjects(coreDm, diffDm).then((resultDm) => {
        console.info('PATCH APPLIED');
        // APPLY THE PATCH
        fs.writeFileSync(patchedDmFile, JSON.stringify(resultDm, null, '\t'), { encoding: 'utf8' });
        console.info('NEW CUSTOM DM SAVED');
        datamodelMethods.deepDiffObjects(customDm, resultDm).then((diffDm2) => {
          console.info('NEW DIFF PROCESSED');

          fs.writeFileSync(checkDmFile, JSON.stringify(diffDm2, null, '\t'), { encoding: 'utf8' });
          console.info('NEW DIFF SAVED');
        });
      })
    });
  });
});



