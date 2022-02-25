require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');

const app = require('../../../index');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';
const nodetypeName = 'part';


describe('Create an action', () => {
  context('on nodetype', async () => {
    it('adds action', async function () {
      const actionName = faker.datatype.string();

      const response = await chai
        .request(app)
        .post(`${API_URL}/nodetypes/${nodetypeName}/actions`)
        .set('Authorization', this.token)
        .send({ action: { name: actionName } });

      expect(response.status).eql(200);

      const { nodetype, newItem } = response.body;

      expect(newItem.id).to.be.an('string');
      expect(newItem.name).to.be.eql(actionName);
      expect(newItem.accessLevel).to.be.eql('visitor');
      expect(newItem.availableOn).to.be.oneOf(['nodetype', 'node']);
      expect(newItem.translations).to.be.an('object');

      expect(nodetype.name).to.be.eql(nodetypeName);
      expect(nodetype.actions).to.be.an('array').and.to.have.lengthOf.at.least(1);
      expect(nodetype.actions).to.deep.include(newItem);


      // leave clean state
      await chai
        .request(app)
        .delete(`${API_URL}/nodetypes/${nodetypeName}/actions/${newItem.id}`)
        .set('Authorization', this.token);
    });
  });
});

