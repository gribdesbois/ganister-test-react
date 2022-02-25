require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../index');
const { mockNodetype, readDatamodel } = require('../helpers');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';
const nodetypeName = 'part';


describe('Promote a node', () => {
  before(function () {
    const datamodel = readDatamodel();
    const nodetypeDM = datamodel.nodetypeDefinitions.find((n) => n.name === nodetypeName);

    this.nodetypeDM = nodetypeDM;

    const mandatoryProperties = nodetypeDM.properties
      .filter((p) => p.mandatory || p.generated)
      .map((p) => p.name);
    mandatoryProperties.push('_ecoHandled', '_tracked');

    this.mandatoryProperties = mandatoryProperties;
  });

  beforeEach(async function () {
    const node = mockNodetype(nodetypeName);

    const response = await chai
      .request(app)
      .post(`${API_URL}/nodes/${nodetypeName}`)
      .set('Authorization', this.token)
      .send(node);

    expect(response.status).eql(200);

    const { data } = response.body;

    this.node = data;

    const { states = [], transitions = [] } = this.nodetypeDM.lifecycle || {};

    const actualState = states.find((s) => s.name === this.node.properties._state);
    const transition = transitions.find((t) => t.from === actualState?.id);
    const targetState = states.find((s) => s.id === transition.to);

    this.transition = transition;
    this.targetState = targetState;

    this.promotion = {
      fromState: this.node.properties._state,
      toState: this.targetState.name,
      user: {
        name: this.user.properties.name,
        _id: this.user._id,
      },
      comment: 'OK',
      _version: this.node.properties._version,
    };
  });

  context('promotable node with valid data', () => {
    it('promotes node', async function () {
      const { name, lockable = false, tracked = false } = this.targetState || {};

      const response = await chai
        .request(app)
        .post(`${API_URL}/nodes/${nodetypeName}/${this.node._id}/promotions`)
        .set('Authorization', this.token)
        .send({ state: name, comment: 'OK' });

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data).to.be.an('object');
      expect(data._type).to.be.eql(nodetypeName);
      expect(data._id).to.be.eql(this.node._id);

      expect(data.properties).to.be.an('object');
      expect(data.properties).to.have.any.keys(this.node.properties);
      expect(data.properties).to.have.any.keys(this.mandatoryProperties);

      expect(data.properties._state).to.be.eql(name);
      expect(data.properties._lockable).to.be.eql(lockable);
      expect(data.properties._tracked).to.be.eql(tracked);
      expect(data.properties._promotions).to.be.an('array').and.to.have.lengthOf(1);
      expect(data.properties._promotions[0]).to.deep.include(this.promotion);

      expect(data.user).to.be.an('object');
      expect(data.user._type).to.be.eql('user');
      expect(data.user._id).to.be.eql(this.user._id);

      expect(data.user.properties).to.be.an('object');
      expect(data.user.properties).to.not.have.any.keys('password', 'changePasswordToken', 'token');
    });
  });

  context("promotion with transition's method", () => {
    before(async function () {
      const transitionMethods = [
        {
          name: this.method.name,
          params: { paramsKey: 'Hello, world!' },
        },
      ];

      await chai
        .request(app)
        .put(`${API_URL}/nodetypes/${nodetypeName}/lifecycle/transitions/${this.transition.id}`)
        .set('Authorization', this.token)
        .send({
          transition: {
            attribute: 'server_pre',
            newValue: transitionMethods,
          },
        });

      await chai
        .request(app)
        .put(`${API_URL}/nodetypes/${nodetypeName}/lifecycle/transitions/${this.transition.id}`)
        .set('Authorization', this.token)
        .send({
          transition: {
            attribute: 'server_post',
            newValue: transitionMethods,
          },
        });
    });

    it('promotes node', async function () {
      const { name, lockable = false, tracked = false } = this.targetState || {};

      const response = await chai
        .request(app)
        .post(`${API_URL}/nodes/${this.node._type}/${this.node._id}/promotions`)
        .set('Authorization', this.token)
        .send({ state: name, comment: 'OK' });

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data).to.be.an('object');
      expect(data._type).to.be.eql(nodetypeName);
      expect(data._id).to.be.eql(this.node._id);

      expect(data.properties).to.be.an('object');
      expect(data.properties).to.have.any.keys(this.node.properties);
      expect(data.properties).to.have.any.keys(this.mandatoryProperties);

      expect(data.properties._state).to.be.eql(name);
      expect(data.properties._lockable).to.be.eql(lockable);
      expect(data.properties._tracked).to.be.eql(tracked);

      expect(data.user).to.be.an('object');
      expect(data.user._type).to.be.eql('user');
      expect(data.user._id).to.be.eql(this.user._id);

      expect(data.user.properties).to.be.an('object');
      expect(data.user.properties).to.not.have.any.keys('password', 'changePasswordToken', 'token');
    });

    it('runs transition method', async function () {
      const response = await chai
        .request(app)
        .post(`${API_URL}/nodes/${this.node._type}/${this.node._id}/promotions`)
        .set('Authorization', this.token)
        .send({ state: this.targetState.name, comment: 'OK' });

      expect(response.status).eql(200);

      const { data, errors } = response.body;

      expect(errors).to.be.an('array').and.to.have.lengthOf(0);

      expect(data.properties.name).to.be.eql('[beforePromotion] - Hello, world!');
      expect(data.properties.description).to.be.eql('[afterPromotion] - Hello, world!');
      expect(data.properties._promotions).to.be.an('array').and.to.have.lengthOf(1);
      expect(data.properties._promotions[0]).to.deep.include(this.promotion);
    });
  });
});
