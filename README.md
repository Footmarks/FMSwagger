This is a private fork created to make changes to sub-document display.

baucis-swagger
==============

This module generates customizable swagger definitions for your Baucis API.  Use this module in conjunction with [Baucis](https://github.com/wprl/baucis).

    npm install --save baucis baucis-swagger

It is very easy to use.  Include the package after baucis is included, and before your API is built.

    var express = require('express');
    var baucis = require('baucis');
    var swagger = require('baucis-swagger');

    var app = express();

    // ... Set up a mongoose schema ...

    baucis.rest('vegetable');
    app.use('/api', baucis());

Then, access e.g. `GET http://localhost:3333/api/api-docs`.  See the [Baucis](https://github.com/wprl/baucis) repo for more information about building REST APIs with [Baucis](https://github.com/wprl/baucis).

Contact
-------

 * http://kun.io/
 * @wprl

&copy; 2014 William P. Riley-Land
