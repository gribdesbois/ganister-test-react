const chai = require('chai');
const chaiHttp = require('chai-http');
const mocha = require('mocha');
const { Spinner } = require('cli-spinner');
const NODEU = require('uuid');
const fs = require('fs');
const _ = require('lodash');

const app = require('./index.js');
const config = require('./config/config');

chai.use(chaiHttp);
const driver = config.db;
const { describe, it } = mocha;
const { expect, should, assert } = chai;

//  Read Datamodel
const data = fs.readFileSync('./build/datamodel.json', 'utf8');
const datamodel = JSON.parse(data);

describe('Test', () => {
  it('Testing server running', done => {
    chai
      .request(app)
      .get('/')
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });
});