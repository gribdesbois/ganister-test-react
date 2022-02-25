require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');

const Database = require('../../api/modules/database');

const app = require('../../index');
const { mockNodetype, readDatamodel } = require('../helpers');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';

describe('Login', () => {
  before(async function () {
    const datamodel = readDatamodel();
    const nodetypeDM = datamodel.nodetypeDefinitions.find((n) => n.name === 'user');

    const { properties } = nodetypeDM;

    const mandatoryProperties = properties
      .filter((p) => p.mandatory || p.generated)
      .map((p) => p.name);
    mandatoryProperties.push('_ecoHandled', '_tracked');

    this.mandatoryProperties = mandatoryProperties;

    const body = mockNodetype('user');
    body.properties.active = true;
    body.properties._isAdmin = false;

    const response = await chai
      .request(app)
      .post(`${API_URL}/nodes/user`)
      .set('Authorization', this.token)
      .send(body);

    expect(response.status).eql(200);

    const { data } = response.body;
    const { email } = data.properties;

    this.user = data;

    const token = 'changepasswordtoken';
    const query = `
      MATCH (u:user { email: $email })
      SET u.changePasswordToken = $token
      RETURN u`;
    const params = { email, token };
    await Database.runQuery(query, params);

    const password = 'ganister';

    await chai
      .request(app)
      .post(`${API_URL}/users/changepassword`)
      .send({ email, token, password });

    this.user.properties.password = password;
  });

  context('with wrong credentials', async () => {
    it('returns 401', async () => {
      const email = faker.internet.email();
      const password = faker.datatype.string();

      const response = await chai
        .request(app)
        .post(`${API_URL}/users/signin`)
        .send({ email, password });

      expect(response.status).eql(401);
    });
  });

  context('with right credentials', async () => {
    it('returns 200', async function () {
      const { email, password } = this.user.properties;

      const response = await chai
        .request(app)
        .post(`${API_URL}/users/signin`)
        .send({ email, password });

      expect(response.status).eql(200);

      const data = response.body;

      expect(data).to.be.an('object');

      expect(data._type).to.be.eql('user');
      expect(data._id).to.be.a('string');

      expect(data.properties).to.be.an('object');
      expect(data.properties).to.have.any.keys(this.mandatoryProperties);
      expect(data.properties).to.not.have.any.keys('password', 'changePasswordToken');

      expect(data.properties.email).to.be.eql(email);
      expect(data.properties.token).to.be.a('string');
      expect(data.properties.active).to.be.true;
    });
  });
});

