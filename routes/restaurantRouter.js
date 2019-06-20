const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const parser = require("xml-js");
const GMT_Brasil = 3 * 60 * 60 * 1000; //GMT-3 Brasil

const restaurantRouter = express.Router();
restaurantRouter.use(bodyParser.json());

/*------------------------
 * /restaurants/everything
 * -----------------------*/
restaurantRouter.route("/everything")
    .get((req, res, next) => {
        fs.readFile("./restaurants.xml", function (err, data) {
            const jsObject = parser.xml2js(data,
                { textFn: removeJsonTextAttribute, compact: true, spaces: 4, nativeType: false });

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(jsObject.database.restaurants);
        });
    });

/*-------------
 * /restaurants
 * ------------*/
restaurantRouter.route("/")
    .get((req, res, next) => {
        fs.readFile("./restaurants.xml", function (err, data) {
            const jsObject = parser.xml2js(data,
                { textFn: removeJsonTextAttribute, compact: true, spaces: 4, nativeType: false });

            for (var i = 0; i < jsObject.database.restaurants.length; i++)
                delete jsObject.database.restaurants[i].products;

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(jsObject.database.restaurants);
        });
    })
    .post((req, res, next) => {
        if (!req.body.name || !req.body.image || !req.body.rating) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.json("Please inform name, image and rating tags");
        }
        else {
            fs.readFile("./restaurants.xml", function (err, data) {
                const jsObject = parser.xml2js(data,
                    { textFn: removeJsonTextAttribute, compact: true, spaces: 4, nativeType: false });

                var nextId = parseInt(jsObject.database.currentId) + 1;

                var restaurant = req.body;
                restaurant._id = nextId;
                restaurant.createdAt = new Date(Date.now() - GMT_Brasil).toISOString();
                restaurant.updatedAt = new Date(Date.now() - GMT_Brasil).toISOString();

                jsObject.database.restaurants.push(restaurant);
                jsObject.database.currentId = nextId;

                var xml = parser.js2xml(jsObject, { compact: true, spaces: 4 });

                fs.writeFile("./restaurants.xml", xml, function (err, data) {
                    if (err) next(err);
                    else {
                        console.log("Restaurant " + restaurant._id + " created!");
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(restaurant);
                    }
                });
            });
        }
    })
    .put((req, res, next) => {
        res.statusCode = 403;
        res.end("PUT operation not supported on /restaurants");
    })
    .delete((req, res, next) => {
        res.statusCode = 403;
        res.end("Cannot DELETE all restaurants");
    });

/*---------------------------
 * /restaurants/:restaurantId
 * --------------------------*/
