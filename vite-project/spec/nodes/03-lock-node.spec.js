require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../index');
const { mockNodetype, readDatamodel } = require('../helpers');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';
const nodetypeName = 'part';


describe('Lock/Unlock a node', () => {
  before(function () {
    const datamodel = readDatamodel();
    const nodetypeDM = datamodel.nodetypeDefinitions.find((n) => n.name === nodetypeName);

    this.nodetypeDM = nodetypeDM;

    const mandatoryProperties = nodetypeDM.properties
      .filter((p) => p.mandatory || p.generated)
      .map((p) => p.name);
    mandatoryProperties.push('_ecoHandled', '_tracked');

    this.mandatoryProperties = mandatoryProperties;
  });

  beforeEach(async function () {
    const body = mockNodetype(nodetypeName);

    const response = await chai
      .request(app)
      .post(`${API_URL}/nodes/${nodetypeName}`)
      .set('Authorization', this.token)
      .send(body);

    expect(response.status).eql(200);

    const { data } = response.body;

    this.node = data;

    delete this.node.properties._serialized;
  });

  context('node created by user', () => {
    it('locks node', async function () {
      delete this.node.properties._lockState;
      delete this.node.properties._lockedOn;

      const response = await chai
        .request(app)
        .patch(`${API_URL}/nodes/${nodetypeName}/${this.node._id}`)
        .set('Authorization', this.token)
        .send({ lock: true });

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data).to.be.an('object');
      expect(data._type).to.be.eql(nodetypeName);
      expect(data._id).to.be.eql(this.node._id);

      expect(data.properties).to.be.an('object');
      expect(data.properties).to.include(this.node.properties);
      expect(data.properties).to.have.any.keys(this.mandatoryProperties);
      expect(data.properties._lockState).to.be.eql(true);
      expect(data.properties._lockedBy).to.be.eql(this.user._id);
      expect(data.properties._lockedByName).to.be.eql(this.user.properties.name);

      expect(data.user).to.be.an('object');
      expect(data.user._type).to.be.eql('user');
      expect(data.user._id).to.be.eql(this.user._id);

      expect(data.user.properties).to.be.an('object');
      expect(data.user.properties).to.not.have.any.keys('password', 'changePasswordToken', 'token');
    });

    it('unlocks node', async function () {
      this.node.properties._lockState = false;
      delete this.node.properties._lockedBy;
      delete this.node.properties._lockedByName;
      delete this.node.properties._lockedOn;

      const body = { lock: false };

      const response = await chai
        .request(app)
        .patch(`${API_URL}/nodes/${nodetypeName}/${this.node._id}`)
        .set('Authorization', this.token)
        .send(body);

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data).to.be.an('object');
      expect(data._type).to.be.eql(nodetypeName);
      expect(data._id).to.be.eql(this.node._id);

      expect(data.properties).to.be.an('object');
      expect(data.properties).to.include(this.node.properties);
      expect(data.properties).to.have.any.keys(this.mandatoryProperties);
      expect(data.properties._lockState).to.be.eql(body.lock);
      expect(data.properties).to.not.have.any.keys('_lockedBy', '_lockedByName', '_lockedOn');

      expect(data.user).to.be.an('object');
      expect(data.user._type).to.be.eql('user');
      expect(data.user._id).to.be.eql(this.user._id);

      expect(data.user.properties).to.be.an('object');
      expect(data.user.properties).to.not.have.any.keys('password', 'changePasswordToken', 'token');
    });
  });
});
