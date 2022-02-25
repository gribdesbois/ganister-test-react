const Node = require('./node');

const Database = require('../modules/database');

const relationshipQueries = require('../queries/relationship');

const { buildAndValidate } = require('../utils/relationship');

const { getNodetype, label } = require('../helpers');

class Relationship {
  // CONSTRUCTOR

  /**
   * Constructor of Relationship class
   * @param {object{}} record - object representing relationship
   * @param {string} record._type - relationship name
   * @param {string} record._id - (optional) relationship id
   * @param {object{}} [record.properties={}] - relationship properties
   * @param {object{}} record.source - object representing source node
   * @param {object{}} record.target - object representing target node
   * @returns {object} relationship instance
   */
  constructor(record) {
    const {
      _id,
      _type = label(record),
      source,
      target,
      properties = {},
    } = record;

    this._type = _type;
    this._id = properties._id || _id;

    if (properties._type) delete properties._type;

    this.properties = properties;

    if (source.user) delete source.user;
    if (target.user) delete target.user;

    this.source = source;
    this.target = target;
  }

  // GETTERS

  /**
   * Get relationship's datamodel
   * @returns {object{}} - relationship's datamodel
   */
  get datamodel() {
    return getNodetype(this._type);
  }

  // INSTANCE METHODS

  /**
   * Set relationship's current user
   * @param {object{}} user - current user manipulating relationship instance
   * @param {object{}} user.properties - user properties
   * @param {string} user.properties._id - user id
   * @param {string} user.properties.name - user name
   * @returns {object{}} - relationship instance
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
   * Save relationship instance in database
   * @async
   * @returns {Promise<Relationship>} - relationship instance
   */
  async save() {
    await buildAndValidate(this);

    const { query, params } = relationshipQueries.save(this);
    const [record] = await Database.runQuery(query, params);
    const field = record.get('r');

    const { _type, ...properties } = field.properties;
    this.properties = properties;

    return this;
  }

  /**
   * Delete relationship from database
   * @async
   * @returns {Promise<Relationship>} - relationship instance
   */
  async delete() {
    const { query, params } = relationshipQueries.delete(this);
    await Database.runQuery(query, params);

    delete this.properties;
    delete this.source.properties;
    delete this.target.properties;

    return this;
  }

  // STATIC METHODS

  /**
   * Create a new relationship instance
   * @async
   * @param {object{}} record - object representing relationship
   * @param {string} record._type - relationship name
   * @param {string} record._id - (optional) relationship id
   * @param {object{}} [record.properties={}] - relationship properties
   * @param {object{}} [options={}] - relationship formatting options, default: { details: false, versions: false }
   * @returns {Promise<Relationship>} - relationship instance
   */
  static async new(record) {
    const { user } = record;

    record.source = await Node.new(record.source);
    record.target = await Node.new(record.target);

    const relationship = new Relationship(record);
    if (user?._id) relationship.user(user);

    return relationship;
  }

  /**
   * Find a relationship in database
   * @async
   * @param {object{}} data - object representing relationship
   * @param {string} data._type - relationship name
   * @param {string} data._id - relationship id
   * @param {object{}} data.user - current user, used to check accesses
   * @param {object{}} [options={}] - relationship formatting options, default: { details: false, versions: false }
   * @returns {Promise<Relationship>} - relationship instance
   */
  static async find(data) {
    const { query, params } = relationshipQueries.get(data);
    const [record] = await Database.runQuery(query, params);
    const field = record?.get('r');
    if (!field) return;

    const relationship = await this.new(field);

    return relationship;
  }

  /**
   * Find all accessible relationships of given relationship name(s)
   * @async
   * @param {string} name - relationship name. If unknown, 'Relationship'
   * @param {object{}} [filters={}] - object representing search filters
   * @param {object{}} filters.user - current user, used to check accesses
   * @param {object{}} filters.node - node relationships should contain
   * @returns {Promise<Relationship[]>} - array of relationships instances
   */
  static async all(name, filters = {}) {
    const undefinedRelationship = name === 'Relationship' && !filters.relationships;
    const permissionSet = filters.node?._type === 'PermissionSet';
    const accessRole = name === 'accessRole';

    let query;
    let params;
    if (undefinedRelationship) {
      ({ query, params } = relationshipQueries.allExtended(filters));
    } else if (permissionSet && accessRole) {
      ({ query, params } = relationshipQueries.allPermissionSetAccessRoles(filters.node));
    } else {
      ({ query, params } = relationshipQueries.all(name, filters));
    }
    const records = await Database.runQuery(query, params);

    const promises = records.map(async (record) => {
      const field = record.get('r');
      const relationship = this.new(field);
      return relationship;
    });
    const relationships = await Promise.all(promises);

    return relationships;
  }
}

module.exports = Relationship;
