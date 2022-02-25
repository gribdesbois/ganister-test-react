# Configuration Management



## Versioning

Versioning (or revisioning) is a critical aspect of all PLM implementation. Some editors, will have a pre-defined CMII-valid framework and some others will be more flexible and from time to time allow to add a minor revisioning systems.

### CMII strict rule

CMII is very production oriented, meaning that the revision mechanism is very tight to manufacturing. 

#### FFF - Fit Form Function (or Feature)

FFF means that every time you are evaluating a change, if any of the three aspects Fit Form and/or Function is impacted then the part is a different part, therefor it should get a new part number. Great to avoid mistakes in manufacturing. If FFF is verified, then parts are caracterized as interchangeable. Which means you could use either version in an assembly. 

And then you add products (not parts), softwares and electronics and you need to rethink this concept all over.

### A Diversity of versioning techniques

#### SemVer - Semantic Versioning

[SemVer 2.0.0](https://semver.org/) is the actual most used standard for software versioning.

The main revision index are the following

1. MAJOR version when you make incompatible API changes,
2. MINOR version when you add functionality in a backwards-compatible manner, and
3. PATCH version when you make backwards-compatible bug fixes.

This could be extended for pre-release,etc. This is great for software but doesn't seem applicable for other domains.

#### Integration Versioning

In the electronic system industry we have seen the following:

1. MAJOR Customer will notice a change and mechanical integration needs adaptation.
2. MINOR When the customer can notice a change but mechanical integration hasn't changed
3. PATCH When nothing changes for the customer.

#### Electronic for automotive industry

We have seen in industries where the customer will do intensive test on your product, that the patch definition can be even stronger.

1. MAJOR Customer will notice a change and mechanical integration needs adaptation.
2. MINOR When the customer can notice a change but mechanical integration hasn't changed
3. **PATCH We must make sure this never shows up on any label so customer doesn't see it**

### Generic Versioning

And here is our system:

- The 3 digit versioning seems to be the norm and adapted to most situations
- The logic of higher index that reset lower indexes when incremented seems to be valid for all situations
- The semantic of each index is very different from a domain to another.
- Interchangeability can differ between domains.

For each nodetype in Ganister :

- You have a 3 digit versioning system by default (could be increased if necessary)
- You can define the semantic of each index (this would be shown to users on the node but also in the change management process)
- You can define the increment logic from Child to Parent.



#### Revision

A revision is a copy of a node with a relationship from the newly created node to the source of the copy with a "revises" label.


#### Fork

A fork is a copy of a node involving a modification of the ref property with a relationship from the newly created node to the source of the copy with a "forks" label.

## Objects Interaction

### Interchangeable Revision

Interchangeable revisions are changes that are considered as not impacting the fit the form or the function of the considered part. Therefor whe these change occur it is considered interchangeable and the parent assemblies don't need to be updated or version to accept these changes. It consequently blocks the revision propagation.

### Non-interchangeable Revision

Non-interchangeable revision are changes that are impacting the fit, the form and/or the function of a part. It has to be considered in the parent assemblies like a impacting change which requires a new revision.

### Fork

A Fork allows to start a design from an existing one. It is usually occuring when for an assembly we need to make a change on a part but the same part is already use in other assemblies and we believe that the change we are making is really changing the core characteristics of this part.

### Superseding Fork

A superseding fork happens when e believe that a change to a part is needed but the result is too different to be considered the same part. Therefore we create a new reference which will take the place of the old one.

