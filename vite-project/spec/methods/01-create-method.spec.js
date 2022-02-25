const fs = require('fs');

require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');

const app = require('../../index');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';


describe('Create a custom method', () => {
  context('with valid name', () => {
    it('adds method', async function () {
      const randomString = faker.datatype.string();
      const methodName = `dumbMethod${randomString}`;

      const response = await chai
        .request(app)
        .post(`${API_URL}/nodetypes/methods`)
        .set('Authorization', this.token)
        .send({ name: methodName });

      expect(response.status).equal(200);

      const { newMethod, error } = response.body;

      expect(error).to.be.false;

      expect(newMethod.id).to.be.a('string');
      expect(newMethod.name).to.be.eql(methodName.replace(/[^A-Z0-9]/ig, ''));
      expect(newMethod.code).to.be.a('string');
      expect(newMethod.package).to.be.a('string');
      expect(newMethod.serverOrClient).to.be.a('string').and.to.be.oneOf(['server', 'client']);
      expect(newMethod.createdOn).to.be.a('number');

      expect(newMethod.createdBy).to.be.an('object');
      expect(newMethod.createdBy.id).to.be.eql(this.user._id);
      expect(newMethod.createdBy.name).to.be.eql(this.user.properties.name);

      // leave clean state
      fs.unlinkSync(`./api/models/dm/methods/${newMethod.name}.js`);
    });
  });
});
