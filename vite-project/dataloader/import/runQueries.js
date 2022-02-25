
require('dotenv').config();
const ora = require('ora');
const NODEU = require('uuid');

const config = require('../../config/config');
const timer = require('../utils');

const driver = config.db;


const importNodes = async (items, session) => {
  let spinner;

  //  Sort items by elementType (to make sure we add nodetypes before relationships)
  const nodes = items.sort((a, b) => {
    return a.nodetype.elementType.localeCompare(b.nodetype.elementType);
  });

  for (let index = 0; index < nodes.length; index++) {
    try {
      // let txc = session.beginTransaction();
      const start = Date.now();
      const nodetypeName = nodes[index].nodetype.name;
      spinner = ora(`Start importing "${nodetypeName}" nodes...`).start();
      // eslint-disable-next-line no-await-in-loop
      const response = await session.run(nodes[index].query);
      // await txc.commit();
      const nodesCount = response.records[0]._fields.reverse().find((object) => object.total);
      spinner.succeed(`DB Query: "${nodetypeName}" nodes imported!`);
      if (nodesCount) {
        spinner.info(`[Total:${nodesCount.total}] [Success:${nodesCount.committedOperations}] [Fails:${nodesCount.failedOperations}] "${nodetypeName}" processed in ${timer(start)}`);
      }
    } catch (err) {
      console.error('Node Queries Error!');
      console.error(err);
      // await txc.rollback();
    }
  }
};

const createIndexes = async (indexQueries, session) => {
  let txc;
  let spinner;

  try {
    txc = session.beginTransaction();
    for (let index = 0; index < indexQueries.length; index++) {
      const nodetypeName = indexQueries[index].name;
      spinner = ora(`Start creating "${nodetypeName}" indexes...`).start();
      // eslint-disable-next-line no-await-in-loop
      await txc.run(indexQueries[index].query);
      spinner.succeed(`DB Query: "${nodetypeName}" indexes created!`);
    }
    spinner = ora('Commiting nodes and indexes...').start();
    await txc.commit();
    spinner.succeed('DB Query: Nodes and Indexes created!');
  } catch (err) {
    console.error('Node Queries Error!');
    console.error(err);
    await txc.rollback();
    return false;
  }
};

const attachPermissions = async (items, session) => {
  let txc;
  let spinner;

  try {
    txc = session.beginTransaction();
    const nodesNames = items.reduce((names, item) => {
      if (item.nodetype.elementType === 'node') names.push(item.nodetype.name);
      return names;
    }, []);
    const permissionQueries = nodesNames.map((nodeName) => {
      return `
			CALL apoc.periodic.iterate(
				"MATCH (n:${nodeName}), (p:PermissionSet { name: '${nodeName}'})
				WHERE NOT (p)-[:accessRole]->(n)
				RETURN n, p",
				"CREATE (p)-[r:accessRole { _id: '${NODEU.v1()}'}]->(n)
				SET r = { _createdOn: timestamp(), _createdBy: 'import', _createdByName: 'import', role: 'permissionSet', _type: 'accessRole' }
				",
				{batchSize:1000, iterateList:true, parallel:true}
			)`;
    });
    let nodeName;
    for (let index = 0; index < permissionQueries.length; index++) {
      nodeName = items[index].nodetype.name;
      spinner = ora(`Start creating "${nodeName}" permission relationships...`).start();
      // eslint-disable-next-line no-await-in-loop
      await txc.run(permissionQueries[index]);
      spinner.succeed(`DB Query: "${nodeName}" permission relationships created!`);
    }
    await txc.commit();
  } catch (err) {
    console.error(err);
    spinner.fail(`DB Query: permission relationships failed! (${err.message})`);
    await txc.rollback();
  }
};

/**
 * runQueries
 * @param {*} items
 * @param {*} indexQueries
 */
const runQueries = async (items, indexQueries) => {
  const session = driver.session();
  await importNodes(items, session);
  await createIndexes(indexQueries, session);
  await attachPermissions(items, session);
  await session.close();
};

module.exports = runQueries;
