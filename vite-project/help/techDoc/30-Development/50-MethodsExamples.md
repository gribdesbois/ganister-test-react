# Custom Methods Examples

Here are examples of handy methods that can be directly used.  
The ``<variable>``s should be replaced.  
The way to handle errors are examples, it can be changed to suit needs.  


## Set a node lifecycle role user

This method can be used to set a user to a node lifecycle role after its creation.

```javascript
// arguments = (data, params, trigger, DataService, PLM)

try {
  const node = data;
  const { user } = node;

  await PLM.setNodeLifecycleRole(node, user, '<role>'); // replace '<role>'
} catch (error) {
  // the error is returned because the node creation shouldn't be
  // cancelled event if the lifecycle role isn't set
  return error;
}
```

## Check if a property of type node exists

This method can be used to check if at least one property of type node is set before a node's promotion or update.

```javascript
// arguments = (data, params, trigger, DataService, PLM)

try {
  const node = data;
  const nodetypeDM = PLM.getNodetype(node._type); // OR const nodetypeDM = node.datamodel
  const propertiesOfTypeNode = nodetypeDM.properties
    .filter((p) => p.type === 'node')
    .map((p) => p.name)
  
  const missingProperties = [];
  
  for (const property of propertiesOfTypeNode) {
    if (!node.properties[property]) {
      missingProperties.push(property);
    }
  }
  
  if (missingProperties.length) {
    const errorMessage = `The following properties are missing: ${missingProperties.join(', ')}`;
    throw ganisterError(errorMessage, 422);
  }
} catch (error) {
  // the error is thrown because the update should be cancelled if a property is missing
  throw error;
}
```

## Check if a node's relationship exists

This method can be used to check if at least one relationship is set before a node's promotion or update.

```javascript
// arguments = (data, params, trigger, DataService, PLM)

try {
  const node = data;
  const { user } = node;

  const result = await DataService.all('<relationshipName>', { node, user }); // replace '<relationshipName>'
  const relationships = result.data;
  
  if (!relationships.length) {
    const errorMessage = `The following relationship is missing: '<relationshipName>'`;
    throw ganisterError(errorMessage, 422);
  }
} catch (error) {
  // the error is thrown because the update should be cancelled if a property is missing
  throw error;
}
```

## Calculate a relationship property

This method can be used to (re)calculate a relationship property during node update.

```javascript
// arguments = (data, params, trigger, DataService, PLM)

try {
  const node = data;
  const { user } = node;

  await PLM.runQuery(
    `MATCH (n:${node._type} { _id: $_id })-[r:<linkName>]-()
     SET r.<property> = r.<property> + n.<property>`,
    { _id: node._id }
  ); // replace <linkName> and <property> variables

} catch (error) {
  // the error is returned because the node update shouldn't be
  // cancelled if the relationship doesn't exist
  return error;
}
```

## Create a node and a relationship

This method can be used to create another node and a relationship after a node creation.

```javascript
// arguments = (data, params, trigger, DataService, PLM)

try {
  const node = data;
  const { user } = node;

  const newNode = await DataService.new({
    _type: '<nodetypeName>',
    properties: {
      // ...properties
    },
  });
  await newNode.save();

  const relationship = await DataService.new({
    _type: '<relationshipName>',
    properties: {
      // ...properties
    },
    source: node,
    target: newNode,
  });
  await relationship.save();

} catch (error) {
  // the error is returned because the node is already created in database
  // so the user can create the other node and relationship in app if it fails
  return error;
}
```


