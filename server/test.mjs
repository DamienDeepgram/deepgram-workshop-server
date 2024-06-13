import chai from 'chai';
import chaiHttp from 'chai-http';
const { should } = chai;

import { server } from './index.mjs'; // Ensure this path is correct
import { v4 as uuidv4 } from 'uuid';

should();
chai.use(chaiHttp);

describe('API Tests', function() {
  let callId;
  const newItem = {
    name: 'Burger',
    description: 'Delicious beef burger',
    price: 8.99,
    category: 'Main'
  };

  before(async function() {
    // Start the server before running tests
    if (!server.listening) {
      await new Promise(resolve => server.listen(3001, resolve));
    }
  });

  after(async function() {
    // Close the server after running tests
    if (server.listening) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  describe('GET /menu', () => {
    it('it should GET the menu', (done) => {
      chai.request(server)
        .get('/menu')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          done();
        });
    });
  });

  describe('POST /menu/items', () => {
    it('it should POST an item to the menu', (done) => {
      chai.request(server)
        .post('/menu/items')
        .send(newItem)
        .end((err, res) => {
          res.should.have.status(200);
          res.text.should.equal('successfully added item to menu');
          done();
        });
    });
  });

  describe('POST /calls', () => {
    it('it should CREATE a call', (done) => {
      chai.request(server)
        .post('/calls')
        .end((err, res) => {
          res.should.have.status(200);
          res.text.should.be.a('string');
          callId = res.text;
          console.log('callId:', callId);
          done();
        });
    });
  });

  describe('GET /calls/:id', () => {
    it('it should GET a call by id', (done) => {
      chai.request(server)
        .get(`/calls/${callId}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('id').eql(callId);
          done();
        });
    });
  });

  describe('GET /calls/:id/order', () => {
    it('it should GET an order by call id', (done) => {
      chai.request(server)
        .get(`/calls/${callId}/order`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });

  describe('POST /calls/:id/order/items', () => {
    it('it should ADD an item to an order', (done) => {
      chai.request(server)
        .post(`/calls/${callId}/order/items`)
        .send({ item: newItem.name })
        .end((err, res) => {
          res.should.have.status(200);
          console.log
          res.text.should.equal('We were able to successfully add the item to the order!');
          done();
        });
    });
  });

  describe('DELETE /calls/:id/order/items', () => {
    it('it should REMOVE an item from an order', (done) => {
      chai.request(server)
        .delete(`/calls/${callId}/order/items`)
        .send({ item: newItem.name })
        .end((err, res) => {
          res.should.have.status(200);
          res.text.should.equal('We were able to successfully remove the item from the order!');
          done();
        });
    });
  });

  describe('DELETE /menu/items', () => {
    it('it should DELETE all items from the menu', (done) => {
      chai.request(server)
        .delete('/menu/items')
        .end((err, res) => {
          res.should.have.status(200);
          res.text.should.equal('successfully cleared the menu');
          done();
        });
    });
  });

});
