import { describe, it, before, after } from 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import Bukalapak from '../src/bukalapak';

chai.use(chaiAsPromised);

let LocalStorage = require('node-localstorage').LocalStorage;
let localStorage = new LocalStorage('./local_storage');

let baseUrl = 'http://api.blstage2.org';
let options = { baseUrl: baseUrl, storage: localStorage };
let username = 'subosito';
let password = 'PLBjwqlb6hWowBDlbqb0n2Vp0b1wky';
let oauthParams = {
  clientId: 'fdd65d2cbf8697b05722ed77c37b2f8d0b77ec08952574acc37dc904081be49e',
  clientSecret: '14924d9b892dee0c33259ceab9b881622209a597c8bae032358c44cf2daeb357',
  scope: 'public user',
  subdomain: 'www'
};

describe('integration', () => {
  let client;

  before(() => {
    localStorage.removeItem('access_token');
    client = new Bukalapak(options);
  });

  after(() => {
    localStorage.removeItem('access_token');
  });

  it('use auth adapter', () => {
    let promise = client.useAdapter('auth', oauthParams).then(() => { return client.storage.getItem('access_token'); });

    return Promise.all([
      expect(promise).to.eventually.have.property('token_type', 'bearer'),
      expect(promise).to.eventually.have.property('expires_in', 7200),
      expect(promise).to.eventually.have.property('scope', 'public'),
      expect(promise).to.eventually.have.property('access_token'),
      expect(promise).to.eventually.have.property('created_at')
    ]);
  });

  it('use api adapter (as client)', () => {
    client.useAdapter('api');

    let promise = client.api.products().then((response) => { return response.json(); });

    return Promise.all([
      expect(promise).to.eventually.have.property('products'),
      expect(promise).to.eventually.have.property('metadata')
    ]);
  });

  it('logged in as user', () => {
    let clientToken = client.storage.getItem('access_token');
    let promise = client.auth.login(username, password).then(() => { return client.storage.getItem('access_token'); });

    return Promise.all([
      expect(promise).to.eventually.have.property('token_type', 'bearer'),
      expect(promise).to.eventually.have.property('expires_in', 7200),
      expect(promise).to.eventually.have.property('scope', 'public user'),
      expect(promise).to.eventually.not.have.property('access_token', clientToken.access_token),
      expect(promise).to.eventually.have.property('created_at'),
      expect(promise).to.eventually.have.property('refresh_token')
    ]);
  });

  it('use api adapter (as user)', () => {
    client.useAdapter('api');

    let promise = client.api.me().then((response) => { return response.json(); });

    return Promise.all([
      expect(promise).to.eventually.have.property('username', 'subosito'),
      expect(promise).to.eventually.have.property('name', 'Alif Rachmawadi'),
      expect(promise).to.eventually.have.property('email', 'subosito@bukalapak.com')
    ]);
  });
});