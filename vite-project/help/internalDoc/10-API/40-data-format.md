# DATA FORMAT

## API responses

API responses are sent in the following JSON format:

##### Example
```json
{
  "data": {
    "_type": "part",
    "_id": "a692fae0-b7eb-11eb-bf0b-bbefad2d127e",
    "properties": {
      "_id": "a692fae0-b7eb-11eb-bf0b-bbefad2d127e",
      "_ref": "REF0001",
      "name": "A0001",
      "_labelRef": "REF0001-A0001",
      "type": "Assembly",
      "_state": "draft",
      "_lockState": false,
      "_lockable": true,
      "_version": "4.0.0",
      "_versionedOn": 1621350830478,
      "_tracked": false,
      "_ecoHandled": null,
      "_serialized": [],
      "_createdOn": 1614200860664,
      "_createdBy": "a99cf630-654f-11eb-a2e5-fd01fad4824a",
      "_createdByName": "Michel Dubois",
      "_modifiedOn": 1629451648596,
    },
    "user": {
      "_type": "user",
      "_id": "5c1e6650-654f-11eb-a2e5-fd01fad4824a",
      "properties": {
        "_id": "5c1e6650-654f-11eb-a2e5-fd01fad4824a",
        "email": "pauline@ganister.eu",
        "name": "Claire Stajol",
        "firstName": "Claire",
        "lastName": "Stajol",
        "_labelRef": "Claire Stajol",
        "active": true,
        "_isAdmin": true,
        "TWOFA": true,
        "language": "default",
        "_state": "draft",
        "_lockState": false,
        "_lockable": true,
        "_version": "1.0.0",
        "_versionedOn": 1626179199312,
        "_tracked": false,
        "_ecoHandled": null,
        "_createdOn": 1612267708724,
        "_createdBy": "0700d950-654f-11eb-bcc0-c5cae311491a",
        "_createdByName": "Admin Istrator",
        "_modifiedOn": 1631186892802,
      },
      "hasAccess": true,
      "highestAccess": "manager"
      }
    },
  },
  "errors": [
    {
      "name": "Ganister Error",
      "message": "An error occured during custom methods execution",
      "error": true,
      "statusCode": 500
    }
  ]
}
```
<br>

In case response contains several nodes/relationships, then `"data"` is an array and current user isn't sent back:

##### Example
```json
{
  "data": [
    {
      "_type": "part",
      "_id": "a692fae0-b7eb-11eb-bf0b-bbefad2d127e",
      "properties": {
        "_id": "a692fae0-b7eb-11eb-bf0b-bbefad2d127e",
        "_ref": "REF0001",
        "name": "A0001",
        "_labelRef": "REF0001-A0001",
        "type": "Assembly",
        "_state": "draft",
        "_lockState": false,
        "_lockable": true,
        "_version": "4.0.0",
        "_versionedOn": 1621350830478,
        "_tracked": false,
        "_ecoHandled": null,
        "_serialized": [],
        "_createdOn": 1614200860664,
        "_createdBy": "a99cf630-654f-11eb-a2e5-fd01fad4824a",
        "_createdByName": "Michel Dubois",
        "_modifiedOn": 1629451648596,
      }
    },
    {
      "_type": "part",
      "_id": "a97a2e60-e895-11eb-abbb-6b7e06b89c28",
      "properties": {
        "_id": "a97a2e60-e895-11eb-abbb-6b7e06b89c28",
        "_ref": "REF0002",
        "_labelRef": "REF0002-",
        "type": "Part",
        "_state": "draft",
        "_lockState": false,
        "_lockable": true,
        "_version": "3.0.0",
        "_versionedOn": 1626701505606,
        "_tracked": false,
        "_serialized": [],
        "_createdOn": 1623141630705,
        "_createdBy": "5c1e6650-654f-11eb-a2e5-fd01fad4824a",
        "_createdByName": "Claire Stajol",
        "_modifiedOn": 1627322626528,
      },
    },
  ],
  "errors": [
    {
      "name": "Ganister Error",
      "message": "An error occured during custom methods execution",
      "error": true,
      "statusCode": 500
    }
  ]
}
```

## Javascript objects

### `Node` instance

All nodes objects are instances of the class `Node` and follow this format:
- `_type` (string)
  * nodetype's name
- `_id` (string)
  * node's ID
- `properties` (object)
  * contains properties defined in nodetype datamodel
  * `_history` and `_promotions` keys are optional, hidden by default
  * if `node._type` is 'user', sensitive data is automatically removed
- `versions` (array) - optional
  * node's versions list
  * each item contains a version number and corresponding node's ID
- `user` (object)
  * current user using this node
  * also a `Node` instance
  * sensitive data is automatically removed

