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


describe('Delete a relationship', () => {
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

  context('an existing relationship', () => {
    it('deletes relationship', async function () {
      const { _type, _id } = this.relationship;

      const response = await chai
        .request(app)
        .delete(`${API_URL}/nodes/${this.source._type}/${this.source._id}/relationships/${_type}/${_id}`)
        .set('Authorization', this.token);

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data).to.be.an('object');
      expect(data).to.not.have.keys('properties');
      expect(data._type).to.be.eql(this.relationship._type);
      expect(data._id).to.be.a('string');
      expect(data.message).to.be.a('string');

      expect(data.source).to.be.an('object');
      expect(data.source).to.not.have.property('properties');
      expect(data.source._type).to.be.eql(this.source._type);
      expect(data.source._id).to.be.eql(this.source._id);

      expect(data.target).to.be.an('object');
      expect(data.target).to.not.have.property('properties');
      expect(data.target._type).to.be.eql(this.target._type);
      expect(data.target._id).to.be.eql(this.target._id);

      expect(data.user).to.be.an('object');
      expect(data.user._type).to.be.eql('user');
      expect(data.user._id).to.be.eql(this.user._id);
    });
  });
});
