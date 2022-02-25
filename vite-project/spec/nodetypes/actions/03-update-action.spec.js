require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../../index');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';
const nodetypeName = 'part';


describe('Update an action', () => {
  beforeEach(async function () {
    const response = await chai
      .request(app)
      .post(`${API_URL}/nodetypes/${nodetypeName}/actions`)
      .set('Authorization', this.token)
      .send({ action: { name: 'dumbAction' } });

    const { newItem } = response.body;

    this.action = newItem;
  });

  afterEach(async function () {
    await chai
      .request(app)
      .delete(`${API_URL}/nodetypes/${nodetypeName}/actions/${this.action.id}`)
      .set('Authorization', this.token);
  });

  context('adding a method without params', () => {
    it('adds method', async function () {
      this.action.serverMethod = { name: this.method.name };

      const body = {
        action: {
          attribute: 'serverMethod',
          value: this.action.serverMethod,
        },
      };

      const response = await chai
        .request(app)
        .put(`${API_URL}/nodetypes/${nodetypeName}/actions/${this.action.id}`)
        .set('Authorization', this.token)
        .send(body);

      expect(response.status).eql(200);

      const { nodetype, property } = response.body;

      expect(property.id).to.be.eql(this.action.id);
      expect(property.name).to.be.eql(this.action.name);
      expect(property.accessLevel).to.be.eql('visitor');
      expect(property.availableOn).to.be.oneOf(['nodetype', 'node']);
      expect(property.translations).to.be.an('object');

      expect(nodetype.name).to.be.eql(nodetypeName);
      expect(nodetype.actions).to.be.an('array').and.to.have.lengthOf.at.least(1);
      expect(nodetype.actions).to.deep.include(property);
    });
  });

  context('adding a method with params', () => {
    it('adds method', async function () {
      this.action.serverMethod = {
        name: this.method.name,
        params: { paramsKey: 'Hello, world !' },
      };

      const body = {
        action: {
          attribute: 'serverMethod',
          value: this.action.serverMethod,
        },
      };

      const response = await chai
        .request(app)
        .put(`${API_URL}/nodetypes/${nodetypeName}/actions/${this.action.id}`)
        .set('Authorization', this.token)
        .send(body);

      expect(response.status).eql(200);

      const { nodetype, property } = response.body;

      expect(property.id).to.be.eql(this.action.id);
      expect(property.name).to.be.eql(this.action.name);
      expect(property.accessLevel).to.be.eql('visitor');
      expect(property.availableOn).to.be.oneOf(['nodetype', 'node']);
      expect(property.serverMethod).to.be.eql(this.action.serverMethod);
      expect(property.translations).to.be.an('object');

      expect(nodetype.name).to.be.eql(nodetypeName);
      expect(nodetype.actions).to.be.an('array').and.to.have.lengthOf.at.least(1);
      expect(nodetype.actions).to.deep.include(property);
    });
  });
});