restaurantRouter.route("/:restaurantId")
    .get((req, res, next) => {
        fs.readFile("./restaurants.xml", function (err, data) {
            const jsObject = parser.xml2js(data,
                { textFn: removeJsonTextAttribute, compact: true, spaces: 4, nativeType: false });

            var restaurantFound = false;

            if (jsObject.database.restaurants) {
                if (!Array.isArray(jsObject.database.restaurants)) {
                    singleRestaurant = jsObject.database.restaurants;
                    jsObject.database.restaurants = [];
                    jsObject.database.restaurants.push(singleRestaurant);
                }

                for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                    if (jsObject.database.restaurants[i]._id == req.params.restaurantId) {
                        restaurantFound = true;

                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(jsObject.database.restaurants[i]);
                    }
                }
            }

            if (!restaurantFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
            }
        });
    })
    .post((req, res, next) => {
        res.statusCode = 403;
        res.end("POST method not supported on /restaurants/restaurantId");
    })
    .put((req, res, next) => {
        if (!req.body.name && !req.body.image && !req.body.rating) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.json("Please inform at least one of the name, image and rating tags");
        }
        else {
            fs.readFile("./restaurants.xml", function (err, data) {
                const jsObject = parser.xml2js(data,
                    { textFn: removeJsonTextAttribute, compact: true, spaces: 4, nativeType: false });

                var restaurantFound = false;

                if (jsObject.database.restaurants) {
                    if (!Array.isArray(jsObject.database.restaurants)) {
                        singleRestaurant = jsObject.database.restaurants;
                        jsObject.database.restaurants = [];
                        jsObject.database.restaurants.push(singleRestaurant);
                    }

                    for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                        if (jsObject.database.restaurants[i]._id == req.params.restaurantId) {
                            restaurantFound = true;
                            if (req.body.name)
                                jsObject.database.restaurants[i].name = req.body.name;
                            if (req.body.image)
                                jsObject.database.restaurants[i].image = req.body.image;
                            if (req.body.rating)
                                jsObject.database.restaurants[i].rating = req.body.rating;

                            jsObject.database.restaurants[i].updatedAt = new Date(Date.now() - GMT_Brasil).toISOString();

                            var xml = parser.js2xml(jsObject, { compact: true, spaces: 4 });

                            fs.writeFile("./restaurants.xml", xml, function (err, data) {
                                if (err) next(err);
                                else {
                                    console.log("Restaurant " + req.params.restaurantId + " updated!");
                                    res.statusCode = 200;
                                    res.setHeader("Content-Type", "application/json");
                                    res.json(jsObject.database.restaurants[i]);
                                }
                            });
                            break;
                        }
                    }
                }

                if (!restaurantFound) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
                }
            });
        }
    })
    .delete((req, res, next) => {
        fs.readFile("./restaurants.xml", function (err, data) {
            const jsObject = parser.xml2js(data,
                { textFn: removeJsonTextAttribute, compact: true, spaces: 4, nativeType: false });

            var restaurantFound = false;

            if (jsObject.database.restaurants) {
                if (!Array.isArray(jsObject.database.restaurants)) {
                    singleRestaurant = jsObject.database.restaurants;
                    jsObject.database.restaurants = [];
                    jsObject.database.restaurants.push(singleRestaurant);
                }

                for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                    if (jsObject.database.restaurants[i]._id == req.params.restaurantId) {
                        restaurantFound = true;
                        var restaurantDeleted = jsObject.database.restaurants.splice(i, 1);

                        var xml = parser.js2xml(jsObject, { compact: true, spaces: 4 });

                        fs.writeFile("./restaurants.xml", xml, function (err, data) {
                            if (err) next(err);
                            else {
                                console.log("Restaurant " + req.params.restaurantId + " deleted!");
                                res.statusCode = 200;
                                res.setHeader("Content-Type", "application/json");
                                res.json(restaurantDeleted);
                            }
                        });
                        break;
                    }
                }
            }

            if (!restaurantFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
            }
        });
    });

/*------------------------------------
 * /restaurants/:restaurantId/products
 * -----------------------------------*/
