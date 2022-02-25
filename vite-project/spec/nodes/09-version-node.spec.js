require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../index');
const { mockNodetype, readDatamodel } = require('../helpers');

chai.use(chaiHttp);

const { expect } = chai;

const API_URL = '/api/v0';
let nodetypeName;


describe('Manually version a node', () => {
  before(function () {
    const datamodel = readDatamodel();
    const nodetypeDM = datamodel.nodetypeDefinitions.find((n) => {
      const versionnable = n.versionnable && n.changeMethod === 'manual';
      const lifecycle = n.lifecycle.transitions.length;

      return versionnable && lifecycle;
    });

    this.nodetypeDM = nodetypeDM;
    nodetypeName = nodetypeDM.name;

    const mandatoryProperties = nodetypeDM.properties
      .filter((p) => p.mandatory || p.generated)
      .map((p) => p.name);
    mandatoryProperties.push('_ecoHandled', '_tracked');

    this.mandatoryProperties = mandatoryProperties;
  });

  beforeEach(async function () {
    // create a node
    const nodeData = mockNodetype(nodetypeName);

    const response = await chai
      .request(app)
      .post(`${API_URL}/nodes/${nodetypeName}`)
      .set('Authorization', this.token)
      .send(nodeData);

    expect(response.status).eql(200);

    const { data } = response.body;

    this.node = data;

    // add all lifecycle roles
    const promises = this.nodetypeDM.lifecycle.states.map(async (state) => {
      const role = this.nodetypeDM.lifecycle.roles.find((r) => {
        return r.id === state.owner;
      });

      if (!role) return;

      await chai
        .request(app)
        .post(`${API_URL}/nodes/${data._type}/${data._id}/relationships/lifecycleRole`)
        .set('Authorization', this.token)
        .send({
          target: this.user,
          properties: { role: role.name },
        });
    });
    await Promise.all(promises);

    // promote node until release
    const releaseNode = async (node) => {
      const actualState = this.nodetypeDM.lifecycle.states.find((state) => {
        return state.name === node.properties._state;
      });

      if (actualState.released) return;

      const nextState = this.nodetypeDM.lifecycle.states.find((state) => {
        const formerState = node.properties._promotions.find((p) => {
          return p.fromState === state.name;
        });
        const transition = this.nodetypeDM.lifecycle.transitions.find((t) => {
          return t.from === actualState.id && t.to === state.id;
        });
        return !formerState && transition;
      });

      const promotionResponse = await chai
        .request(app)
        .post(`${API_URL}/nodes/${node._type}/${node._id}/promotions`)
        .set('Authorization', this.token)
        .send({ state: nextState.name, comment: 'ok' });

      const { data: promotedNode } = promotionResponse.body;

      Object.assign(node.properties, promotedNode.properties);
      await releaseNode(node);
    };

    const { body } = await chai
      .request(app)
      .get(`${API_URL}/nodes/${data._type}/${data._id}`)
      .set('Authorization', this.token);

    this.node = body.data;

    await releaseNode(this.node);
  });

  it('creates a new version of node', async function () {
    const response = await chai
      .request(app)
      .post(`${API_URL}/plm/processECONode/${this.node._type}/${this.node._id}`)
      .set('Authorization', this.token)
      .send({ action: 'major' });

    expect(response.status).eql(200);

    const data = response.body;

    expect(data).to.be.an('object');
    expect(data._type).to.be.eql(nodetypeName);
    expect(data._id).to.not.be.eql(this.node._id);

    expect(data.properties).to.be.an('object');
    expect(data.properties).to.have.any.keys(this.node.properties);
    expect(data.properties).to.have.any.keys(this.mandatoryProperties);

    expect(data.properties._promotions).to.be.an('array');

    expect(data.user).to.be.an('object');
    expect(data.user._type).to.be.eql('user');
    expect(data.user._id).to.be.eql(this.user._id);

    expect(data.user.properties).to.be.an('object');
    expect(data.user.properties).to.not.have.any.keys('password', 'changePasswordToken', 'token');
  });
});
