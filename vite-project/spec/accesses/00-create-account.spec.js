require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../index');
const { mockNodetype, readDatamodel } = require('../helpers');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';

describe('Create an account', () => {
  before(async function () {
    const datamodel = readDatamodel();
    const nodetypeDM = datamodel.nodetypeDefinitions.find((n) => n.name === 'user');

    const { properties } = nodetypeDM;

    const mandatoryProperties = properties
      .filter((p) => p.mandatory || p.generated)
      .map((p) => p.name);
    mandatoryProperties.push('_ecoHandled', '_tracked');

    this.mandatoryProperties = mandatoryProperties;
  });

  context('with valid email and valid password', () => {
    it('creates account', async function () {
      const user = mockNodetype('user');

      const response = await chai
        .request(app)
        .post(`${API_URL}/nodes/user`)
        .set('Authorization', this.token)
        .send(user);

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data).to.be.an('object').and.to.have.all.keys('_type', '_id', 'properties', 'user');

      expect(data._type).to.be.eql('user');
      expect(data._id).to.be.a('string');

      expect(data.properties).to.be.an('object');
      expect(data.properties).to.include(user.properties);
      expect(data.properties).to.have.any.keys(this.mandatoryProperties);
      expect(data.properties).to.not.have.any.keys('password', 'token', 'changePasswordToken');

      expect(data.user).to.be.an('object');
      expect(data.user._type).to.be.eql('user');
      expect(data.user._id).to.be.eql(this.user._id);
      expect(data.user.properties).to.be.an('object');
      expect(data.user.properties).to.not.have.any.keys('password', 'changePasswordToken', 'token');
    });
  });
});

