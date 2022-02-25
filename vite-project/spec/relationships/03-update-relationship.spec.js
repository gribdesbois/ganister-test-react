require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../index');
const { mockNodetype, readDatamodel, getFakeValue } = require('../helpers');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';
const nodetypeName = 'part';
let targetNodetypeName;
let relationshipName;


describe('Update a relationship', () => {
  before(async function () {
    const datamodel = readDatamodel();
    const { nodetypeDefinitions } = datamodel;

    const sourceNodetypeDM = nodetypeDefinitions.find((nodetype) => {
      return nodetype.name === nodetypeName;
    });
    this.sourceNodetype = sourceNodetypeDM;

    let relationshipDirection;
    const relationshipDM = nodetypeDefinitions.find((nodetype) => {
      const { elementType, directions, hidden } = nodetype;
      if (elementType === 'node' || hidden) return;

      relationshipDirection = directions.find((d) => d.source === sourceNodetypeDM.id);
      return relationshipDirection;
    });
    this.relationshipDM = relationshipDM;

    const targetNodetypeDM = nodetypeDefinitions.find((nodetype) => {
      return nodetype.id === relationshipDirection.target;
    });
    this.targetNodetypeDM = targetNodetypeDM;

    relationshipName = relationshipDM.name;
    targetNodetypeName = targetNodetypeDM.name;
  });

  beforeEach(async function () {
    const sourceBody = mockNodetype(nodetypeName);

    const sourceResponse = await chai
      .request(app)
      .post(`${API_URL}/nodes/${nodetypeName}`)
      .set('Authorization', this.token)
      .send(sourceBody);

    expect(sourceResponse.status).eql(200);

    this.source = sourceResponse.body.data;

    const targetBody = mockNodetype(targetNodetypeName);

    const targetResponse = await chai
      .request(app)
      .post(`${API_URL}/nodes/${targetNodetypeName}`)
      .set('Authorization', this.token)
      .send(targetBody);

    expect(targetResponse.status).eql(200);

    this.target = targetResponse.body.data;

    const relationshipBody = mockNodetype(relationshipName);
    relationshipBody.source = this.source;
    relationshipBody.target = this.target;

    const relationshipResponse = await chai
      .request(app)
      .post(`${API_URL}/nodes/${this.source._type}/${this.source._id}/relationships/${relationshipName}`)
      .set('Authorization', this.token)
      .send(relationshipBody);

    expect(relationshipResponse.status).eql(200);

    this.relationship = relationshipResponse.body.data;

    // delete actions are temporary
    // data format should always be the same
    delete this.relationship.source.properties._ecoHandled;
    delete this.relationship.target.properties._ecoHandled;
    delete this.relationship.source.properties._serialized;
    delete this.relationship.target.properties._serialized;
    delete this.relationship.source.properties._promotions;
    delete this.relationship.target.properties._promotions;
    delete this.relationship.source.properties._history;
    delete this.relationship.target.properties._history;
    delete this.relationship.source.properties._thumbnail;
    delete this.relationship.target.properties._thumbnail;

    const datamodel = readDatamodel();

    const nodetypesNames = [nodetypeName, relationshipName, targetNodetypeName];
    nodetypesNames.forEach((name) => {
      const nodetypeDM = datamodel.nodetypeDefinitions.find((n) => n.name === name);

      const { elementType, properties } = nodetypeDM;

      const mandatoryProperties = properties
        .filter((p) => p.mandatory || p.generated)
        .map((p) => p.name);

      if (elementType === 'node') {
        mandatoryProperties.push('_tracked');
      }

      this[`${name}MandatoryProperties`] = mandatoryProperties;
    });
  });

  context('with valid data', () => {
    it('updates relationship', async function () {
      const property = this.relationshipDM.properties.find((p) => !p.generated);

      const { _type, _id } = this.relationship;

      this.relationship.properties[property.name] = getFakeValue(property.type);

      const response = await chai
        .request(app)
        .patch(`${API_URL}/nodes/${this.source._type}/${this.source._id}/relationships/${_type}/${_id}`)
        .set('Authorization', this.token)
        .send(this.relationship);

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data).to.be.an('object');
      expect(data._type).to.be.eql(this.relationship._type);
      expect(data._id).to.be.a('string');

      expect(data.properties).to.be.an('object');
      expect(data.properties).to.include(this.relationship.properties);
      expect(data.properties).to.have.any.keys(this[`${relationshipName}MandatoryProperties`]);
      expect(data.properties.quantity).to.be.eql(this.relationship.properties.quantity);

      expect(data.source).to.be.an('object');
      expect(data.source._type).to.be.eql(this.relationship.source._type);
      expect(data.source._id).to.be.eql(this.relationship.source._id);

      expect(data.source.properties).to.be.an('object');
      expect(data.source.properties).to.include(this.relationship.source.properties);
      expect(data.source.properties).to.have.any.keys(this[`${nodetypeName}MandatoryProperties`]);

      expect(data.target).to.be.an('object');
      expect(data.target._type).to.be.eql(this.relationship.target._type);
      expect(data.target._id).to.be.eql(this.relationship.target._id);

      expect(data.target.properties).to.be.an('object');
      expect(data.target.properties).to.include(this.relationship.target.properties);
      expect(data.target.properties).to.have.any.keys(this[`${targetNodetypeName}MandatoryProperties`]);

      expect(data.user).to.be.an('object');
      expect(data.user._type).to.be.eql('user');
      expect(data.user._id).to.be.eql(this.user._id);

      expect(data.user.properties).to.be.an('object');
      expect(data.user.properties).to.not.have.any.keys('password', 'changePasswordToken', 'token');
    });
  });
});
