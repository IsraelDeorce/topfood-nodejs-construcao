const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const parser = require("xml-js");
const GMT_Brasil = 3 * 60 * 60 * 1000; //GMT-3 Brasil

const databaseRouter = express.Router();
databaseRouter.use(bodyParser.json());

var populate_database = {
  database: {
    restaurants: [{
      _id: 1,
      name: "Casa 5",
      image: "Casa5.jpg",
      rating: 5.0,
      createdAt: new Date(Date.now() - GMT_Brasil).toISOString(),
      updatedAt: new Date(Date.now() - GMT_Brasil).toISOString()
    },
    {
      _id: 2,
      name: "Canal Café",
      image: "CanalCafe.jpg",
      rating: 4.9,
      createdAt: new Date(Date.now() - GMT_Brasil).toISOString(),
      updatedAt: new Date(Date.now() - GMT_Brasil).toISOString()
    },
    {
      _id: 3,
      name: "Severo Garage",
      image: "SeveroGarage.jpg",
      rating: 4.8,
      products: [{
        _id: 4,
        name: "Porção de fritas",
        price: 5.75,
        type: "Entrada",
        image: "PorcaoDeFritas.jpg",
        rating: 4.7,
        createdAt: new Date(Date.now() - GMT_Brasil).toISOString(),
        updatedAt: new Date(Date.now() - GMT_Brasil).toISOString()
      },
      {
        _id: 5,
        name: "Fuca",
        price: 23.00,
        type: "Burguer",
        image: "Fuca.jpg",
        rating: 4.9,
        createdAt: new Date(Date.now() - GMT_Brasil).toISOString(),
        updatedAt: new Date(Date.now() - GMT_Brasil).toISOString()
      },
      {
        _id: 6,
        name: "Chevettera",
        price: 25.50,
        type: "Burguer",
        image: "Chevettera.jpg",
        rating: 4.4,
        createdAt: new Date(Date.now() - GMT_Brasil).toISOString(),
        updatedAt: new Date(Date.now() - GMT_Brasil).toISOString()
      },
      {
        _id: 7,
        name: "Opalão",
        price: 29.00,
        type: "Burguer",
        image: "Opalao.jpg",
        rating: 4.7,
        createdAt: new Date(Date.now() - GMT_Brasil).toISOString(),
        updatedAt: new Date(Date.now() - GMT_Brasil).toISOString()
      },
      {
        _id: 8,
        name: "Dojão",
        price: 29.00,
        type: "Burguer",
        image: "Dojao.jpg",
        rating: 4.4,
        createdAt: new Date(Date.now() - GMT_Brasil).toISOString(),
        updatedAt: new Date(Date.now() - GMT_Brasil).toISOString()
      },
      {
        _id: 9,
        name: "Bike Veggie",
        price: 31.00,
        type: "Burguer",
        image: "BikeVeggie.jpg",
        rating: 5.0,
        comments: [{
          _id: 10,
          author: "Israel Deorce",
          text: "É bão, mas prefiro os com carne!",
          createdAt: new Date(Date.now() - GMT_Brasil).toISOString(),
          updatedAt: new Date(Date.now() - GMT_Brasil).toISOString()
        },
        {
          _id: 11,
          author: "Gabriel Paul",
          text: "É bem bão, melhor que os com carne!",
          createdAt: new Date(Date.now() - GMT_Brasil).toISOString(),
          updatedAt: new Date(Date.now() - GMT_Brasil).toISOString()
        }],
        createdAt: new Date(Date.now() - GMT_Brasil).toISOString(),
        updatedAt: new Date(Date.now() - GMT_Brasil).toISOString()
      }],
      createdAt: new Date(Date.now() - GMT_Brasil).toISOString(),
      updatedAt: new Date(Date.now() - GMT_Brasil).toISOString()
    }],
    currentId: 11
  }
}

/*-------------------------------
 * /database/populate_default
 * ------------------------------*/
databaseRouter.route("/populate_default")
  .post((req, res, next) => {

    var xml = parser.js2xml(populate_database, { compact: true, spaces: 4 });

    fs.writeFile("./restaurants.xml", xml, function (err, data) {
      if (err) next(err);
      else {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(populate_database);
      }
    });
  });

/*---------------
 * Exports Module
 * --------------*/
module.exports = databaseRouter;