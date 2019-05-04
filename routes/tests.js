const express = require('express');
const fs = require("fs");
const parser = require('xml-js');

const testsRouter = express.Router();

/*------------------------
 * /tests
 * -----------------------*/
testsRouter.route("/")
    .get((req, res, next) => {
        fs.readFile('./restaurants.xml', function (err, data) {
            var restaurants = parser.xml2js(data, { compact: true, spaces: 4 });
            //console.log(restaurants);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(restaurants);
        });
    }).post((req, res, next) => {
        res.json({ teste: "123" });
    });

/*---------------
 * Exports Module
 * --------------*/
module.exports = testsRouter;