restaurantRouter.route("/:restaurantId/products")
    .get((req, res, next) => {
        fs.readFile("./restaurants.xml", function (err, data) {
            const jsObject = parser.xml2js(data,
                { textFn: removeJsonTextAttribute, compact: true, spaces: 4, nativeType: false });

            var restaurantFound = false;

            if (jsObject.database.restaurants) {
                if (!Array.isArray(jsObject.database.restaurants)) {
                    singleRestaurant = jsObject.database.restaurants;
                    jsObject.database.restaurants = [];
                    jsObject.database.restaurants.push(singleRestaurant);
                }

                for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                    if (jsObject.database.restaurants[i]._id == req.params.restaurantId) {
                        restaurantFound = true;
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(jsObject.database.restaurants[i].products || []);
                    }
                }
            }

            if (!restaurantFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
            }
        });
    })
    .post((req, res, next) => {
        if (!req.body.name || !req.body.price || !req.body.type || !req.body.image || !req.body.rating) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.json("Please inform name, price, type, image and rating tags");
        }
        else {
            fs.readFile("./restaurants.xml", function (err, data) {
                const jsObject = parser.xml2js(data,
                    { textFn: removeJsonTextAttribute, compact: true, spaces: 4, nativeType: false });

                var restaurantFound = false;

                if (jsObject.database.restaurants) {
                    if (!Array.isArray(jsObject.database.restaurants)) {
                        singleRestaurant = jsObject.database.restaurants;
                        jsObject.database.restaurants = [];
                        jsObject.database.restaurants.push(singleRestaurant);
                    }

                    for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                        if (jsObject.database.restaurants[i]._id == req.params.restaurantId) {
                            restaurantFound = true;
                            if (!jsObject.database.restaurants[i].products)
                                jsObject.database.restaurants[i].products = [];
                            else if (!Array.isArray(jsObject.database.restaurants[i].products)) {
                                var singleProduct = jsObject.database.restaurants[i].products;
                                jsObject.database.restaurants[i].products = [];
                                jsObject.database.restaurants[i].products.push(singleProduct);
                            }

                            var nextId = parseInt(jsObject.database.currentId) + 1;
                            var product = req.body;
                            product._id = nextId;
                            product.createdAt = new Date(Date.now() - GMT_Brasil).toISOString();
                            product.updatedAt = new Date(Date.now() - GMT_Brasil).toISOString();

                            jsObject.database.restaurants[i].products.push(product);
                            jsObject.database.currentId = nextId;

                            var xml = parser.js2xml(jsObject, { compact: true, spaces: 4 });

                            fs.writeFile("./restaurants.xml", xml, function (err, data) {
                                if (err) next(err);
                                else {
                                    console.log("Product " + product._id + " created!");
                                    res.statusCode = 200;
                                    res.setHeader("Content-Type", "application/json");
                                    res.json(product);
                                }
                            });
                        }
                    }
                }

                if (!restaurantFound) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
                }
            });
        }
    })
    .put((req, res, next) => {
        res.statusCode = 403;
        res.end("PUT operation not supported on /restaurants/restaurantId/products");
    })
    .delete((req, res, next) => {
        res.statusCode = 403;
        res.end("Cannot DELETE all products");
    });

/*-----------------------------------------------
 * /restaurants/:restaurantId/products/:productId
 * ----------------------------------------------*/
