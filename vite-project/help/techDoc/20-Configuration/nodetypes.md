# Nodetype Configuration

![1551855611067](assets/1551855611067.png)

## Main properties

- **Name**: technical name of the nodetype. Should be unique and camelCase (schemavalidated)
- **Codification**: Defines a sequence based on a prefix, a separator the size of the counter and the content  of the counter (XXX1 or 0001 or ---1,...). This can be used by a property with type sequence.
- **Menu category** : designate the left bar menu where the nodetype will be listed
- **Change method**: TODO
- **Permission**: designate the permission set defined in Groups and Users which applies to this nodetype. It will impact the creation, edition 
- **Maiden Name**: allows you to designate the properties used to help users identify the node. That's the label shown on most interfaces to replace the unique ID.
- **Maiden Name Separator**: Specifies the character used to separate each field of the Maiden Name 
- **Versionable**: Defines is the nodes of this type will be versioned.
- **Thumbnail**: Defines if there will be a thumbnail on the form
- **Hidden Lifecycle**: If the lifecycle is not used, it allows to simply hide all the lifecycle references and buttons.