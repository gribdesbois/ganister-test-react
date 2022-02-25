const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../index');
const mockData = require('./mockData');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';


before('Log in user and create default data', async function () {
  // create a default user
  const userResponse = await chai
    .request(app)
    .post(`${API_URL}/users/signin`)
    .send({ email: 'test@ganister.eu', password: 'ganister' });

  expect(userResponse.status).eql(200);

  this.user = userResponse.body;
  this.token = userResponse.body.properties.token;


  // create a default custom method
  const { method } = mockData;

  const addMethodResponse = await chai
    .request(app)
    .post(`${API_URL}/nodetypes/methods`)
    .set('Authorization', this.token)
    .send({ name: method.name });

  const { newMethod } = addMethodResponse.body;

  const methodResponse = await chai
    .request(app)
    .put(`${API_URL}/nodetypes/methods/${newMethod.id}`)
    .set('Authorization', this.token)
    .send({ method });

  const { updatedMethod } = methodResponse.body;

  this.method = updatedMethod;
});

after(async function () {
  await chai
    .request(app)
    .delete(`${API_URL}/nodetypes/methods/${this.method.id}`)
    .set('Authorization', this.token);
});
