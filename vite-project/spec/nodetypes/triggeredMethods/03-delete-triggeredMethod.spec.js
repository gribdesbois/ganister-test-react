const fs = require('fs');

require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../../index');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';
const nodetypeName = 'part';

describe("Delete a nodetype's triggered method", () => {
  beforeEach(async function () {
    const response = await chai
      .request(app)
      .post(`${API_URL}/nodetypes/${nodetypeName}/methods`)
      .set('Authorization', this.token)
      .send({ method: { name: this.method.name } });

    const { newItem } = response.body;
    this.triggeredMethod = newItem;
  });

  context('delete an existing triggered method', () => {
    it('deletes triggered method', async function () {
      const response = await chai
        .request(app)
        .delete(`${API_URL}/nodetypes/${nodetypeName}/methods/${this.triggeredMethod.id}`)
        .set('Authorization', this.token);

      expect(response.status).equal(200);

      expect(response.body.id).to.be.eql(this.triggeredMethod.id);
    });
  });
});
