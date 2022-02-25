require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../../../index');
const { readDatamodel } = require('../../../helpers');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';
const nodetypeName = 'part';


describe("Update nodetype's lifecycle's transition", () => {
  beforeEach(async function () {
    const methodResponse = await chai
      .request(app)
      .post(`${API_URL}/nodetypes/methods`)
      .set('Authorization', this.token)
      .send({ name: 'dumbMethod' });

    const { newMethod } = methodResponse.body;
    this.method = newMethod;

    const datamodel = readDatamodel();
    const nodetype = datamodel.nodetypeDefinitions.find((n) => n.name === nodetypeName);
    const { states = [], transitions = [] } = nodetype.lifecycle;

    const start = states.find((s) => s.start);
    const filteredTransitions = transitions.filter((t) => t.from === start.id);
    const unavailableStates = filteredTransitions
      .map((t) => t.to)
      .concat(start.id);

    const target = states.find((s) => !unavailableStates.includes(s.id));

    const body = { transition: { from: start.id, to: target.id } };

    const transitionResponse = await chai
      .request(app)
      .post(`${API_URL}/nodetypes/${nodetypeName}/lifecycle/transitions`)
      .set('Authorization', this.token)
      .send(body);

    const { transition } = transitionResponse.body;
    this.transition = transition;
  });

  afterEach(async function () {
    await chai
      .request(app)
      .delete(`${API_URL}/nodetypes/${nodetypeName}/lifecycle/transitions/${this.transition.id}`)
      .set('Authorization', this.token);

    await chai
      .request(app)
      .delete(`${API_URL}/nodetypes/methods/${this.method.id}`)
      .set('Authorization', this.token);
  });

  context("adding a transition's method", () => {
    it('adds method without params', async function () {
      this.transition.server_pre = [{ name: this.method.name }];

      const response = await chai
        .request(app)
        .put(`${API_URL}/nodetypes/${nodetypeName}/lifecycle/transitions/${this.transition.id}`)
        .set('Authorization', this.token)
        .send({
          transition: {
            attribute: 'server_pre',
            newValue: this.transition.server_pre,
          },
        });

      expect(response.status).eql(200);

      const { transition, nodetype } = response.body;

      expect(transition).eql(this.transition);

      expect(nodetype.name).to.be.eql(nodetypeName);

      expect(nodetype.lifecycle).to.be.an('object');
      expect(nodetype.lifecycle.transitions)
        .to.have.be.an('array')
        .and.to.deep.include(this.transition);
    });

    it('adds method with params', async function () {
      this.transition.server_pre = [
        {
          name: this.method.name,
          params: { paramsKey: 'Hello, world!' },
        },
      ];

      const response = await chai
        .request(app)
        .put(`${API_URL}/nodetypes/${nodetypeName}/lifecycle/transitions/${this.transition.id}`)
        .set('Authorization', this.token)
        .send({
          transition: {
            attribute: 'server_pre',
            newValue: this.transition.server_pre,
          },
        });

      expect(response.status).eql(200);

      const { transition, nodetype } = response.body;

      expect(transition).eql(this.transition);

      expect(nodetype.name).to.be.eql(nodetypeName);

      expect(nodetype.lifecycle).to.be.an('object');
      expect(nodetype.lifecycle.transitions)
        .to.have.be.an('array')
        .and.to.deep.include(this.transition);
    });
  });

  context('deleting a method', () => {
    it('deletes method', async function () {
      this.transition.server_pre = [];

      const response = await chai
        .request(app)
        .put(`${API_URL}/nodetypes/${nodetypeName}/lifecycle/transitions/${this.transition.id}`)
        .set('Authorization', this.token)
        .send({
          transition: {
            attribute: 'server_pre',
            newValue: this.transition.server_pre,
          },
        });

      expect(response.status).eql(200);

      const { transition, nodetype } = response.body;

      expect(transition).eql(this.transition);

      expect(nodetype.name).to.be.eql(nodetypeName);

      expect(nodetype.lifecycle).to.be.an('object');
      expect(nodetype.lifecycle.transitions)
        .to.have.be.an('array')
        .and.to.deep.include(this.transition);
    });
  });
});
