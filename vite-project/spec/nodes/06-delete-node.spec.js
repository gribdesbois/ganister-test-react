require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../index');
const { mockNodetype } = require('../helpers');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';
const nodetypeName = 'part';


describe('Delete a node', () => {
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
  });

  context('created by user', () => {
    it('deletes node', async function () {
      const response = await chai
        .request(app)
        .delete(`${API_URL}/nodes/${nodetypeName}/${this.node._id}`)
        .set('Authorization', this.token);

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data).to.be.an('object');
      expect(data).to.not.have.keys('properties');

      expect(data._type).to.be.eql(nodetypeName);
      expect(data._id).to.be.eql(this.node._id);
      expect(data.message).to.be.a('string');

      expect(data.user).to.be.an('object');
      expect(data.user._type).to.be.eql('user');
      expect(data.user._id).to.be.eql(this.user._id);
      expect(data.user).to.not.have.any.keys('properties', 'hasAccess', 'correctPath');
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

    for (const trigger of ['beforeDelete', 'afterDelete']) {
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
          .delete(`${API_URL}/nodes/${nodetypeName}/${this.node._id}`)
          .set('Authorization', this.token);

        expect(response.status).eql(200);

        const { data, errors } = response.body;

        expect(errors).to.be.an('array').and.to.have.lengthOf(1);
        expect(errors[0]).to.have.property('message').eql(trigger);

        expect(data).to.be.an('object');
        expect(data._type).to.be.eql(nodetypeName);
        expect(data._id).to.be.eql(this.node._id);
      });
    }
  });
});
