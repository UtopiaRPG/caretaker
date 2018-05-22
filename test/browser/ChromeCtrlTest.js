/*launch a mp on forumactif with /lib/bot/phantomCtrl.js and checkout with ./phantom.js the receive of mp*/

const ChromeCtrl = require( "../../lib/browser/ChromeCtrl" );
const expect = require( "chai" ).expect;
const config = require( "../configtest.json" );

describe( "ChromeCtrl", function () {
  it( "connect to forum enter in ", async() => {
    this.timeout( 60000 )
    const ctrl = await new ChromeCtrl( config );
    const page = await ctrl.login();
    const testerDiv = await page.waitForSelector( '#logout' ).catch( err => err )
    expect( testerDiv ).to.exist;
    expect( page.url() ).to.equal( config.forum.link );
  } );


  describe( 'test need to be connected', function () {

    let promiseConnectedCtrl;
    before( function () {
      promiseConnectedCtrl = new ChromeCtrl( config ).then( ctrl => {
        return ctrl.login().then( page => ctrl );
      } )
    } );

    it( 'send MP', async() => {
      const list1 = await promiseConnectedCtrl.then( ctrl => ctrl.listMP() );
      await promiseConnectedCtrl.then( ctrl => ctrl.sendMP( config.name, "sendMP", "ceci est un test" ) )
      const list2 = await promiseConnectedCtrl.then( ctrl => ctrl.listMP() )
      expect( list1.length + 1 ).to.equal( list2.length )
    } )

    it( 'send MP to an inexistant user must fail', async() => {
        return promiseConnectedCtrl.then( ctrl => ctrl.sendMP( config.name, "sendMPMustFail", "ceci est un test" ) )
        .then(() => expect("no error throw").to.equal(null)).catch( err => expect(err).to.exist);
    } )

    it( 'remove received MP', async() => {
      await promiseConnectedCtrl
        .then( ctrl => {
          ctrl.sendMP( config.name, "mustBeDelete", "ceci est un test" );
          return ctrl;
        } )
        .then( ctrl => {
          ctrl.sendMP( config.name, "mustBeKeep", "ceci est un test" );
          return ctrl;
        } )
        .then( ctrl => ctrl.removeReceiveMP("mustBeDelete", config.name) )
      const list = await promiseConnectedCtrl.then( ctrl => ctrl.listMP() )
      expect( list.find( mp => mp.name =="mustBeDelete" ) ).to.not.exist;
      expect( list.find( mp => mp.name =="mustBeKeep" ) ).to.exist;
    } )

    it( 'remove all received MP', async() => {
      await promiseConnectedCtrl.then( ctrl => ctrl.removeAllMP( ) )
      const list = await promiseConnectedCtrl.then( ctrl => ctrl.listMP() )
      expect( list.length ).to.equal( 0)
    } )
  } )
} );
