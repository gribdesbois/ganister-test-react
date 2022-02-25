

![Ganister Logo](./assets/images/G.svg)


## Using GANISTER


### prerequisities
* npm
* git client
* node v8.7.0
* neo4j 3.1 or higher

#### Database

Ganister only works with Neo4j Graph database. (that might the case for a long time)
So you either need to :
- install it on a server 
- use a cloud instance using [grapheneDB](https://www.graphenedb.com/)

### Install

1. Clone repository
``` 
Git Clone 
```
2. Install dependencies
``` 
npm install 
```
3. Set database connection
``` 
Set the database connection information in the file ./config/neo4jConnection.js
```
4. Start server
``` 
npm run start 
```


## Extending GANISTER



## Building GANISTER


## Running GANISTER



## Contributing

Editor preferences are available in for [the editor config][] easy use in common
text editors. Read more and download plugins at <http://editorconfig.org>.

[the editor config]: 



## Versioning

We use [SemVer](http://semver.org/) as a guideline for our versioning here.

### What does that mean?

Releases will be numbered with the following format:

```
<major>.<minor>.<patch>
```

And constructed with the following guidelines:

- Breaking backward compatibility bumps the `<major>` (and resets the `<minor>`
  and `<patch>`)
- New additions without breaking backward compatibility bump the `<minor>` (and
  reset the `<patch>`)
- Bug fixes and misc. changes bump the `<patch>`
=======

