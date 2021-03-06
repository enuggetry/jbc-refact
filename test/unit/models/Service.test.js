const _ = require("lodash");
const tlib = require('../../share/test-lib');
const chai = require('chai')
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = 'http://localhost:1337';
const expect = chai.expect;
const assert = chai.assert;


describe('ServiceModel model testingk...', function() {
    /*
    describe('#basic', function() {
        it('should check that find function returns no services', () => {
            return Service.find()
                .then((foundServices) =>{
                    console.log('found '+foundServices.length+' services!')
                    assert.equal(foundServices.length,0)
                })
        });
    });
    */
    describe("#service operations", () => {
        it('should be able to add a service with serviceProc', (done) => {
            let testWorkflowSvc = require('../../data/testWorkflowService');

            // test workflow add service
            let service = {
                name:   'test_workflow',
                type:   'workflow',
                module: 'test',
                handler: testWorkflowSvc                    
            };

            (async() => {
                try {
                    let ret = await Service.Add(service);

                    let foundServices = await Service.find({name:'test_workflow'});
                    assert.equal(foundServices.length,1)
                    console.log(foundServices)
                    done();
                }
                catch (err) {
                    done(err);
                }
            })();
        });
    });
    it('should call rest /service/get', function(done) {
        agent
          .get('/service/get')
          .set('content-type','application/json; charset=utf-8')
          .end((err,res,body) => {
                console.log("/service/get",res.body);
                expect(res).to.have.status(200);
                done();
          });
    });
});