##### Example
```javascript
Node {
  _type: 'part',
  _id: 'a692fae0-b7eb-11eb-bf0b-bbefad2d127e',
  properties: {
    _id: 'a692fae0-b7eb-11eb-bf0b-bbefad2d127e',
    _ref: 'REF0001',
    name: 'A0001',
    _labelRef: 'REF0001-A0001',
    type: 'Assembly',
    _state: 'draft',
    _lockState: false,
    _lockable: true,
    _version: '4.0.0',
    _versionedOn: 1621350830478,
    _tracked: false,
    _ecoHandled: null,
    _serialized: [],
    _createdOn: 1614200860664,
    _createdBy: 'a99cf630-654f-11eb-a2e5-fd01fad4824a',
    _createdByName: 'Michel Dubois',
    _modifiedOn: 1629451648596,
  },
  user: Node {
    _type: 'user',
    _id: '5c1e6650-654f-11eb-a2e5-fd01fad4824a',
    properties: {
      _id: '5c1e6650-654f-11eb-a2e5-fd01fad4824a',
      email: 'pauline@ganister.eu',
      name: 'Claire Stajol',
      firstName: 'Claire',
      lastName: 'Stajol',
      _labelRef: 'Claire Stajol',
      active: true,
      _isAdmin: true,
      TWOFA: true,
      language: 'default',
      _state: 'draft',
      _lockState: false,
      _lockable: true,
      _version: '1.0.0',
      _versionedOn: 1626179199312,
      _tracked: false,
      _ecoHandled: null,
      _createdOn: 1612267708724,
      _createdBy: '0700d950-654f-11eb-bcc0-c5cae311491a',
      _createdByName: 'Admin Istrator',
      _modifiedOn: 1631186892802,
    },
    hasAccess: true,
    highestAccess: 'manager',
    },
}
```

<br>

Optionally, `node.properties` can contain `_history` and `_promotions` keys:

##### Examples
```javascript
_history: [
  {
    _modifiedOn: 1623317106635,
    user: {
      _id: '0700d950-654f-11eb-bcc0-c5cae311491a',
      _labelRef: 'Claire Stajol',
    },
    properties: {
      type: 'Part',
    },
  },
  {
    _modifiedOn: 1627300107640,
    user: {
      _id: '5c1e6650-654f-11eb-a2e5-fd01fad4824a',
      _labelRef: 'Claire Stajol',
    },
    properties: {
      _lockState: false,
    },
  },
],
```
```javascript
_promotions: [
  {
    fromState: 'draft',
    toState: 'inreview',
    user:{
      name: 'Claire Stajol',
      _id: '5c1e6650-654f-11eb-a2e5-fd01fad4824a',
    },
    comment: 'ok',
    time: 1622817785777,
    _version: '1.0.4',
  },
  {
    fromState: 'inreview',
    toState: 'released',
    user:{
      name: 'Claire Stajol',
      _id: '5c1e6650-654f-11eb-a2e5-fd01fad4824a',
    },
    comment: 'ok',
    time: 1622817789132,
    _version: '1.0.4',
  },
]
```

Optionally, `node` can contains `versions` key:
##### Example
```javascript
  versions: [
    {
      _version: '1.0.3',
      _id: '10dd99c0-c53c-11eb-a050-33cd27a3664a',
    },
    {
      _version: '1.0.1',
      _id: '95c37f60-c4c9-11eb-b549-e7757057aa58',
    },
    {
      _version: '1.0.4',
      _id: '49288a90-c53e-11eb-a035-d3b0e21481e5',
    }
  ],
```

<br>

### `Relationship` instance

All relationships objects are instances of the class `Relationship` and follow this format:

- `_type` (string)
  * nodetype's linkName
- `_id` (string)
  * relationship's ID
- `properties` (object)
  * contains properties defined in nodetype datamodel
- `source` (object)
  * `Node` instance of the relationship's source
  * never contains optional keys
- `target` (object)
  * `Node` instance of the relationship's target
  * never contains optional keys
- `user` (object)
  * current user using this node
  * also a `Node` instance
  * sensitive data is automatically removed

##### Example
```javascript
Relationship {
  _type: 'consumes',
  _id: 'd58c20f0-0198-11ec-a757-eddd9939830b',
  properties: {
    quantity: 1,
    _createdOn: 1629451647104,
    _id: 'd58c20f0-0198-11ec-a757-eddd9939830b',
    _createdByName: 'Claire Stajol',
    _isLatest: true,
    _effectiveOn: 1629451647104,
    _isEffective: true,
    _createdBy: '5c1e6650-654f-11eb-a2e5-fd01fad4824a',
  },
  source: Node {
    _type: 'part',
    _id: 'a692fae0-b7eb-11eb-bf0b-bbefad2d127e',
    properties: {
      _id: 'a692fae0-b7eb-11eb-bf0b-bbefad2d127e',
      _ref: 'REF0001',
      name: 'A0001',
      _labelRef: 'REF0001-A0001'
      type: 'Assembly',
      _state: 'draft',
      _lockState: false,
      _lockable: true,
      _version: '4.0.0',
      _versionedOn: 1621350830478,
      _tracked: false,
      _serialized: [],
      _createdOn: 1614200860664,
      _createdBy: 'a99cf630-654f-11eb-a2e5-fd01fad4824a',
      _createdByName: 'Michel Dubois',
      _modifiedOn: 1629451648596,
    },
  },
  target: Node {
    _type: 'part',
    _id: 'a97a2e60-e895-11eb-abbb-6b7e06b89c28',
    properties: {
      _id: 'a97a2e60-e895-11eb-abbb-6b7e06b89c28',
      _ref: 'test852',
      _labelRef: 'test852-',
      type: 'Part',
      _state: 'draft',
      _lockState: false,
      _lockable: true,
      _version: '3.0.0',
      _versionedOn: 1626701505606,
      _tracked: false,
      _serialized: [],
      _createdOn: 1623141630705,
      _createdBy: '5c1e6650-654f-11eb-a2e5-fd01fad4824a',
      _createdByName: 'Claire Stajol',
      _modifiedOn: 1627322626528,
    },
  },
}
```