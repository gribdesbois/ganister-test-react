
module.exports = {
  id: 'method_58bfc270-08bf-11eb-9898-fd8241955ec6',
  package: 'core',
  name: 'addZ2dataPartServer',
  serverOrClient: 'server',
  code: `// this method is a promise, you need to return resolve or reject with the context object
// the context object is provided as an input.
// context input depends on the selected trigger (see documentation http://localhost:8008/help/tech/)
// Method name : addIhsPartServer
// Created On  : 10-07-2020 (1602089113734)
// Created by  : Yoann Maingon
// Description : 
// --------------------------------------------------------------------------------------------------
console.log('addZ2DATAPartServer');
const node = data;
console.log(data)
const nodetype = data.datamodel;
const {user}= data;
const { clientMethodData : {partID, partLifecycle, partNumber, companyName, familyName, roHS, partDescription, productName }} = data;

// CHECK IF SUPPLIER REF ALREADY EXISTS
const supplierRefExists = await PLM.runQuery(\`MATCH (p:supplierRef) WHERE p._ref = $partNumber RETURN p LIMIT 1\`,{partNumber});
console.log('supplierRefExists',supplierRefExists);
if (supplierRefExists.length){
	const supplierRefExistsItem = supplierRefExists[0];
  	// IF SUPPLIER REF ALREADY EXISTS => create relationship from part
  	const relationship = await DataService.new({
      	_type:'partSupplierRefs',
       	source : {
        	_type: nodetype.name,
            _id:node._id,
        },
        target: {
        	_type: 'supplierRef',
            _id:supplierRefExistsItem.properties._id,
        }
      });
  	await DataService.save(relationship);
  	return data;
} else {
  
  // CHECK IF SUPPLIER EXISTS
	const supplierExists = await PLM.runQuery(\`MATCH (m:supplier) WHERE m._ref = $companyName RETURN m LIMIT 1\`,{companyName})

  	let supplierId;
  	if (!supplierExists.length) {
      // CREATE SUPPLIER
      
      newSupplier = await DataService.new({
        _type: 'supplier',
        properties : {
        _ref: companyName,
        name: companyName,
        }
      });
      await DataService.save(newSupplier);
      supplierId = newSupplier._id;
    } else {
      supplierId = supplierExists[0].get('m').properties._id;
    }
      
    // create supplier Part with rel to supplier and part from part
    const newSupplierRef = await DataService.new({
      _type: 'supplierRef',
   		properties : {
            _ref: partNumber,
          partId: partID.toString(),
          description: partDescription,
        }
    });
    await DataService.save(newSupplierRef);

  	const newPartSuppRef = await DataService.new({
      _type:'partSupplierRefs',
      source : {
        _type: nodetype.name,
        _id:node._id,
      },
      target: {
        _type: 'supplierRef',
        _id:newSupplierRef._id,
      }
    });
    await DataService.save(newPartSuppRef);

  
  	const newSupRefSup = await DataService.new({
    	_type:'supplierRefSupplier',
    	source : {
    	  _type: 'supplierRef',
    	  _id:newSupplierRef._id,
    	},
    	target: {
    	  _type: 'supplier',
    	  _id:supplierId,
    	}
    });
    
  	await DataService.save(newSupRefSup);
  
	return;
}

`,
  createdOn: 1602090348560,
  createdBy: {
    id: 'ea6b17e0-3b9e-11ea-b206-e7610aa23593',
    name: 'Yoann Maingon',
  },
  updatedOn: 1635280693748,
  updatedBy: {
    id: '0700d950-654f-11eb-bcc0-c5cae311491a',
    name: 'undefined',
  },
}