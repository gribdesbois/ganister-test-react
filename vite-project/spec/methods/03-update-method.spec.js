const fs = require('fs');

require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');

const app = require('../../index');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';


describe('Update a custom method', () => {
  beforeEach(async function () {
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

  afterEach(async function () {
    const path = `./api/models/dm/methods/${this.method.name}.js`;
    fs.unlinkSync(path);
  });


  context('with valid data', () => {
    it('updates method', async function () {
      const response = await chai
        .request(app)
        .put(`${API_URL}/nodetypes/methods/${this.method.id}`)
        .set('Authorization', this.token)
        .send({ method: this.method });

      expect(response.status).equal(200);

      const { updatedMethod, error } = response.body;

      expect(error).to.be.false;

      expect(updatedMethod.id).to.be.a('string');
      expect(updatedMethod.name).to.be.eql(this.method.name);
      expect(updatedMethod.code).to.be.a('string');
      expect(updatedMethod.package).to.be.a('string');
      expect(updatedMethod.serverOrClient).to.be.a('string').and.to.be.oneOf(['server', 'client']);
      expect(updatedMethod.createdOn).to.be.a('number');

      expect(updatedMethod.createdBy).to.be.an('object');
      expect(updatedMethod.createdBy.id).to.be.eql(this.user._id);
      expect(updatedMethod.createdBy.name).to.be.eql(this.user.properties.name);
    });
  });
});
