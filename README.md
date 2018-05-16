# caretaker
A api to interact with forum actif with headless browser

## Install

```npm install UtopiaRPG/caretaker --save```

## Use


Promise style


```
const ChromeCtrl = require("caretaker").ChromeCtrl;

new ChromeCtrl( config ).then( ctrl => {
    return ctrl.login()
	.then( page =>  ctrl.sendMP( "dest", "subject", "content" ) );
} );

```


Async/Await style


```
const ChromeCtrl = require("caretaker").ChromeCtrl;

const ctrl = await new ChromeCtrl( config );
await ctrl.login();
await ctrl.sendMP( "dest", "subject", "content" ));

```

#API

There only 3 functions for now :

- login()
- listMP()
- sendMP(dest, subject, message)

All of them return a page object for now