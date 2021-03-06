/* eslint-disable no-trailing-spaces */
/* eslint-disable handle-callback-err */
/* eslint-disable no-unused-vars */
/* eslint-disable indent */
/* eslint-disable prefer-arrow-callback */
const _ = require("lodash");
const tlib = require('../../share/test-lib');
const chai = require('chai')
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = 'http://localhost:1337';
const expect = chai.expect;
const assert = chai.assert;

describe('Dataset Model', function() {

  it('init agent', function() {
    // this preserves session data for subsequent calls
    agent = chai.request.agent(server);
  });
  describe('Dataset.find()', function() {
    it('should check find function', function (done) {
      Dataset.find()
      .then(function(results) {
        assert.equal(results[0].name,"Volvox","Get item found");
        done();
      })
      .catch(done);
    });
  });
  describe('Dataset.Get', function() {
    it('should check Get function', async function () {
      let found = await Dataset.Get({id:1});
      assert.equal(found[0].name,"Volvox","Get item found");
    });
  });
  describe('Dataset.Get', function() {
    it('should negative Get function', async function () {
      let found = await Dataset.Get({id:100});
      assert.equal(found.length,0,"Get item not found");
    });
  });
  describe('Dataset.Resolve', function() {
    it('should get dataset given path', function (done) {
      let dataset = Dataset.Resolve("sample_data/json/volvox");
      assert.equal(dataset.id,1,"resolve should be id=1");
      assert.equal(dataset.path,"sample_data/json/volvox","resolve should be path=sample_data/json/volvox");
      done();
    });
  });
  describe('Dataset.Resolve', function() {
    it('should get dataset given id', function (done) {
      let dataset = Dataset.Resolve("sample_data/json/volvox");
      assert.equal(dataset.id,1,"resolve should be id=1");
      assert.equal(dataset.path,"sample_data/json/volvox","resolve should be path=sample_data/json/volvox");
      done();
    });
  });
  describe('Dataset.Resolve', function() {
    it('should get an error and return null given id that is not in list', function (done) {
      let dataset = Dataset.Resolve("not-here");
      assert.equal(dataset,null,"resolve value not found");
      done();
    });
  });
  it('should call /dataset/get', function(done) {
        
      let geturl = '/dataset/get';

      agent
        .get(geturl)
        .set('content-type','application/json; charset=utf-8')
        .end((err,res,body) => {
            console.log('/dataset/get verify',res.body);
            expect(res).to.have.status(200, 'status 200');
            assert.equal(res.body[0].name,'Volvox', 'verify name of dataset is Volvox');

            done();
        });
  });
  
});
