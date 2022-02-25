require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../index');
const { mockNodetype, readDatamodel } = require('../helpers');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';
const nodetypeName = 'part';


describe('Get nodes', () => {
  before(function () {
    const datamodel = readDatamodel();
    const nodetypeDM = datamodel.nodetypeDefinitions.find((n) => n.name === nodetypeName);

    this.nodetypeDM = nodetypeDM;

    const mandatoryProperties = nodetypeDM.properties
      .filter((p) => p.mandatory || p.generated)
      .map((p) => p.name);

    this.mandatoryProperties = mandatoryProperties;
  });

  beforeEach(async function () {
    const body = mockNodetype(nodetypeName);

    const response = await chai
      .request(app)
      .post(`${API_URL}/nodes/${nodetypeName}`)
      .set('Authorization', this.token)
      .send(body);

    expect(response.status).eql(200);

    const { data } = response.body;

    this.node = data;

    delete this.node.user;
    delete this.node.properties._ecoHandled;
  });

  context('Get all accessible nodes', () => {
    it('gets nodes', async function () {
      const response = await chai
        .request(app)
        .get(`${API_URL}/nodes/${nodetypeName}`)
        .set('Authorization', this.token);

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data)
        .to.be.an('array')
        .and.to.have.lengthOf.at.least(1)
        .and.to.deep.include(this.node);

      data.map((node) => {
        expect(node.properties).to.have.any.keys(this.mandatoryProperties);
      });
    });
  });

  context('get filtered accessible nodes', () => {
    it('searches nodes', async function () {
      const maxResults = 10;

      const response = await chai
        .request(app)
        .post(`${API_URL}/nodes/${nodetypeName}/search?maxResult=${maxResults}`)
        .set('Authorization', this.token);

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data)
        .to.be.an('array')
        .and.to.have.lengthOf.at.most(maxResults)
        .and.to.deep.include(this.node);

      data.map((node) => {
        expect(node.properties).to.have.any.keys(this.mandatoryProperties);
      });
    });
  });
});