restaurantRouter.route("/:restaurantId/products/:productId")
    .get((req, res, next) => {
        fs.readFile("./restaurants.xml", function (err, data) {
            const jsObject = parser.xml2js(data,
                { textFn: removeJsonTextAttribute, compact: true, spaces: 4, nativeType: false });

            var restaurantFound = false;
            var productFound = false;

            if (jsObject.database.restaurants) {
                if (!Array.isArray(jsObject.database.restaurants)) {
                    singleRestaurant = jsObject.database.restaurants;
                    jsObject.database.restaurants = [];
                    jsObject.database.restaurants.push(singleRestaurant);
                }

                for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                    if (jsObject.database.restaurants[i]._id == req.params.restaurantId) {
                        restaurantFound = true;
                        if (!jsObject.database.restaurants[i].products) break;
                        else if (!Array.isArray(jsObject.database.restaurants[i].products)) {
                            var singleProduct = jsObject.database.restaurants[i].products;
                            jsObject.database.restaurants[i].products = [];
                            jsObject.database.restaurants[i].products.push(singleProduct);
                        }

                        for (var j = 0; j < jsObject.database.restaurants[i].products.length; j++) {
                            if (jsObject.database.restaurants[i].products[j]._id == req.params.productId) {
                                productFound = true;

                                res.statusCode = 200;
                                res.setHeader("Content-Type", "application/json");
                                res.json(jsObject.database.restaurants[i].products[j]);
                                break;
                            }
                        }
                        break;
                    }
                }
            }

            if (!restaurantFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
            } else if (!productFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Product of Id: " + req.params.productId + " not found for Restaurant of Id: " + req.params.restaurantId);
            }
        });
    })
    .post((req, res, next) => {
        res.statusCode = 403;
        res.end("POST method not supported on /restaurants/restaurantId/products/productId");
    })
    .put((req, res, next) => {
        if (!req.body.name && !req.body.price && req.body.type && !req.body.image && !req.body.rating) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.json("Please inform at least one of the name, price, type, image and rating tags");
        }
        else {
            fs.readFile("./restaurants.xml", function (err, data) {
                const jsObject = parser.xml2js(data,
                    { textFn: removeJsonTextAttribute, compact: true, spaces: 4, nativeType: false });

                var restaurantFound = false;
                var productFound = false;

                if (jsObject.database.restaurants) {
                    if (!Array.isArray(jsObject.database.restaurants)) {
                        singleRestaurant = jsObject.database.restaurants;
                        jsObject.database.restaurants = [];
                        jsObject.database.restaurants.push(singleRestaurant);
                    }

                    for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                        if (jsObject.database.restaurants[i]._id == req.params.restaurantId) {
                            restaurantFound = true;
                            if (!jsObject.database.restaurants[i].products) break;
                            else if (!Array.isArray(jsObject.database.restaurants[i].products)) {
                                var singleProduct = jsObject.database.restaurants[i].products;
                                jsObject.database.restaurants[i].products = [];
                                jsObject.database.restaurants[i].products.push(singleProduct);
                            }

                            for (var j = 0; j < jsObject.database.restaurants[i].products.length; j++) {
                                if (jsObject.database.restaurants[i].products[j]._id == req.params.productId) {
                                    productFound = true;

                                    if (req.body.name)
                                        jsObject.database.restaurants[i].products[j].name = req.body.name;
                                    if (req.body.price)
                                        jsObject.database.restaurants[i].products[j].price = req.body.price;
                                    if (req.body.type)
                                        jsObject.database.restaurants[i].products[j].type = req.body.type;
                                    if (req.body.image)
                                        jsObject.database.restaurants[i].products[j].image = req.body.image;
                                    if (req.body.rating)
                                        jsObject.database.restaurants[i].products[j].rating = req.body.rating;

                                    jsObject.database.restaurants[i].products[j].updatedAt = new Date(Date.now() - GMT_Brasil).toISOString();

                                    var xml = parser.js2xml(jsObject, { compact: true, spaces: 4 });

                                    fs.writeFile("./restaurants.xml", xml, function (err, data) {
                                        if (err) next(err);
                                        else {
                                            console.log("Product " + req.params.productId + " updated!");
                                            res.statusCode = 200;
                                            res.setHeader("Content-Type", "application/json");
                                            res.json(jsObject.database.restaurants[i].products[j]);
                                        }
                                    });
                                    break;
                                }
                            }
                            break;
                        }
                    }
                }

                if (!restaurantFound) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
                } else if (!productFound) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.json("Product of Id: " + req.params.productId + " not found for Restaurant of Id: " + req.params.restaurantId);
                }
            });
        }
    })
    .delete((req, res, next) => {
        fs.readFile("./restaurants.xml", function (err, data) {
            const jsObject = parser.xml2js(data,
                { textFn: removeJsonTextAttribute, compact: true, spaces: 4, nativeType: false });

            var restaurantFound = false;
            var productFound = false;

            if (jsObject.database.restaurants) {
                if (!Array.isArray(jsObject.database.restaurants)) {
                    singleRestaurant = jsObject.database.restaurants;
                    jsObject.database.restaurants = [];
                    jsObject.database.restaurants.push(singleRestaurant);
                }

                for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                    if (jsObject.database.restaurants[i]._id == req.params.restaurantId) {
                        restaurantFound = true;
                        if (!jsObject.database.restaurants[i].products) break;
                        else if (!Array.isArray(jsObject.database.restaurants[i].products)) {
                            var singleProduct = jsObject.database.restaurants[i].products;
                            jsObject.database.restaurants[i].products = [];
                            jsObject.database.restaurants[i].products.push(singleProduct);
                        }

                        for (var j = 0; j < jsObject.database.restaurants[i].products.length; j++) {
                            if (jsObject.database.restaurants[i].products[j]._id == req.params.productId) {
                                productFound = true;

                                var productDeleted = jsObject.database.restaurants[i].products.splice(j, 1);

                                var xml = parser.js2xml(jsObject, { compact: true, spaces: 4 });

                                fs.writeFile("./restaurants.xml", xml, function (err, data) {
                                    if (err) next(err);
                                    else {
                                        console.log("Product " + req.params.productId + " of restaurant " + req.params.restaurantId + " deleted!");
                                        res.statusCode = 200;
                                        res.setHeader("Content-Type", "application/json");
                                        res.json(productDeleted);
                                    }
                                });
                                break;
                            }
                        }
                        break;
                    }
                }
            }

            if (!restaurantFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
            } else if (!productFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Product of Id: " + req.params.productId + " not found for Restaurant of Id: " + req.params.restaurantId);
            }
        });
    });

