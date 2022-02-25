# Triggers and Context detail

## Generic Context items

### Method Arguments

Each method provides the following arguments:

- data: the object the method is executed on. Its value depends on context (see beelow)
- trigger: name of the action that triggers method execution
- params: any additional parameters set in G-Config
- PLM: module of utilities functions (see [ExposedMethods](./30-ExposedMethods.md))
- DataService: module of functions to create new nodes/relationships (see DataService)

#### Example

```js
const arguments = {
    data: {
        _type: 'part',
        _id: '0744a880-3d79-11ec-ae1d-8b5ef985d716',
        properties: {}
    },
    trigger: 'beforeCreate',
    params: {},
    PLM: {},
    DataService: {},
};
```

### Method Result

A feedback about the method execution is highly recommended:
- if execution succeeds: there's nothing else to do, method doesn't need to return anything.  
- if execution fails **but** it shouldn't stop the ongoing process: the error should be returned.  
- if execution fails **and** it should stop the ongoing process: the error should be thrown.  

#### Example
The ongoing process should fail if method fails:
```js
try {
    await PLM.setLifecycleRole(data, 'manager');
    // method doesn't return anything if it succeeds
} catch (error) {
    throw error;
}
```

The ongoing process should continue even if the method fails:
```js
try {
    await PLM.setLifecycleRole(data, 'manager');
    // method doesn't return anything if it succeeds
} catch (error) {
    return error;
}
```

## Triggers
### Get Nodes

#### After

After getting nodes, the 'data' argument is the **array of nodes** found in database.

```json
arguments: {
    trigger: 'afterGetAll',
    data: [
        {
            _type: nodetype,
            _id: nodeId,
            properties: {}
        },
    ],
    ...
}
```





### Get Node

#### After

After getting a node, the 'data' argument is the **node** found in database.

```json
arguments: {
    trigger: 'afterGet',
    data: {
        _type: nodetype,
        _id: nodeId,
        properties: {},
        user
    },
    ...
}
```





### Node Creation

#### Before

Before the node creation, the 'data' argument is the **new node** with its **mandatory** fields only.

```json
arguments: {
    trigger: 'beforeCreate',
    data: { 
        _type: nodetype,
        properties: {
            ... mandatory fields
        },
        user
    },
    ...
}
```



#### After

After the node creation, the 'data' argument is the **result from the node creation** in database.

```json
arguments: {
    trigger: 'afterCreate',
    data: {
        _type: nodetype,
        _id: nodeId,
        properties: {
            ... node's properties
        },
    },
    ...
}
```





### Node Update

#### Before

Before the node update, the 'data' argument is the **node** found in database with updated properties applied.

```json
arguments: {
    trigger: 'beforeUpdate',
    data: {
        _type: nodetype,
        _id: nodeId,
        properties: {
            ... updated properties
        },
        user
    },
    ...
}
```



#### After

After the node update, the 'data' argument is the **result** of the node update in database.

```json
arguments: {
    trigger: 'afterUpdate',
    data: {
        _type: nodetype,
        _id: nodeId,
        properties: {
            ... node's properties
        },
        user
    },
    ...
}
```




### Node Deletion

#### Before

Before node deletion, the 'data' argument is the **node** as found in database.

```json
arguments: {
    trigger: 'beforeDelete',
    data: {
        _type: nodetype,
        _id: nodeId,
        properties: {
            ... node's properties
        },
        user
    },
    ...
}
```

#### After

After the node deletion, the 'data' argument is the **node**'s type and id, with a successfull message.

```json
arguments: {
    trigger: 'afterDelete',
    node: {
        _type: nodetype,
        _id: nodeId,
        message: 'Successfully deleted.'
    },
    ...
}
```



### Node Promotion Transition

#### Before

Before the node promotion transition, the 'data' argument is the **node** as found in database.

```json
arguments: {
    trigger: 'beforePromotion',
    data: {
        _type: nodetype,
        _id: nodeId,
        properties: {
            ... node's properties
        },
        user
    },
    ...
}
```



#### After

After the node promotion transition, the 'data' argument is the **node** as found in database.

```json
arguments: {
    trigger: 'afterPromotion',
    data: {
        _type: nodetype,
        _id: nodeId,
        properties: {
            ... node's properties
        },
        user
    },
    ...
}
```





