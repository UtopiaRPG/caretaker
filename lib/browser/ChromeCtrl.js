var puppeteer = require("puppeteer")

class ChromeCtrl {
    constructor(config, browser=null) {
        this.loadConfig(config);
        this.browser = browser;
    }

    /*public api*/
    ensureBrowser() {
        if (this.browser) {
            return Promise.resolve(this);
        } else {
            return puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }).then(b => {
                this.browser = b;
                return this;
            });
        }
    }

    loadConfig(config) {
        this.config = {
            name: config.name || "utopiaBot",
            password: config.password,
            link: config.forum.link,
            message: config.message || "voici le token pour Discord : \n \n !UB token {token}",
            subject: config.messageTitle || "Token Discord"
        };
    }

    login(forum) {
        return this._newPage().then(page => {
            return this._goTo(forum, page, '/login?').then(response => {
                if (response.ok()) {
                    return this._log(page, 'login').then(page => {
                        return this._acceptRGPD(page).then((page)=> {
                            return this._fillForm(page, '/login', {
                                username: forum.account_name,
                                password: forum.account_password
                            }).then(form => {
                                return this._log(page, "loginfill").then(page => form)
                            }).then(form => {
                                return form.$x('//*[@name="login"]').then(elements => {
                                    return Promise.all([
                                        page.waitForNavigation().then(()=>{
                                            console.log("navigation")
                                            return page.waitForSelector("#logout")
                                        }), // The promise resolves after navigation has finished
                                        elements[0].click(), // Clicking the link will indirectly cause a navigation
                                    ]).then(()=> page);
                                })
                            })
                        })
                    }).then(page => {
                        return this._log(page, "connectedMaybe")
                    })
                } else {
                    throw new Error("connection fail")
                }
            })
        })
    }

    isLogged(forum) {
        return this._newPage().then(page => {
            return this._goTo(forum, page, '').then(response => {
                if (response.ok()) {
                    return page.waitForSelector("#logout", {timeout: 8000}).then(() => true, ()=>false)
                } else {
                    throw new Error("connection fail");
                }
            })
        })
    }

    listMP(forum) {
        return this._newPage().then(page => {
            return this._goTo(forum, page, '/privmsg?folder=inbox&').then(response => {
                return page.$x('//*[@class="box-content"]//td[.//*[@class="topictitle"]]')
            }).then(elements => {
                return Promise.all(elements.map(tdElement =>
                    tdElement.$x('//*[@class="topictitle"]').then(elements => {
                        return elements[0].getProperty('innerHTML')
                    }).then(handle => {
                        return handle.jsonValue().then(value => {
                            return {
                                name: value
                            }
                        })
                    })
                ));
            })
        })
    }

    sendMP(forum, dest, subject, message) {
        return this._newPage().then(page => {
            return this._goTo(forum, page, '/privmsg?mode=post&').then(response => {
                if (response.ok()) {
                    return this._fillForm(page, '/privmsg', {
                        "username[]": dest,
                        subject: subject
                    }).then(form => {
                        return form.$x('//*[contains(@class,"sceditor-container")]//textarea').then(elements => {
                            return this._focusAndSendText(page, elements[0], message).then(() => {
                                return form;
                            })
                        });
                    }).then(form => {
                        return this._log(page, "sendMPfill").then(page => form)
                    }).then(form => {
                        return form.$x('//*[@name="post" and @type="submit"]').then(elements => {
                            const navigationPromise = page.waitForNavigation().then(() => {
                                return page.$x('//*[@action="/privmsg"]').then(element => {
                                    if (element.length) {
                                        throw new Error("User not found");
                                    } else {
                                        console.log("MP sended  to", dest)
                                        return page;
                                    }
                                });
                            });
                            elements[0].click();
                            return navigationPromise;
                        });
                    });
                } else {
                    throw new Error("fail sendMP load");
                }
            })
        });
    }

    /*private*/

    _newPage() {
        return this.browser.newPage().then(page => {
            return page.setCookie({
                name: "dntfa_banner",
                value: "1",
                url: this.config.link,
                path: "/",
                httpOnly: false,
                secure: false
            }).then(() => page);
        });
    }

    _fillForm(page, action, params) {
        let promise = page.waitForXPath('//*[@action="' + action + '"]');
        for (let prop in params) {
            promise = this._fillformChainPromise(promise, page, prop, params[prop]);
        }

        return promise;
    }

    _fillformChainPromise(promise, page, prop, val) {
        return promise.then(form => {
            return form.$x('//*[@name="' + prop + '"]').then(elements => {
                return this._focusAndSendText(page, elements[0], val).then(() => {
                    return form;
                })
            });
        });
    }

    _focusAndSendText(page, target, text) {
        target.focus();
        return page.keyboard.type(text)
    }

    _log(page, namePath) {
        return Promise.resolve(page);
        //use strat here in futur
        // return page.screenshot( {
        //   path: namePath + ".png",
        //   fullPage: true
        // } ).then( () => page );
    }

    _goTo(forum, page, uri) {
        return page.goto(forum.link + uri)// +'change_theme=revaz-nfsu&change_version=subsilver')
    }

    _acceptRGPD(page){
        return page.click("#accept_rgpd").catch(()=> console.log("condition rpgd already accepted")).then(()=> page)
    }
}

module.exports = ChromeCtrl;