/*--------------------------------------------------------
 * /restaurants/:restaurantId/products/:productId/comments
 * -------------------------------------------------------*/
restaurantRouter.route("/:restaurantId/products/:productId/comments")
    .get((req, res, next) => {
        fs.readFile("./restaurants.xml", function (err, data) {
            const jsObject = parser.xml2js(data,
                { textFn: removeJsonTextAttribute, compact: true, spaces: 4, nativeType: false });

            var restaurantFound = false;
            var productFound = false;

            if (jsObject.database.restaurants) {
                if (!Array.isArray(jsObject.database.restaurants)) {
                    singleRestaurant = jsObject.database.restaurants;
                    jsObject.database.restaurants = [];
                    jsObject.database.restaurants.push(singleRestaurant);
                }

                for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                    if (jsObject.database.restaurants[i]._id == req.params.restaurantId) {
                        restaurantFound = true;
                        if (!jsObject.database.restaurants[i].products) break;
                        else if (!Array.isArray(jsObject.database.restaurants[i].products)) {
                            var singleProduct = jsObject.database.restaurants[i].products;
                            jsObject.database.restaurants[i].products = [];
                            jsObject.database.restaurants[i].products.push(singleProduct);
                        }

                        for (var j = 0; j < jsObject.database.restaurants[i].products.length; j++) {
                            if (jsObject.database.restaurants[i].products[j]._id == req.params.productId) {
                                productFound = true;

                                res.statusCode = 200;
                                res.setHeader("Content-Type", "application/json");
                                res.json(jsObject.database.restaurants[i].products[j].comments || []);
                                break;
                            }
                        }
                        break;
                    }
                }
            }

            if (!restaurantFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
            } else if (!productFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Product of Id: " + req.params.productId + " not found for Restaurant of Id: " + req.params.restaurantId);
            }
        });
    })
    .post((req, res, next) => {
        if (!req.body.text) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.json("Please inform the text tag (image tag is optional)");
        }
        else {
            fs.readFile("./restaurants.xml", function (err, data) {
                const jsObject = parser.xml2js(data,
                    { textFn: removeJsonTextAttribute, compact: true, spaces: 4, nativeType: false });

                var restaurantFound = false;
                var productFound = false;

                if (jsObject.database.restaurants) {
                    if (!Array.isArray(jsObject.database.restaurants)) {
                        singleRestaurant = jsObject.database.restaurants;
                        jsObject.database.restaurants = [];
                        jsObject.database.restaurants.push(singleRestaurant);
                    }

                    for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                        if (jsObject.database.restaurants[i]._id == req.params.restaurantId) {
                            restaurantFound = true;
                            if (!jsObject.database.restaurants[i].products) break;
                            else if (!Array.isArray(jsObject.database.restaurants[i].products)) {
                                var singleProduct = jsObject.database.restaurants[i].products;
                                jsObject.database.restaurants[i].products = [];
                                jsObject.database.restaurants[i].products.push(singleProduct);
                            }

                            for (var j = 0; j < jsObject.database.restaurants[i].products.length; j++) {
                                if (jsObject.database.restaurants[i].products[j]._id == req.params.productId) {
                                    productFound = true;
                                    if (!jsObject.database.restaurants[i].products[j].comments)
                                        jsObject.database.restaurants[i].products[j].comments = [];
                                    else if (!Array.isArray(jsObject.database.restaurants[i].products[j].comments)) {
                                        var singleComment = jsObject.database.restaurants[i].products[j].comments;
                                        jsObject.database.restaurants[i].products[j].comments = [];
                                        jsObject.database.restaurants[i].products[j].comments.push(singleComment);
                                    }

                                    var nextId = parseInt(jsObject.database.currentId) + 1;

                                    var comment = req.body;
                                    comment._id = nextId;
                                    comment.author = req.body.author;
                                    comment.createdAt = new Date(Date.now() - GMT_Brasil).toISOString();
                                    comment.updatedAt = new Date(Date.now() - GMT_Brasil).toISOString();

                                    jsObject.database.restaurants[i].products[j].comments.push(comment);
                                    jsObject.database.currentId = nextId;

                                    var xml = parser.js2xml(jsObject, { compact: true, spaces: 4 });

                                    fs.writeFile("./restaurants.xml", xml, function (err, data) {
                                        if (err) next(err);
                                        else {
                                            console.log("Comment " + comment._id + " created!");
                                            res.statusCode = 200;
                                            res.setHeader("Content-Type", "application/json");
                                            res.json(comment);
                                        }
                                    });
                                    break;
                                }
                            }
                            break;
                        }
                    }
                }

                if (!restaurantFound) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
                } else if (!productFound) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.json("Product of Id: " + req.params.productId + " not found for Restaurant of Id: " + req.params.restaurantId);
                }
            });
        }
    })
    .put((req, res, next) => {
        res.statusCode = 403;
        res.end("PUT operation not supported on /restaurants/restaurantId/products/productId/comments");
    })
    .delete((req, res, next) => {
        res.statusCode = 403;
        res.end("Cannot DELETE all comments");
    });

