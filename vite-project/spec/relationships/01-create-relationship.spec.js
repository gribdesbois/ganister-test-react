require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../index');
const { mockNodetype, readDatamodel } = require('../helpers');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';
const nodetypeName = 'part';
let targetNodetypeName;
let relationshipName;


describe('Create a relationship', () => {
  before(async () => {
    const datamodel = readDatamodel();
    const { nodetypeDefinitions } = datamodel;

    const sourceNodetypeDM = nodetypeDefinitions.find((nodetype) => {
      return nodetype.name === nodetypeName;
    });

    let relationshipDirection;
    const relationshipDM = nodetypeDefinitions.find((nodetype) => {
      const { elementType, directions, hidden } = nodetype;
      if (elementType === 'node' || hidden) return;

      relationshipDirection = directions.find((d) => d.source === sourceNodetypeDM.id);
      return relationshipDirection;
    });

    const targetNodetypeDM = nodetypeDefinitions.find((nodetype) => {
      return nodetype.id === relationshipDirection.target;
    });

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

  context('with valid source and target', () => {
    it('adds relationship', async function () {
      delete this.source.properties._serialized;
      delete this.source.properties._promotions;
      delete this.source.properties._history;
      delete this.target.properties._serialized;
      delete this.target.properties._promotions;
      delete this.target.properties._history;

      const relationship = mockNodetype(relationshipName);
      relationship.source = this.source;
      relationship.target = this.target;

      const response = await chai
        .request(app)
        .post(`${API_URL}/nodes/${this.source._type}/${this.source._id}/relationships/${relationshipName}`)
        .set('Authorization', this.token)
        .send(relationship);

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data).to.be.an('object');
      expect(data._type).to.be.eql(relationship._type);
      expect(data._id).to.be.a('string');

      expect(data.properties).to.be.an('object');
      expect(data.properties).to.include(relationship.properties);
      expect(data.properties).to.have.any.keys(this[`${relationshipName}MandatoryProperties`]);

      expect(data.source).to.be.an('object');
      expect(data.source._type).to.be.eql(this.source._type);
      expect(data.source._id).to.be.eql(this.source._id);

      expect(data.source.properties).to.be.an('object');
      expect(data.source.properties).to.include(this.source.properties);
      expect(data.source.properties).to.have.any.keys(this[`${nodetypeName}MandatoryProperties`]);

      expect(data.target).to.be.an('object');
      expect(data.target._type).to.be.eql(this.target._type);
      expect(data.target._id).to.be.eql(this.target._id);

      expect(data.target.properties).to.be.an('object');
      expect(data.target.properties).to.include(this.target.properties);
      expect(data.target.properties).to.have.any.keys(this[`${targetNodetypeName}MandatoryProperties`]);

      expect(data.user).to.be.an('object');
      expect(data.user._type).to.be.eql('user');
      expect(data.user._id).to.be.eql(this.user._id);

      expect(data.user.properties).to.be.an('object');
      expect(data.user.properties).to.not.have.any.keys('password', 'changePasswordToken', 'token');
    });
  });
});
