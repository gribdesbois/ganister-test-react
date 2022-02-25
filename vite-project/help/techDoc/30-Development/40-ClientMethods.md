# Client Methods

Client methods can be used as a node/nodetype action. A client method can be set up as a **pre-client method** or **post-client method**. The action's flow is as follows:


![](assets\40-ClientMethods\client-methods.jpg)


Both methods have **$rootScope** and **$scope** variables always available. The $scope has valuable information such as the nodetype, node and more functions depending on where its used. $rootScope contains datamodel variable and more. More info about this here.

Client methods, as server methods, don't need to return anything as their goal is to manipulate $scope data.

**Example of methods during node creation**

```js
// preClientMethod.js
try {
  $scope.node.properties.name = 'customName';
} catch (error) {
  return error;
}
```

```js
// serverMethod.js
try {
  const node = data;

  console.log(node.properties.name); // expected output: 'customName'

  node.properties.description = 'custom description';
} catch (error) {
  return error;
}
```

```js
// postClientMethod.js
try {
  console.log($scope.node.properties.name); // expected output: 'customName'
  console.log($scope.node.properties.description); // expected output: 'custom description'
} catch (error) {
  return error;
}
```


## Available functions on $scope

#### Node Action Method

| Function                     | Parameters | Description                        |
| ---------------------------- | ---------- | ---------------------------------- |
| $scope.reloadNode            | -          | Reload the current node            |
| $scope.copyNodeId            | -          | Copy Node Id in clipboard          |
| $scope.getCypherQuery        | -          | Copy get cypher query in clipboard |
| $scope.toggleSerializeNode   | -          | Toggles Serialize Node value       |
| $scope.deleteNode            | -          | Opens a popup to delete the node   |
| $scope.instanciateNode       | -          | Opens a popup to instantiate node  |
| $scope.updateNode            | -          | Update Node                        |
| $scope.unlockNode            | -          | Unlocks Node                       |
| $scope.triggerNodeLockStatus | -          | Triggers Node Lock Status          |

#### Nodetype Action Method