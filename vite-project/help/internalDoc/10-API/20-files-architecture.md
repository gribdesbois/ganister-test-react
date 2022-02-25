# FILES AND FOLDERS

This page describes how folders (in pink and blue) and `files` are organized and used in Ganister.

## MODELS

### DM (Datamodel)

> ### Nodetypes
> Contains JSON files for each node and relationship in datamodel.
> ### Methods
> Contains JS files exporting an object with custom method's code and infos.
> ### Reports

> #### Other files

### Schemas
Contains JSON schemas for each node and relationship in datamodel.  
These schemas are generated on server launch from the Gulpfile.


## CLASSES
Classes are the only modules to communicate with database.  
They are required in `DataService`, which is required in controllers, middlewares and other classes.  
They can't be required from utils and helpers files (circular dependencies risks).  
_Requires classes directly in controllers and middlewares isn't a good practice in this code architecture since classes doesn't handle custom methods triggers._

- **`node.js`**  
  This class handles object logic for nodes.  
  It contains CRUD methods, getters/setters and nodes specific functions.  
  ##### _CRUD operations_
  * Create a node instance: `Node.new()`
  * Find a node: `Node.find()`
  * Save a node in database (creation or update): `node.save()`
  * Delete a node: `node.delete()`
  * Find nodes: `Node.all()`  
  ##### _Getters and setters_
  * Get node's datamodel: `node.datamodel`
  * Set current node's user: `node.user()`
  * Set node's lock state: `node.lockedBy()`  
<br>

- **`relationship.js`**  
  This class handles object logic for relationships.  
  It contains CRUD methods, getters/setters and relationships specific functions.

  Relationship has dependency on `Node` class because an instance of `Relationship` needs two nodes to exist, called *source* and *target*.  
  _source_ and _target_ should always refer to a `Node` instance.
  ##### _CRUD operations_
  * Create a relationship instance: `Relationship.new()`
  * Find a relationship: `Relationship.find()`
  * Save a relationship (creation or relationship's **properties** update): `relationship.save()`
  * Delete a relationship: `relationship.delete()`
  * Find relationships: `Relationship.all()`
  ##### _Getters and setters_
  * Get relationship's datamodel: `relationship.datamodel`
  * Set current relationship's user: `relationship.user()`

## MODULES
### DataService
Requires `Node` and `Relationship` classes and `CustomMethods` module.  
DataService is used to solve circular dependencies between `Node`/`Relationship` and `CustomMethods`.  

This module is required by controllers and middlewares, so custom methods can be triggered before or after `Node`/`Relationship` functions execution.  
**It means that `Node` or `Relationship` classes shouldn't been directly required from other files.**
##### _CRUD operations_
- Create a node/relationship: `DataService.new()`
- Find a node/relationship: `DataService.find()`  
-> _handles **'beforeGet'** and **'afterGet'** triggers_
- Save a node/relationship: `DataService.save()`  
-> _handles **'beforeCreate'** and **'afterCreate'** triggers on first save, **'beforeUpdate'** and **'afterUpdate'** triggers on next saves_
- Delete a node/relationship: `DataService.delete()`  
-> _handles **'beforeDelete'** and **'afterDelete'** triggers_
- Find nodes/relationships = `DataService.all()`  
-> _handles **'afterGetAll'** triggers_  
##### _Custom Methods functions_
- Run an action: `DataService.runAction()` 

### Custom Methods
- Generate `customMethods.js` file on server launch and run triggered methods / actions.  
- `customMethods.run()` needs DataService module as a dependency injection to avoid circular dependencies between these two modules.  
- In `customMethods.run()` function, when running each custom method, exposedMethods module is needed as a dependency injection too.

#### Other files
- **`database.js`**
  * Requires Neo4j driver from config file.  
  * Escape risky characters from query's params before sending then to database.  
  * Collect records from database calls and format them (format JSON properties, remove sensitive user data, etc)
- **`exposedMethods.js`**
  * `ExposedMethods` module is used as a dependency injection when running a custom method.  
  * In custom method editor (G-Config), this module is available as 'PLM' (e.g. `PLM.setNodeAccessRole()`)


## QUERIES
All cypher queries should be written in `queries` folder.
It contains only the queries and params, the database is never called from these files.  
These file are mostly required from `Node` and `Relationship` classes.

### Nodes
 Contains all queries related to node(s) operations.  
_They are called from the `Node` class exclusively._

### Relationships
 Contains all queries related to relationship(s) operations.  
_They are called from the `Relationship` class exclusively._

#### Other files

- **`global.js`**  
  * Contains global queries and can be called from files like utils, middlewares, etc.


## ROUTES

Routes respects REST API endpoints standards.  
_For API endpoints documentation, see [swagger API documentation](http://localhost:8008/api-docs)_

- **`nodes.js`**
  * As every nodetype of type 'node' are handled by the class `Node`, 'user', 'Group', 'PermissionSet', etc are also handled within this routes.
- **`relationships.js`**
  * As every nodetype of type 'relationship' are handled by the class `Relationship`, 'accessRole', 'lifecycleRole', 'handlesChangeOf', etc are be handled within this routes.
  _Note about relationships: because a Relationship instance makes sense only between two nodes, the API endpoint `PATCH nodes/:nodetype/:nodeId/relationships/:relationshipName/:relationshipId` will update relationship's **properties** only._  
  _Modify a relationship's source or target actually means to delete the previous relationship and to create a new one._

## MIDDLEWARES

- **`passport.js`**
  * Handles authentication logic (login and API Key token)
- **`licence.js`**
  * Checks customer's licence
- **`accesses.js`**
  * Checks user's accesses to node(s) and/or relationship(s)
  * When needed, checks if user is admin
- **`params.js`**
  * Checks and cleans request params
- **`nodes.js`**
  * Get node and attach it to the request
  * Where needed, check node properties
  * Database calls are always handled by `DataService` module, which is required. No need to require/use `Node` class.
- **`relationships.js`**
  * Get relationship and attach it to the request
  * Where needed, check relationship properties / related nodes properties
  * Database calls are always handled by `DataService` module, which is required. No need to require/use `Relationship` class.
- **`deprecated.js`**
  * Format deprecated routes params so 'Request' object fits new controller's functions

## CONTROLLERS

- **`nodes.js`**
  * Nodes CRUD operations and nodes related functions
  * Database calls are always handled by `DataService` module, which is required. No need to require/use `Node` class.
- **`relationships.js`**
  * Relationships CRUD operations
  * Database calls are always handled by `DataService` module, which is required. No need to require/use `Relationship` class.
- **`deprecated.js`**
  * Contains only functions that still call `plmStandardCypher.js` file
  * Need to be refactored or deleted later

## UTILS

_Utils functions can be called from any file except Database module. `Node` or `Relationship` classes can't be required in this file (circular dependencies)_

- **`nodetypes.js`**
  * Functions related to both relationships and nodes properties
- **`nodes.js`**
  * Build and validate node format (validate schema)
  * Specific functions related to nodes properties
- **`relationships.js`**
  * Build and validate relationship format (validate schema)

## HELPERS

_Helpers functions can be called from any file. Internal modules can't be required from helpers files (circular dependencies)_

### Primitives
Helps to manipulate JS primitives and objects

### Database
- **`queries.js`**
  * Helps to build cypher queries
- **`records.js`**
  * Helps to handle result records

#### Other files

- **`nodetype.js`**
  * Short functions often used in other files. Usable on both nodes and relationships.
- **`node.js`**
  * Short functions related to nodes often used in other files
- **`relationship.js`**
  * Short functions related to relationships often used in other files
