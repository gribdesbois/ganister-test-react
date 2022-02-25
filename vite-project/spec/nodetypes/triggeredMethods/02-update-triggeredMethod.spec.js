require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../../index');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';
const nodetypeName = 'part';


describe("Update a nodetype's triggered method", () => {
  beforeEach(async function () {
    const response = await chai
      .request(app)
      .post(`${API_URL}/nodetypes/${nodetypeName}/methods`)
      .set('Authorization', this.token)
      .send({ method: { name: this.method.name } });

    const { newItem } = response.body;
    this.triggeredMethod = newItem;
  });

  afterEach(async function () {
    await chai
      .request(app)
      .delete(`${API_URL}/nodetypes/${nodetypeName}/methods/${this.triggeredMethod.id}`)
      .set('Authorization', this.token);
  });

  context('changing method trigger', () => {
    const triggers = [
      'afterGetAll',
      'beforeGet',
      'afterGet',
      'beforeCreate',
      'afterCreate',
      'beforeUpdate',
      'afterUpdate',
      'beforeDelete',
      'afterDelete',
    ];

    /* eslint-disable */
    for (const trigger of triggers) {
        it(`updates trigger to '${trigger}'`, async function () {
        this.triggeredMethod.trigger = trigger;
  
        const body = {
          method: {
            attribute: 'trigger',
            oldValue: '',
            newValue: trigger,
          },
        };
  
        const response = await chai
          .request(app)
          .put(`${API_URL}/nodetypes/${nodetypeName}/methods/${this.triggeredMethod.id}`)
          .set('Authorization', this.token)
          .send(body);
  
        expect(response.status).equal(200);
  
        const { nodetype, property } = response.body;
  
        expect(property).to.be.an('object')
        expect(property.id).to.be.a('string');
        expect(property.name).to.be.eql(this.method.name);
        expect(property.trigger).to.be.eql(trigger);
  
        expect(nodetype).to.be.an('object')
        expect(nodetype.name).to.be.eql(nodetypeName);
        expect(nodetype.methods).to.be.an('array').and.to.have.lengthOf.at.least(1);
        expect(nodetype.methods).to.deep.include(property);
        });
      }
      /* eslint-enable */
  });

  context('changing method params', () => {
    it('updates params', async function () {
      this.triggeredMethod.params = { paramsKey: 'Hello, world!' };

      const response = await chai
        .request(app)
        .put(`${API_URL}/nodetypes/${nodetypeName}/methods/${this.triggeredMethod.id}`)
        .set('Authorization', this.token)
        .send({
          method: {
            attribute: 'params',
            oldValue: '',
            newValue: this.triggeredMethod.params,
          },
        });

      expect(response.status).equal(200);

      const { nodetype, property } = response.body;

      expect(property).to.be.an('object');
      expect(property.id).to.be.a('string');
      expect(property.name).to.be.eql(this.method.name);
      expect(property.params).to.be.eql(this.triggeredMethod.params);

      expect(nodetype).to.be.an('object');
      expect(nodetype.name).to.be.eql(nodetypeName);
      expect(nodetype.methods).to.be.an('array').and.to.have.lengthOf.at.least(1);
      expect(nodetype.methods).to.deep.include(property);
    });
  });
});
