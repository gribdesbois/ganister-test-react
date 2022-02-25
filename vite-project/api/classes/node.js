const Database = require('../modules/database');

const nodeQueries = require('../queries/node');

const nodeUtil = require('../utils/node');
const { addMaidenName } = require('../utils/nodetype');

const { getNodetype, label } = require('../helpers');

class Node {
  // STATIC PROPERTIES

  static options = { details: true, versions: false };

  // CONSTRUCTOR

  /**
   * Constructor of Node class
   * @param {object{}} record - object representing node
   * @param {string} record._type - nodetype name
   * @param {string} record._id - (optional) node id
   * @param {object{}} [record.properties={}] - node properties
   * @param {string} record.relationshipType - if node is another node's property, name of the relationship between them
   * @param {string} record.relationshipId - if node is another node's property, id of the relationship between them
   * @returns {object} Node instance
   */
  constructor(record) {
    const { _id, _type, properties = {} } = record;

    this._type = label(record) || _type;
    this._id = properties._id || _id;
    this.properties = properties;

    // if node is a property of type 'node'
    const { relationshipType, relationshipId } = record;
    if (relationshipType) this.relationshipType = relationshipType;
    if (relationshipId) this.relationshipId = relationshipId;
  }

  // GETTERS

  /**
   * Get node's datamodel
   * @returns {object{}} - node's datamodel
   */
  get datamodel() {
    return getNodetype(this._type);
  }

  // INSTANCE METHODS

  /**
   * Set node's current user
   * @param {object{}} user - current user manipulating node instance
   * @param {object{}} user.properties - user properties
   * @param {string} user.properties._id - user id
   * @param {string} user.properties.name - user name
   * @returns {object{}} - node instance
   */
  user(user) {
    this.user = user;

    if (this._id) return this;

    const { name, _id } = user.properties || {};
    this.properties._createdBy = _id;
    this.properties._createdByName = name;

    return this;
  }

  /**
   * Set node's lock properties
   * @async
   * @param {Node|null} user - current user or null
   * @returns {Promise<Node>} node instance
   */
  async lockedBy(user) {
    const lockProperties = {
      _lockState: !!user,
      _lockedBy: user?._id || null,
      _lockedByName: user?.properties?.name || null,
      _lockedOn: user ? Date.now() : null,
    };

    Object.assign(this.properties, lockProperties);

    const queryArguments = {
      _type: this._type,
      _id: this._id,
      properties: lockProperties,
    };
    const { query, params } = nodeQueries.save(queryArguments);
    await Database.runQuery(query, params);

    Object.keys(lockProperties).forEach((key) => {
      if (this.properties[key] === null) delete this.properties[key];
    });
    addMaidenName(this);

    return this;
  }

  /**
   * Save node instance in database
   * @async
   * @returns {Promise<Node>} - node instance
   */
  async save() {
    if (this.promotion) {
      nodeUtil.checkMandatoryProperties(this);
      await nodeUtil.checkMandatoryRelationships(this);
    }

    await nodeUtil.buildAndValidate(this);

    const { query, params } = nodeQueries.save(this);
    const [record] = await Database.runQuery(query, params);
    const field = record.get('n');

    this.properties = field.properties;
    const nodetypeDM = this.datamodel;
    if (nodetypeDM) {
      for (const p of nodetypeDM.properties) {
        const { name, type } = p;

        if (type === 'node') {
          const value = field.properties[name];

          if (value) {
            /* eslint-disable-next-line */
            const property = await Node.new(value);
            this.properties[name] = property;
          }
        }
      }
    }
    addMaidenName(this);

    return this;
  }

  /**
   * Delete node from database
   * @async
   * @returns {Promise<Node>} - node instance
   */
  async delete() {
    const { query, params } = nodeQueries.delete(this);
    await Database.runQuery(query, params);

    delete this.properties;

    return this;
  }

  // STATIC METHODS

  /**
   * Create a new node instance
   * @async
   * @param {object{}} record - object representing node
   * @param {string} record._type - nodetype name
   * @param {string} record._id - (optional) node id
   * @param {object{}} [record.properties={}] - node properties
   * @param {object{}} [options={}] - node formatting options, default: { details: false, versions: false }
   * @returns {Promise<Node>} - node instance
   */
  static async new(record, options = {}) {
    const nodeOptions = { ...this.options, ...options };
    const { details } = nodeOptions;

    const node = new Node(record);

    const nodetypeDM = node.datamodel;
    if (nodetypeDM) {
      for (const p of nodetypeDM.properties) {
        const { name, type } = p;

        if (type === 'node') {
          const value = node.properties[name];

          if (value) {
            /* eslint-disable-next-line */
            const property = await this.new(value);
            node.properties[name] = property;
          }
        }
      }
    }

    if (!details) nodeUtil.hideDetails(node);
    nodeUtil.setVersions(node);
    addMaidenName(node);

    const { user } = record;
    if (user?._id) node.user(user);

    return node;
  }

  /**
   * Find a node in database
   * @async
   * @param {object{}} data - object representing node
   * @param {string} data._type - nodetype name
   * @param {string} data._id - node id
   * @param {object{}} data.user - current user, used to check accesses
   * @param {object{}} [options={}] - node formatting options, default: { details: false, versions: false }
   * @returns {Promise<Node>} - node instance
   */
  static async find(data, options = {}) {
    const nodeOptions = { ...this.options, ...options };

    const { query, params } = nodeQueries.get(data, nodeOptions);
    const [record] = await Database.runQuery(query, params);
    const field = record?.get('n');
    if (!field) return;

    const node = await this.new(field, options);

    return node;
  }

  /**
   * Find all accessible nodes of given nodetype(s)
   * @async
   * @param {string} nodetype - nodetype name. If unknown, 'Node'
   * @param {object{}} filters - object representing search filters
   * @param {object{}} filters.user - current user, used to check accesses
   * @param {object{}} [options={}] - node formatting options
   * @returns {Promise<Node[]>} - array of nodes instances
   */
  static async all(nodetype, filters, options = {}) {
    const { query, params } = nodeQueries.all(nodetype, filters);
    const records = await Database.runQuery(query, params);

    const promises = records.map(async (record) => {
      const field = record.get('n');
      const node = await this.new(field, options);
      return node;
    });
    const nodes = await Promise.all(promises);

    return nodes;
  }
}

module.exports = Node;
