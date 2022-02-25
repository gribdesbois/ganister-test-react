
module.exports = {
  id: 'method_78bc1cc0-08bc-11eb-9152-596414692613',
  package: 'purchasing',
  name: 'addIhsPartServer',
  serverOrClient: 'server',
  code: `// this method is a promise, you need to return resolve or reject with the context object
// the context object is provided as an input.
// context input depends on the selected trigger (see documentation http://localhost:8008/help/tech/)
// Method name : addIhsPartServer
// Created On  : 10-07-2020 (1602089113734)
// Created by  : Yoann Maingon
// Description : 
// ---------------------------------------------------------------------------------------------------
const { node, nodetype, user, data:part } = context;
const manufacturerName = part['mfr-name'];
const manufacturerPartNumber = part['manufacturer-part-number'];
PLM.runQuery(\`MATCH (m:supplier) WHERE m.name = "\${manufacturerName}" RETURN m LIMIT 1\`).then(({ data }) => {
  const exists = !_.isEmpty(data);
  if (!exists) {
    PLM.addNode(user, 'supplier', { name: manufacturerName }, false, false, false).then(({ data }) => {
      console.log('************ ADD NODE SUPPLIER RES ************');
      const supplier = _.get(data, 'node.0');
      PLM.addNode(user, 'supplierPart', { _ref: manufacturerPartNumber }, false, false, false).then(({ data }) => {
        console.log('************ ADD NODE SUPPLIERPART RES ************');
        const supplierPart = _.get(data, 'node.0');
        PLM.updateNodeValue(user, 'supplierPart', supplierPart._id, 'supplier', supplier._id).then(({ data }) => {
          console.log('************ UPDATE NODE SUPPLIERPART RES ************');
          const updatedSupplierPart = data;
          console.log(data);
          PLM.addRelationship(user, nodetype.name, node._id, 'hasSupplierPart', 'supplierPart', updatedSupplierPart._id).then(({ data }) => {
            console.log('************ ADD RELATIONSHIP RES ************');
            console.log(data);
            resolve(context);
          });
        });
      });
    });
  } else {
    const supplier = _.get(data[0], '_fields.0.properties');
    PLM.addNode(user, 'supplierPart', { _ref: manufacturerPartNumber }, false, false, false).then(({ data }) => {
      const supplierPart = _.get(data, 'node.0');
      PLM.updateNodeValue(user, 'supplierPart', supplierPart._id, 'supplier', supplier._id).then(({ data }) => {
          console.log('************ UPDATE NODE SUPPLIERPART RES ************');
          const updatedSupplierPart = data;
          console.log(data);
          PLM.addRelationship(user, nodetype.name, node._id, 'hasSupplierPart', 'supplierPart', updatedSupplierPart._id).then(({ data }) => {
            console.log('************ ADD RELATIONSHIP RES ************');
            console.log(data);
            resolve(context);
          });
        });
    });
  }
});`,
  createdOn: 1602089113734,
  createdBy: {
    id: 'ea6b17e0-3b9e-11ea-b206-e7610aa23593',
    name: 'Yoann Maingon',
  },
  updatedOn: 1602089304428,
  updatedBy: {
    id: 'ea6b17e0-3b9e-11ea-b206-e7610aa23593',
    name: 'Yoann Maingon',
  },
}