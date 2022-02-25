# CLIENT CUSTOM METHODS EXECUTION

All client custom methods (triggered methods or actions) are executed from `clientMethodsService` service.  
`clientMethodsService` service is loaded in `mainNodeListing` controller and `nodeForm` controller.

<br>

### Code Execution

**`clientMethodsService[name]()` can be run:**
<!-- - for triggered methods, during `DataService` CRUD operations. They can be chained and are run in order.   -->
- for actions, in `mainNodeListing` controller during `$scope.runNodetypeAction()` execution or in `nodeForm` controller during `$scope.runNodeAction()`;

<br>

**`clientMethodsService` service loads 2 other services:**
- **$http**:  

- **Notification**:  


<br>

**Inside `clientMethodsService`, each custom method takes 3 arguments:**
- **$scope**:  
<!-- Depends on the trigger ('beforeCreate', 'afterCreate', 'beforeUpdate', etc)   -->
- **$rootScope**:  
<!-- A string representing either trigger's name for triggered methods (e.g. 'beforeDelete') or action's ID for action execution -->
- **data**:  
<!-- Params provided in G-Config. An empty object by default. -->


<br>

### Examples

<!-- Example of a triggered method before a node's update:  
_This isn't the real code, it's simplified to focus on triggered method concept._

```javascript
// api/modules/dataService/index.js

// 'this' refers to DataService module

async function save(node) {
  const context = { data: node, errors: [] };

  await CustomMethods.run(context, 'beforeUpdate', this);
  await node.save();
  await CustomMethods.run(context, 'afterUpdate', this);

  return context;
};
```

```javascript
// api/modules/customMethods/index.js

async function run(context, trigger, DataService) {
  const { data } = context;

  const dataMethods = getCustomMethods(data, trigger);
  const { customMethods, exposedMethods } = requireMethods();
  const PLM = exposedMethods(DataService);

  for (const method of dataMethods) {
    const { name, params = {} } = method;
    const customMethod = customMethods[name];

    await customMethod(data, trigger, params, PLM, DataService);
  }

  return context;
};
```

<br>

Example of a node's action execution:  
_This isn't the real code, it's simplified to focus on action concept._

```javascript
// api/modules/dataService/index.js

// 'this' refers to DataService module

async function runAction(node, actionId) {
  const context = { data: node };

  await CustomMethods.run(context, actionId, this);

  return context;
};
```

```javascript
// api/modules/customMethods/index.js

async function run(context, trigger, DataService) {
  const { data } = context;

  const dataMethods = getCustomMethods(data, trigger);
  const { customMethods, exposedMethods } = requireMethods();
  const PLM = exposedMethods(DataService);

  for (const method of dataMethods) {
    const { name, params = {} } = method;
    const customMethod = customMethods[name];

    await customMethod(data, trigger, params, PLM, DataService);
  }

  return context;
};
``` -->
