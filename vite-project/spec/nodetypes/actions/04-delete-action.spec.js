require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../../index');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';
const nodetypeName = 'part';


describe('Delete an action', () => {
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

  context('on nodetype', () => {
    it('deletes action', async function () {
      const response = await chai
        .request(app)
        .delete(`${API_URL}/nodetypes/${nodetypeName}/actions/${this.action.id}`)
        .set('Authorization', this.token);

      expect(response.status).eql(200);

      const { item } = response.body;

      expect(item.name).to.be.eql(nodetypeName);
      expect(item.actions).to.not.deep.include(this.action);
    });
  });
});

