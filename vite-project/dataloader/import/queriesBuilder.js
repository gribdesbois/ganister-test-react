const ora = require('ora');
const NODEU = require('uuid');
const fs = require('fs');
const { downloadCSV } = require('./S3Bucket');

const LOCALFOLDER = process.env.DB_LOCALFOLDER;
//  Get Datamodel
const datamodel = require('../../build/datamodel.json');


/**
 * propQueries
 * @param {*} name 
 * @param {*} headers 
 * @param {*} types 
 */
const setPropertiesQuery = (headers, types) => {
  const properties = types.map((type, i) => {
    const property = headers[i];
    switch (type) {
      case 'integer':
        return `p.${property} = toInteger(row.${property})`;
      case 'date':
      case 'dateTime':
        return `p.${property} = COALESCE(toInteger(row.${property}), timestamp())`;
      case 'boolean':
      case '2-states Boolean':
      case '3-states Boolean':
        if (property === '_lockState') return `p.${property} = COALESCE(toBoolean(row.${property}), FALSE)`;
        return `p.${property} = toBoolean(row.${property})`
      case 'double':
        return `p.${property} = toFloat(row.${property})`;
      case 'string':
        if (property === '_id') return `p.${property} = COALESCE(row.${property}, '${NODEU.v1()}')`;
        if (property === '_version') return `p.${property} = COALESCE(row.${property}, '1.0.0')`;
        return null;
      default:
        return null;
    }
  });
  return properties.filter((property) => property !== null).join(', ');
};

const buildQueries = async (S3Files, data) => {
  const indexQueries = [];
  const queries = [];

  try {
    const spinner = ora('Start creating database queries...').start();
    let files = data;

    if (S3Files) {
      files = await downloadCSV(S3Files, data);
    }

    files.forEach((csv) => {
      if (!csv.url) {
        // save csv content in a file
        const fileContent = csv.content;
        const fileName = csv.name;
        const filePath = `${LOCALFOLDER}/import/${fileName}.csv`;
        fs.writeFileSync(filePath, fileContent);
        csv.url = `file:///${fileName}.csv`;
      }

      const nodeName = csv.name.split('.')[0];
      const propertiesQuery = setPropertiesQuery(csv.headers, csv.types);
      const nodetype = datamodel.nodetypeDefinitions.find((n) => n.name === nodeName);
      let query;

      if (nodetype && nodetype.elementType === 'node') {
        query = `
              LOAD CSV WITH HEADERS FROM '${csv.url}' AS row
              WITH row WHERE row._id IS NOT NULL
              MERGE (p:${nodeName} { _id: row._id })
              SET p = row,${propertiesQuery}
              RETURN count(p)
            `;
        indexQueries.push({ name: nodeName, query: `CREATE INDEX ${nodeName}Id IF NOT EXISTS FOR (n:${nodeName}) ON (n._id)` });
      } else if (nodetype && nodetype.elementType === 'relationship') {
        // won't work with multiple source/target
        const source = datamodel
          .nodetypeDefinitions.find((n) => n.id === nodetype.directions[0].source);
        // won't work with multiple source/target
        const target = datamodel
          .nodetypeDefinitions.find((n) => n.id === nodetype.directions[0].target);
        query = `
              USING PERIODIC COMMIT 1000 LOAD CSV WITH HEADERS FROM '${csv.url}' AS row
              WITH row WHERE row._id IS NOT NULL
              MATCH (s:${source.name}{_id: row.source_id}), (t:${target.name}{_id: row.target_id})
              MERGE (s)-[p:${nodetype.linkName}{_id: row._id}]->(t)
              SET p = row ,${propertiesQuery},p._type='${nodetype.name}'
              REMOVE p.source_id, p.target_id
              RETURN count(p)`;
      } else {
        query = `
              USING PERIODIC COMMIT 100 LOAD CSV WITH HEADERS FROM '${csv.url}' AS row
              WITH row WHERE row._id IS NOT NULL
              MATCH (s{_id: row.source_id}), (t{_id: row.target_id})
              MERGE (s)-[p:${nodeName}{_id: row._id}]->(t)
              SET p = row ,${propertiesQuery},p._type='${nodetype.name}'
              REMOVE p.source_id, p.target_id
              RETURN count(p)`;
      }
      queries.push({ nodetype, query });
    });
    spinner.succeed('Database Queries created!');

    return { queries, indexQueries };
  } catch (err) {
    console.error("ERROR 94", err.message)
  }
};

module.exports = buildQueries;