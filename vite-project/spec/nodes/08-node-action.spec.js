require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');

const app = require('../../index');
const { mockNodetype } = require('../helpers');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';
const nodetypeName = 'part';


describe("Check nodetype's action execution", () => {
  beforeEach(async function () {
    const actionResponse = await chai
      .request(app)
      .post(`${API_URL}/nodetypes/${nodetypeName}/actions`)
      .set('Authorization', this.token)
      .send({ action: { name: faker.datatype.string() } });

    const { newItem } = actionResponse.body;

    this.action = newItem;

    const node = mockNodetype(nodetypeName);

    const response = await chai
      .request(app)
      .post(`${API_URL}/nodes/${nodetypeName}`)
      .set('Authorization', this.token)
      .send(node);

    const { data } = response.body;

    this.node = data;
  });

  afterEach(async function () {
    await chai
      .request(app)
      .delete(`${API_URL}/nodetypes/${nodetypeName}/actions/${this.action.id}`)
      .set('Authorization', this.token);
  });

  context('action without params', () => {
    beforeEach(async function () {
      const response = await chai
        .request(app)
        .put(`${API_URL}/nodetypes/${nodetypeName}/actions/${this.action.id}`)
        .set('Authorization', this.token)
        .send({
          action: {
            attribute: 'serverMethod',
            value: { name: this.method.name },
          },
        });

      const { property } = response.body;

      this.action = property;
    });

    it('runs action', async function () {
      const response = await chai
        .request(app)
        .post(`${API_URL}/nodes/${this.node._type}/${this.node._id}/actions/${this.action.id}`)
        .set('Authorization', this.token)
        .send({ context: { node: this.node } });

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data).to.be.an('object');
      expect(data._type).to.be.eql(nodetypeName);
      expect(data._id).to.be.eql(this.node._id);

      expect(data.properties).to.be.an('object');
      expect(data.properties.customProperty).to.be.eql(`[${this.action.id}] - Random value`);
    });
  });

  context('action with params', () => {
    beforeEach(async function () {
      const response = await chai
        .request(app)
        .put(`${API_URL}/nodetypes/${nodetypeName}/actions/${this.action.id}`)
        .set('Authorization', this.token)
        .send({
          action: {
            attribute: 'serverMethod',
            value: {
              name: this.method.name,
              params: { paramsKey: 'Hello, world!' },
            },
          },
        });

      const { property } = response.body;

      this.action = property;
    });

    it('runs action', async function () {
      const response = await chai
        .request(app)
        .post(`${API_URL}/nodes/${this.node._type}/${this.node._id}/actions/${this.action.id}`)
        .set('Authorization', this.token)
        .send({ context: { node: this.node } });

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data).to.be.an('object');
      expect(data._type).to.be.eql(nodetypeName);
      expect(data._id).to.be.eql(this.node._id);

      expect(data.properties).to.be.an('object');
      expect(data.properties.customProperty).to.be.eql(`[${this.action.id}] - Hello, world!`);
    });
  });
});
