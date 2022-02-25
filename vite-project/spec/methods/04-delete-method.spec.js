require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');

const app = require('../../index');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';


describe('Delete a custom method', () => {
  before(async function () {
    const randomString = faker.datatype.string();
    const methodName = `dumbMethod${randomString}`;

    const response = await chai
      .request(app)
      .post(`${API_URL}/nodetypes/methods`)
      .set('Authorization', this.token)
      .send({ name: methodName });

    const { newMethod } = response.body;
    this.method = newMethod;
  });

  context('an existing method', () => {
    it('deletes method', async function () {
      const response = await chai
        .request(app)
        .delete(`${API_URL}/nodetypes/methods/${this.method.id}`)
        .set('Authorization', this.token);

      expect(response.status).equal(200);

      const { id, error } = response.body;

      expect(error).to.be.false;

      expect(id).to.be.eql(this.method.id);
    });
  });
});
