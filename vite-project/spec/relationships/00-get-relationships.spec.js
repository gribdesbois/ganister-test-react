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


describe('Get relationships', () => {
  before(async function () {
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

    const nodetypesNames = [nodetypeName, relationshipName, targetNodetypeName];
    nodetypesNames.forEach((name) => {
      const nodetypeDM = nodetypeDefinitions.find((n) => n.name === name);

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
  });

  context("nodetype's relationships", () => {
    it('gets relationships', async function () {
      const response = await chai
        .request(app)
        .get(`${API_URL}/nodes/${this.source._type}/relationships/${this.relationship._type}`)
        .set('Authorization', this.token);

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data).to.be.an('array').and.to.have.lengthOf.at.most(1);

      expect(data[0]).to.be.an('object');
      expect(data[0]._type).to.be.eql(this.relationship._type);
      expect(data[0]._id).to.be.eql(this.relationship._id);

      expect(data[0].properties).to.be.an('object');
      expect(data[0].properties).to.include(this.relationship.properties);

      expect(data[0].source).to.be.an('object');
      expect(data[0].source._type).to.be.eql(this.source._type);
      expect(data[0].source._id).to.be.eql(this.source._id);
      expect(data[0].source.properties).to.be.an('object');

      expect(data[0].target).to.be.an('object');
      expect(data[0].target._type).to.be.eql(this.target._type);
      expect(data[0].target._id).to.be.eql(this.target._id);
      expect(data[0].target.properties).to.be.an('object');
    });
  });

  context("node's relationships", () => {
    it('gets relationships', async function () {
      const response = await chai
        .request(app)
        .get(`${API_URL}/nodes/${this.source._type}/${this.source._id}/relationships/${this.relationship._type}`)
        .set('Authorization', this.token);

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data)
        .to.be.an('array')
        .and.to.have.lengthOf.at.most(1);

      expect(data[0]).to.be.an('object');
      expect(data[0]._type).to.be.eql(this.relationship._type);
      expect(data[0]._id).to.be.eql(this.relationship._id);

      expect(data[0].properties).to.be.an('object');
      expect(data[0].properties).to.include(this.relationship.properties);

      expect(data[0].source).to.be.an('object');
      expect(data[0].source._type).to.be.eql(this.source._type);
      expect(data[0].source._id).to.be.eql(this.source._id);
      expect(data[0].source.properties).to.be.an('object');

      expect(data[0].target).to.be.an('object');
      expect(data[0].target._type).to.be.eql(this.target._type);
      expect(data[0].target._id).to.be.eql(this.target._id);
      expect(data[0].target.properties).to.be.an('object');
    });

    it('searches relationships', async function () {
      delete this.relationship.user;

      const body = { relationships: [this.relationship._type] };

      const response = await chai
        .request(app)
        .post(`${API_URL}/nodes/${this.source._type}/${this.source._id}/relationships`)
        .set('Authorization', this.token)
        .send(body);

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data)
        .to.be.an('array')
        .and.to.have.lengthOf.at.most(1);

      expect(data[0]).to.be.an('object');
      expect(data[0]._type).to.be.eql(this.relationship._type);
      expect(data[0]._id).to.be.eql(this.relationship._id);

      expect(data[0].properties).to.be.an('object');
      expect(data[0].properties).to.include(this.relationship.properties);

      expect(data[0].source).to.be.an('object');
      expect(data[0].source._type).to.be.eql(this.source._type);
      expect(data[0].source._id).to.be.eql(this.source._id);
      expect(data[0].source.properties).to.be.an('object');

      expect(data[0].target).to.be.an('object');
      expect(data[0].target._type).to.be.eql(this.target._type);
      expect(data[0].target._id).to.be.eql(this.target._id);
      expect(data[0].target.properties).to.be.an('object');
    });
  });
});
