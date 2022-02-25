require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../../index');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';
const nodetypeName = 'part';


describe("Create a nodetype's triggered method", () => {
  context('with existing method', () => {
    it('adds triggered method', async function () {
      const response = await chai
        .request(app)
        .post(`${API_URL}/nodetypes/${nodetypeName}/methods`)
        .set('Authorization', this.token)
        .send({ method: { name: this.method.name } });

      expect(response.status).equal(200);

      const { nodetype, newItem } = response.body;

      expect(newItem).to.be.an('object');
      expect(newItem.id).to.be.a('string');
      expect(newItem.name).to.be.eql(this.method.name);

      expect(nodetype).to.be.an('object');
      expect(nodetype.name).to.be.eql(nodetypeName);
      expect(nodetype.methods).to.be.an('array').and.to.have.lengthOf.at.least(1);
      expect(nodetype.methods).to.deep.include(newItem);


      // leave clean state
      await chai
        .request(app)
        .delete(`${API_URL}/nodetypes/${nodetypeName}/methods/${newItem.id}`)
        .set('Authorization', this.token);
    });
  });
});
