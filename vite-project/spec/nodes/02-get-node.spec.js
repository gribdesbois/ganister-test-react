require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../index');
const { mockNodetype, readDatamodel } = require('../helpers');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';
const nodetypeName = 'part';


describe('Get a node', () => {
  before(async function () {
    const body = mockNodetype(nodetypeName);

    const response = await chai
      .request(app)
      .post(`${API_URL}/nodes/${nodetypeName}`)
      .set('Authorization', this.token)
      .send(body);

    expect(response.status).eql(200);

    const { data } = response.body;

    this.node = data;

    const datamodel = readDatamodel();
    const nodetypeDM = datamodel.nodetypeDefinitions.find((n) => n.name === nodetypeName);

    this.nodetypeDM = nodetypeDM;

    const mandatoryProperties = nodetypeDM.properties
      .filter((p) => p.mandatory || p.generated)
      .map((p) => p.name);
    mandatoryProperties.push('_ecoHandled', '_tracked');

    this.mandatoryProperties = mandatoryProperties;
  });

  context('with valid acccess', () => {
    it('gets node', async function () {
      delete this.node.properties._serialized;

      const response = await chai
        .request(app)
        .get(`${API_URL}/nodes/${nodetypeName}/${this.node._id}`)
        .set('Authorization', this.token);

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data).to.be.an('object');
      expect(data._type).to.be.eql(nodetypeName);
      expect(data._id).to.be.eql(this.node._id);

      expect(data.properties).to.be.an('object');
      expect(data.properties).to.include(this.node.properties);
      expect(data.properties).to.have.any.keys(this.mandatoryProperties);
      expect(data.properties._serialized).to.be.an('array');

      expect(data.user).to.be.an('object');
      expect(data.user._type).to.be.eql('user');
      expect(data.user._id).to.be.eql(this.user._id);

      expect(data.user.properties).to.be.an('object');
      expect(data.user.properties).to.not.have.any.keys('password', 'changePasswordToken', 'token');
    });
  });

  context('with triggered method', () => {
    before(async function () {
      const response = await chai
        .request(app)
        .post(`${API_URL}/nodetypes/${nodetypeName}/methods`)
        .set('Authorization', this.token)
        .send({ method: { name: this.method.name } });

      const { newItem } = response.body;

      this.triggeredMethod = newItem;
    });

    after(async function () {
      await chai
        .request(app)
        .delete(`${API_URL}/nodetypes/${nodetypeName}/methods/${this.triggeredMethod.id}`)
        .set('Authorization', this.token);
    });

    for (const trigger of ['beforeGet', 'afterGet']) {
      it(`runs triggered method on '${trigger}'`, async function () {
        await chai
          .request(app)
          .put(`${API_URL}/nodetypes/${nodetypeName}/methods/${this.triggeredMethod.id}`)
          .set('Authorization', this.token)
          .send({
            method: {
              attribute: 'trigger',
              newValue: trigger,
            },
          });

        const response = await chai
          .request(app)
          .get(`${API_URL}/nodes/${this.node._type}/${this.node._id}`)
          .set('Authorization', this.token);

        expect(response.status).eql(200);

        const { data, errors } = response.body;

        if (trigger.includes('before')) {
          expect(errors).to.be.an('array').and.to.have.lengthOf(1);
          expect(errors[0]).to.have.property('message').eql(trigger);
        } else {
          expect(errors).to.be.an('array').and.to.have.lengthOf(0);
        }

        expect(data).to.be.an('object');
        expect(data._type).to.be.eql(nodetypeName);
        expect(data._id).to.be.eql(this.node._id);

        expect(data.properties).to.be.an('object');
        if (trigger.includes('after')) {
          expect(data.properties.description).to.be.eql(`[${trigger}] - Random value`);
        }
      });
    }
  });
});
