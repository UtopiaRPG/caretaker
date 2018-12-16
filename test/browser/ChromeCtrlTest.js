/*launch a mp on forumactif with /lib/bot/phantomCtrl.js and checkout with ./phantom.js the receive of mp*/

const ChromeCtrl = require("../../lib/browser/ChromeCtrl");
const expect = require("chai").expect;
const config = require("../configtest.json");

describe("ChromeCtrl", function () {

    it("is connected to forum is false ", async () => {
        this.timeout(60000)
        const ctrl = new ChromeCtrl(config);
        await ctrl.ensureBrowser();
        const connected = await ctrl.isLogged(config.forum);
        expect(connected).to.equal(false);
    });

    it("connect to forum enter in ", async () => {
        this.timeout(60000)
        const ctrl = new ChromeCtrl(config);
        await ctrl.ensureBrowser();
        const page = await ctrl.login(config.forum);
        const testerDiv = await page.waitForSelector('#logout').catch(err => err)
        expect(testerDiv).to.exist;
        expect(page.url()).to.equal(config.forum.link);
    });

	describe('test need to be connected', function () {

		let promiseConnectedCtrl;
		before(function () {
            const ctrl = new ChromeCtrl(config);
			promiseConnectedCtrl = ctrl
				.ensureBrowser()
				.then(() => {
					return ctrl.login(config.forum).then(page => ctrl);
				});
		});

        it("is connected to forum is false ", async () => {
            const connected = await promiseConnectedCtrl.then( ctrl => ctrl.isLogged(config.forum));
            expect(connected).to.equal(true);
        });

		it('list MP', async () => {
			const list = await promiseConnectedCtrl.then(ctrl => ctrl.listMP(config.forum));
			expect(list).to.deep.equal([{
				name: "test mp"
			}])
		});

		it('send MP', async () => {
			const list1 = await promiseConnectedCtrl.then(ctrl => ctrl.listMP(config.forum));
			await promiseConnectedCtrl.then(ctrl => ctrl.sendMP(config.forum, config.forum.account_name, "sendMP", "ceci est un test"));
			const list2 = await promiseConnectedCtrl.then(ctrl => ctrl.listMP(config.forum));
			expect(list1.length + 1).to.equal(list2.length)
		});

		it('send MP to an inexistant user must fail', async () => {
			return promiseConnectedCtrl.then(ctrl => ctrl.sendMP(config.forum, config.name, "sendMPMustFail", "ceci est un test"))
				.then(() => expect("no error throw").to.equal(null)).catch(err => expect(err).to.exist);
		});
	})
});