/*-------------------------------------------------------------------
 * /restaurants/:restaurantId/products/:productId/comments/:commentId
 * ------------------------------------------------------------------*/
restaurantRouter.route("/:restaurantId/products/:productId/comments/:commentId")
    .get((req, res, next) => {
        fs.readFile("./restaurants.xml", function (err, data) {
            const jsObject = parser.xml2js(data,
                { textFn: removeJsonTextAttribute, compact: true, spaces: 4, nativeType: false });

            var restaurantFound = false;
            var productFound = false;
            var commentFound = false;

            if (jsObject.database.restaurants) {
                if (!Array.isArray(jsObject.database.restaurants)) {
                    singleRestaurant = jsObject.database.restaurants;
                    jsObject.database.restaurants = [];
                    jsObject.database.restaurants.push(singleRestaurant);
                }

                for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                    if (jsObject.database.restaurants[i]._id == req.params.restaurantId) {
                        restaurantFound = true;
                        if (!jsObject.database.restaurants[i].products) break;
                        else if (!Array.isArray(jsObject.database.restaurants[i].products)) {
                            var singleProduct = jsObject.database.restaurants[i].products;
                            jsObject.database.restaurants[i].products = [];
                            jsObject.database.restaurants[i].products.push(singleProduct);
                        }

                        for (var j = 0; j < jsObject.database.restaurants[i].products.length; j++) {
                            if (jsObject.database.restaurants[i].products[j]._id == req.params.productId) {
                                productFound = true;
                                if (!jsObject.database.restaurants[i].products[j].comments) break;
                                else if (!Array.isArray(jsObject.database.restaurants[i].products[j].comments)) {
                                    var singleComment = jsObject.database.restaurants[i].products[j].comments;
                                    jsObject.database.restaurants[i].products[j].comments = [];
                                    jsObject.database.restaurants[i].products[j].comments.push(singleComment);
                                }
                                for (var k = 0; k < jsObject.database.restaurants[i].products[j].comments.length; k++) {
                                    if (jsObject.database.restaurants[i].products[j].comments[k]._id == req.params.commentId) {
                                        commentFound = true;

                                        res.statusCode = 200;
                                        res.setHeader("Content-Type", "application/json");
                                        res.json(jsObject.database.restaurants[i].products[j].comments[k]);
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                        break;
                    }
                }
            }

            if (!restaurantFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
            } else if (!productFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Product of Id: " + req.params.productId + " not found for Restaurant of Id: " + req.params.restaurantId);
            } else if (!commentFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Comment of Id: " + req.params.commentId + " not found for Product of Id: " + req.params.productId + ", Restaurant of Id: " + req.params.restaurantId);
            }
        });
    })
    .post((req, res, next) => {
        res.statusCode = 403;
        res.end("POST method not supported on /restaurants/restaurantId/products/productId/comments/commentId");
    })
    .put((req, res, next) => {
        if (!req.body.text) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.json("Please inform the text tag (image tag is optional)");
        }
        else {
            fs.readFile("./restaurants.xml", function (err, data) {
                const jsObject = parser.xml2js(data,
                    { textFn: removeJsonTextAttribute, compact: true, spaces: 4, nativeType: false });

                var restaurantFound = false;
                var productFound = false;
                var commentFound = false;

                if (jsObject.database.restaurants) {
                    if (!Array.isArray(jsObject.database.restaurants)) {
                        singleRestaurant = jsObject.database.restaurants;
                        jsObject.database.restaurants = [];
                        jsObject.database.restaurants.push(singleRestaurant);
                    }

                    for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                        if (jsObject.database.restaurants[i]._id == req.params.restaurantId) {
                            restaurantFound = true;
                            if (!jsObject.database.restaurants[i].products) break;
                            else if (!Array.isArray(jsObject.database.restaurants[i].products)) {
                                var singleProduct = jsObject.database.restaurants[i].products;
                                jsObject.database.restaurants[i].products = [];
                                jsObject.database.restaurants[i].products.push(singleProduct);
                            }

                            for (var j = 0; j < jsObject.database.restaurants[i].products.length; j++) {
                                if (jsObject.database.restaurants[i].products[j]._id == req.params.productId) {
                                    productFound = true;
                                    if (!jsObject.database.restaurants[i].products[j].comments) break;
                                    else if (!Array.isArray(jsObject.database.restaurants[i].products[j].comments)) {
                                        var singleComment = jsObject.database.restaurants[i].products[j].comments;
                                        jsObject.database.restaurants[i].products[j].comments = [];
                                        jsObject.database.restaurants[i].products[j].comments.push(singleComment);
                                    }
                                    for (var k = 0; k < jsObject.database.restaurants[i].products[j].comments.length; k++) {
                                        if (jsObject.database.restaurants[i].products[j].comments[k]._id == req.params.commentId) {
                                            commentFound = true;

                                            if (jsObject.database.restaurants[i].products[j].comments[k].author == req.body.author) {

                                                jsObject.database.restaurants[i].products[j].comments[k].text = req.body.text;
                                                jsObject.database.restaurants[i].products[j].comments[k].updatedAt = new Date(Date.now() - GMT_Brasil).toISOString();

                                                var xml = parser.js2xml(jsObject, { compact: true, spaces: 4 });

                                                fs.writeFile("./restaurants.xml", xml, function (err, data) {
                                                    if (err) next(err);
                                                    else {
                                                        console.log("Product " + req.params.productId + " updated!");
                                                        res.statusCode = 200;
                                                        res.setHeader("Content-Type", "application/json");
                                                        res.json(jsObject.database.restaurants[i].products[j].comments[k]);
                                                    }
                                                });
                                            }
                                            else {
                                                res.statusCode = 403;
                                                res.setHeader("Content-Type", "application/json");
                                                res.json("Only the owner can update a comment");
                                            }
                                            break;
                                        }
                                    }
                                    break;
                                }
                            }
                            break;
                        }
                    }
                }

                if (!restaurantFound) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
                } else if (!productFound) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.json("Product of Id: " + req.params.productId + " not found for Restaurant of Id: " + req.params.restaurantId);
                } else if (!commentFound) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.json("Comment of Id: " + req.params.commentId + " not found for Product of Id: " + req.params.productId + ", Restaurant of Id: " + req.params.restaurantId);
                }
            });
        }
    })
    .delete((req, res, next) => {
        fs.readFile("./restaurants.xml", function (err, data) {
            const jsObject = parser.xml2js(data,
                { textFn: removeJsonTextAttribute, compact: true, spaces: 4, nativeType: false });

            var restaurantFound = false;
            var productFound = false;
            var commentFound = false;

            if (jsObject.database.restaurants) {
                if (!Array.isArray(jsObject.database.restaurants)) {
                    singleRestaurant = jsObject.database.restaurants;
                    jsObject.database.restaurants = [];
                    jsObject.database.restaurants.push(singleRestaurant);
                }

                for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                    if (jsObject.database.restaurants[i]._id == req.params.restaurantId) {
                        restaurantFound = true;
                        if (!jsObject.database.restaurants[i].products) break;
                        else if (!Array.isArray(jsObject.database.restaurants[i].products)) {
                            var singleProduct = jsObject.database.restaurants[i].products;
                            jsObject.database.restaurants[i].products = [];
                            jsObject.database.restaurants[i].products.push(singleProduct);
                        }

                        for (var j = 0; j < jsObject.database.restaurants[i].products.length; j++) {
                            if (jsObject.database.restaurants[i].products[j]._id == req.params.productId) {
                                productFound = true;
                                if (!jsObject.database.restaurants[i].products[j].comments) break;
                                else if (!Array.isArray(jsObject.database.restaurants[i].products[j].comments)) {
                                    var singleComment = jsObject.database.restaurants[i].products[j].comments;
                                    jsObject.database.restaurants[i].products[j].comments = [];
                                    jsObject.database.restaurants[i].products[j].comments.push(singleComment);
                                }
                                for (var k = 0; k < jsObject.database.restaurants[i].products[j].comments.length; k++) {
                                    if (jsObject.database.restaurants[i].products[j].comments[k]._id == req.params.commentId) {
                                        commentFound = true;

                                        if (jsObject.database.restaurants[i].products[j].comments[k].author == req.body.author) {

                                            var commentDeleted = jsObject.database.restaurants[i].products[j].comments.splice(k, 1);

                                            var xml = parser.js2xml(jsObject, { compact: true, spaces: 4 });

                                            fs.writeFile("./restaurants.xml", xml, function (err, data) {
                                                if (err) next(err);
                                                else {
                                                    console.log("Comment " + req.params.commentId + " deleted!");
                                                    res.statusCode = 200;
                                                    res.setHeader("Content-Type", "application/json");
                                                    res.json(commentDeleted);
                                                }
                                            });
                                        }
                                        else {
                                            res.statusCode = 403;
                                            res.setHeader("Content-Type", "application/json");
                                            res.json("Only the owner or an admin can delete a comment");
                                        }
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                        break;
                    }
                }
            }

            if (!restaurantFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
            } else if (!productFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Product of Id: " + req.params.productId + " not found for Restaurant of Id: " + req.params.restaurantId);
            } else if (!commentFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Comment of Id: " + req.params.commentId + " not found for Product of Id: " + req.params.productId + ", Restaurant of Id: " + req.params.restaurantId);
            }
        });
    });


const removeJsonTextAttribute = function (value, parentElement) {
    try {
        const pOpKeys = Object.keys(parentElement._parent);
        const keyNo = pOpKeys.length;
        const keyName = pOpKeys[keyNo - 1];
        const arrOfKey = parentElement._parent[keyName];
        const arrOfKeyLen = arrOfKey.length;
        if (arrOfKeyLen > 0) {
            const arr = arrOfKey;
            const arrIndex = arrOfKey.length - 1;
            arr[arrIndex] = value;
        } else {
            parentElement._parent[keyName] = value;
        }
    } catch (e) { }
};

/*---------------
 * Exports Module
 * --------------*/
module.exports = restaurantRouter;
