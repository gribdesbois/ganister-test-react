# Exposed Methods (PLM)

In Method Editor you can call the following functions:






## PLM.runQuery (query, params)

Run custom cypher query

| Parameter | Type   | Description             |
| --------- | ------ | ----------------------- |
| query     | String | Cypher Query            |
| params    | Object | Query Params (optional) |

### Examples

**Update all part nodes**

```js

try {
  PLM.runQuery ('MATCH (p:Part) SET p.customField = 1')
} catch (error) {
  throw error;
}
```

**Update a part node**
```js

try {
  PLM.runQuery ('MATCH (p:Part { _id: $_id }) SET p.customField = 1', { _id: '0744a880-3d79-11ec-ae1d-8b5ef985d716'})
} catch (error) {
  throw error;
}
```





## PLM.setNodeLifecycleRole (node, user, role)

Set User's Lifecycle Role on a node

| Parameter | Type   | Description               |
| --------- | ------ | -----------------------   |
| node      | Object | Node from 'data' argument |
| user      | Object | User to assign role to    |
| role      | String | Lifecycle Role name       |

### Examples

**Set Node Creator As User**

```javascript

try {
  const node = data;
  const user = node.user;
  const role = 'user';

  await PLM.setNodeLifecycleRole(node, user, role);
} catch (error) {
  return error;
}

```

[^Change Role]: Change role variable to any role, for example manager to set node creator as Manager*





## PLM.getNodetype (nodetypeName)

Get Nodetype Definition from datamodel

| Parameter    | Type   | Description   |
| ------------ | ------ | ------------- |
| nodetypeName | String | Nodetype Name |



### Examples

**Get Part Nodetype Definition**

```javascript
const partDM = PLM.getNodetype('part');
```



<!-- 
## PLM.getNode (user, nodetypeName, nodeId)

Get Node object from database

| Parameter    | Type   | Description   |
| ------------ | ------ | ------------- |
| user         | Object | User Object   |
| nodetypeName | String | Nodetype Name |
| nodeId       | String | Node Id       |



### Examples

**Get a specific Part node**

```javascript
const user = context.user;
const nodetypeName = context.node._type;
const nodeId = context.node._id;

const part = PLM.getNode(user, nodetypeName, nodeId);
``` -->





## PLM.updateOldVersionsState  (node, state)

Update revised nodes state of a node

| Parameter  | Type   | Description     |
| ---------- | ------ | --------------- |
| node       | Object | Node Object     |
| state      | String | Lifecycle State |

### Examples

**Supersed Old Versions**

```js

try {
  const node = data;

  await PLM.updateOldVersionState(node, 'superseded')
} catch (error) {
  throw error;
}

```



## PLM.getTeamRolePerson (node, role)

Returns the user or array of users who has a specific role on a node

| Parameter | Type   | Description                       |
| --------- | ------ | --------------------------------- |
| node      | Object | Node to get team role person from |
| role      | String | Role of the user in the team      |


## PLM.uploadFile (file, fileDetails)

Upload a file

| Parameter   | Type   | Description                                 |
| ---------   | ------ | ------------------------------------------- |
| file        | Stream | File stream                                 |
| fileDetails | Object | File details: filename, encoding, mimetype. |

### Examples

**Upload a file to S3 bucket or to 'assets' folder**

```javascript

const fs = require('fs');

try {
  const fileNode = data;
  const { filename } = fileNode.properties;

  const file = fs.createReadStream(`assets/${filename}`);

  await PLM.uploadFile(file, fileNode.properties);
} catch (error) {
  throw error;
}

```

## PLM.uploadFileToCADExchanger (user, file)

Upload a file to CAD Exchanger

| Parameter | Type   | Description      |
| --------- | ------ | ---------------- |
| user      | Object | User             |
| file      | Object | File Node Object |

### Examples

**Upload supported file to the CAD Exchanger cloud**

```javascript

try {
  const file = data;

  // Check if file extension is supported
  const fileExt = file.properties.name.split('.').pop().toLowerCase();
  const isValid = PLM.checkCADFileExt(fileExt);
  if (!isValid) throw new Error('Invalid file extension');

  const result = PLM.uploadFileToCADExchanger(user, file);
  file.properties.generated = result.data;
} catch (error) {
  throw error;
}

```





## PLM.updateAssignmentDates (node)

Update Assignment Duration and Dates based on the Predecessor nodes

| Parameter | Type   | Description      |
| --------- | ------ | ---------------- |
| node      | Object | Node Object      |



### Examples

**Update Assignment Duration and Dates based on the Predecessor nodes**

```javascript

try {
  const node = data;

  if (node._type === 'assignment') {
    throw new Error('Invalid nodetype')
  }

  await PLM.updateAssignmentDates(node);
} catch (error) {
  return error;
}


```



## PLM.checkCADFileExt (ext)

*Checks if file extension (ext) can be uploaded in CAD Exchanger.*

| Parameter | Type   | Description    |
| --------- | ------ | -------------- |
| ext       | String | File extension |


Returns Boolean