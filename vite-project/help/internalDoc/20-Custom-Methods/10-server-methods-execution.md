# SERVER CUSTOM METHODS EXECUTION

All server custom methods (triggered methods or actions) are executed from `CustomMethods` module.  
`CustomMethods` module is required from `DataService` module.

<br>

### Code Execution

**`CustomMethods.run()` can be run:**
- for triggered methods, during `DataService` CRUD operations. They can be chained and are run in order.  
- for actions, during `DataService.runAction()` execution.

<br>

**`CustomMethods.run()` takes 3 arguments:**
- **context**:  
context is an object with 2 keys: `{ data, errors: [] }`  
`data` content depends on the trigger ('beforeCreate', 'afterCreate', 'beforeUpdate', etc)  
`errors` array contains *returned* error(s) from the previous custom method(s) execution(s)
- **trigger**:  
A string representing either trigger's name for triggered methods (e.g. 'beforeDelete') or action's ID for action execution
- **DataService**:  
Dependency injection of DataService so it's available inside the custom method

<br>

**Inside `CustomMethods.run()`, each custom method takes 5 arguments:**
- **data**:  
Depends on the trigger ('beforeCreate', 'afterCreate', 'beforeUpdate', etc)  
- **trigger**:  
A string representing either trigger's name for triggered methods (e.g. 'beforeDelete') or action's ID for action execution
- **params**:  
Params provided in G-Config. An empty object by default.
- **PLM**:  
ExposedMethods module injection, so it's available inside the custom method
- **DataService**:  
DataService module injection, so it's available inside the custom method

<br>

### Examples

Example of a triggered method before a node's update:  
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
```
