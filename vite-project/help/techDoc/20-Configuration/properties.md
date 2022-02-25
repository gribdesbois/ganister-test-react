# Properties

Properties are defining the attributes any node of a certain nodetype can have. 

Ganister provides pre-defined system properties that should not be altered without having a good knowledge of the consequences of such change. These properties are labeled as being core (core === true).

In the property table anything in turquoise cannot be directly edited in the grid.

The available columns are the following:



- **name** :  technical name of the property. This is how this is stored in the database
- **core** : boolean defining if this is a core property or not 
- **group** : group name, mainly used to facilitate the form generation 
- **unique** : defines if the property should be unique for a specific nodetype
- **mandatory** : defines if the property is mandatory when creating a node
- **generated** : defines if the property value is generated either by a method or by the codification setup
- **type** : type of data stored
- **relationship** : if type of data is a node, it defines the relationship to this other nodetype
- **listSource** : if type of data is a list, it defines the list to pick values from
- **Default Value** : default value on node creation



***Note: For properties of type "double" the decimal separator of the value should be a dot rather than a comma.***

