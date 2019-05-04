const express = require("express");
const bodyParser = require("body-parser");
const authenticate = require("../config/authenticate");
const Restaurant = require("../models/restaurant");
const fs = require("fs");
const parser = require("xml-js");
const GMT_Brasil = 3 * 60 * 60 * 1000; //GMT-3 Brasil

const restaurantRouter = express.Router();
restaurantRouter.use(bodyParser.json());

/*------------------------
 * /restaurants/everything
 * -----------------------*/
restaurantRouter.route("/everything")
    .get(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        fs.readFile("./restaurants.xml", function (err, data) {
            var restaurants = parser.xml2js(data, { compact: true, spaces: 4 });

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(restaurants);
        });
    });

/*-------------
 * /restaurants
 * ------------*/
restaurantRouter.route("/")
    .get((req, res, next) => {
        fs.readFile("./restaurants.xml", function (err, data) {
            const jsObject = parser.xml2js(data, { compact: true, spaces: 4, nativeType: true });
            for (var i = 0; i < jsObject.database.restaurants.length; i++)
                delete jsObject.database.restaurants[i].products;

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(jsObject);
        });
    })
    .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        if (!req.body.name || !req.body.image || !req.body.rating) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.json("Please inform name, image and rating tags");
        }
        else {
            fs.readFile("./restaurants.xml", function (err, data) {
                const jsObject = parser.xml2js(data, { compact: true, spaces: 4, nativeType: true });
                var nextId = jsObject.database.currentId._text + 1;

                var restaurant = req.body;
                restaurant._id = nextId;
                restaurant.createdAt = new Date(Date.now() - GMT_Brasil).toISOString();
                restaurant.updatedAt = new Date(Date.now() - GMT_Brasil).toISOString();

                jsObject.database.restaurants.push(restaurant);
                jsObject.database.currentId._text = nextId;

                var xml = parser.js2xml(jsObject, { compact: true, spaces: 4 });

                fs.writeFile("./restaurants.xml", xml, function (err, data) {
                    if (err) {
                        next(err);
                    }
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
    .put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end("PUT operation not supported on /restaurants");
    })
    .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end("Cannot DELETE all restaurants");
    });

/*---------------------------
 * /restaurants/:restaurantId
 * --------------------------*/
restaurantRouter.route("/:restaurantId")
    .get((req, res, next) => {
        fs.readFile("./restaurants.xml", function (err, data) {
            const jsObject = parser.xml2js(data, { compact: true, spaces: 4, nativeType: true });
            var found = false;

            for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                if (jsObject.database.restaurants[i]._id._text == req.params.restaurantId) {
                    found = true;
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(jsObject.database.restaurants[i]);
                }
            }

            if (!found) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
            }
        });
    })
    .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end("POST method not supported on /restaurants/restaurantId");
    })
    .put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        if (!req.body.name && !req.body.image && !req.body.rating) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.json("Please inform at least one of the name, image and rating tags");
        }
        else {
            fs.readFile("./restaurants.xml", function (err, data) {
                const jsObject = parser.xml2js(data, { compact: true, spaces: 4, nativeType: true });
                var found = false;

                for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                    if (jsObject.database.restaurants[i]._id._text == req.params.restaurantId) {
                        found = true;
                        if (req.body.name)
                            jsObject.database.restaurants[i].name._text = req.body.name;
                        if (req.body.image)
                            jsObject.database.restaurants[i].image._text = req.body.image;
                        if (req.body.rating)
                            jsObject.database.restaurants[i].rating._text = req.body.rating;

                        jsObject.database.restaurants[i].updatedAt._text = new Date(Date.now() - GMT_Brasil).toISOString();

                        if (found) {
                            var xml = parser.js2xml(jsObject, { compact: true, spaces: 4 });

                            fs.writeFile("./restaurants.xml", xml, function (err, data) {
                                if (err) {
                                    next(err);
                                }
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

                if (!found) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
                }
            });
        }
    })
    .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        fs.readFile("./restaurants.xml", function (err, data) {
            const jsObject = parser.xml2js(data, { compact: true, spaces: 4, nativeType: true });
            var found = false;

            for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                if (jsObject.database.restaurants[i]._id._text == req.params.restaurantId) {
                    found = true;
                    var restaurantDeleted = jsObject.database.restaurants.splice(i, 1);

                    if (found) {
                        var xml = parser.js2xml(jsObject, { compact: true, spaces: 4 });

                        fs.writeFile("./restaurants.xml", xml, function (err, data) {
                            if (err) {
                                next(err);
                            }
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

            if (!found) {
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
            const jsObject = parser.xml2js(data, { compact: true, spaces: 4, nativeType: true });
            var found = false;

            for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                if (jsObject.database.restaurants[i]._id._text == req.params.restaurantId) {
                    found = true;
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(jsObject.database.restaurants[i].products);
                }
            }

            if (!found) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
            }
        });
    })
    .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        if (!req.body.name || !req.body.price || !req.body.type || !req.body.image || !req.body.rating) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.json("Please inform name, price, type, image and rating tags");
        }
        else {
            fs.readFile("./restaurants.xml", function (err, data) {
                const jsObject = parser.xml2js(data, { compact: true, spaces: 4, nativeType: true });
                var found = false;

                for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                    if (jsObject.database.restaurants[i]._id._text == req.params.restaurantId) {
                        found = true;

                        var nextId = jsObject.database.currentId._text + 1;
                        var product = req.body;
                        product._id = nextId;
                        product.createdAt = new Date(Date.now() - GMT_Brasil).toISOString();
                        product.updatedAt = new Date(Date.now() - GMT_Brasil).toISOString();

                        jsObject.database.restaurants[i].products.push(product);
                        jsObject.database.currentId._text = nextId;

                        var xml = parser.js2xml(jsObject, { compact: true, spaces: 4 });

                        if (found) {
                            fs.writeFile("./restaurants.xml", xml, function (err, data) {
                                if (err) {
                                    next(err);
                                }
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

                if (!found) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
                }
            });
        }
    })
    .put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end("PUT operation not supported on /restaurants/restaurantId/products");
    })
    .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end("Cannot DELETE all products");
    });

/*-----------------------------------------------
 * /restaurants/:restaurantId/products/:productId
 * ----------------------------------------------*/
restaurantRouter.route("/:restaurantId/products/:productId")
    .get((req, res, next) => {
        fs.readFile("./restaurants.xml", function (err, data) {
            const jsObject = parser.xml2js(data, { compact: true, spaces: 4, nativeType: true });
            var restaurantFound = false;
            var productFound = false;

            for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                if (jsObject.database.restaurants[i]._id._text == req.params.restaurantId) {
                    restaurantFound = true;

                    for (var j = 0; j < jsObject.database.restaurants[i].products.length; j++) {
                        if (jsObject.database.restaurants[i].products[j]._id._text == req.params.productId) {
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

            if (!restaurantFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
            } else if (!productFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Product of Id: " + req.params.productId + " not found for restaurant of Id: " + req.params.restaurantId);
            }
        });
    })
    .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end("POST method not supported on /restaurants/restaurantId/products/productId");
    })
    .put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        if (!req.body.name && !req.body.price && req.body.type && !req.body.image && !req.body.rating) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.json("Please inform at least one of the name, price, type, image and rating tags");
        }
        else {
            fs.readFile("./restaurants.xml", function (err, data) {
                const jsObject = parser.xml2js(data, { compact: true, spaces: 4, nativeType: true });
                var restaurantFound = false;
                var productFound = false;

                for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                    if (jsObject.database.restaurants[i]._id._text == req.params.restaurantId) {
                        restaurantFound = true;

                        for (var j = 0; j < jsObject.database.restaurants[i].products.length; j++) {
                            if (jsObject.database.restaurants[i].products[j]._id._text == req.params.productId) {
                                productFound = true;

                                if (req.body.name)
                                    jsObject.database.restaurants[i].products[j].name._text = req.body.name;
                                if (req.body.price)
                                    jsObject.database.restaurants[i].products[j].price._text = req.body.price;
                                if (req.body.type)
                                    jsObject.database.restaurants[i].products[j].type._text = req.body.type;
                                if (req.body.image)
                                    jsObject.database.restaurants[i].products[j].image._text = req.body.image;
                                if (req.body.rating)
                                    jsObject.database.restaurants[i].products[j].rating._text = req.body.rating;

                                jsObject.database.restaurants[i].products[j].updatedAt._text = new Date(Date.now() - GMT_Brasil).toISOString();

                                var xml = parser.js2xml(jsObject, { compact: true, spaces: 4 });

                                fs.writeFile("./restaurants.xml", xml, function (err, data) {
                                    if (err) {
                                        next(err);
                                    }
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

                if (!restaurantFound) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
                } else if (!productFound) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.json("Product of Id: " + req.params.productId + " not found for restaurant of Id: " + req.params.restaurantId);
                }
            });
        }
    })
    .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        fs.readFile("./restaurants.xml", function (err, data) {
            const jsObject = parser.xml2js(data, { compact: true, spaces: 4, nativeType: true });
            var restaurantFound = false;
            var productFound = false;

            for (var i = 0; i < jsObject.database.restaurants.length; i++) {
                if (jsObject.database.restaurants[i]._id._text == req.params.restaurantId) {
                    restaurantFound = true;

                    for (var j = 0; j < jsObject.database.restaurants[i].products.length; j++) {
                        if (jsObject.database.restaurants[i].products[j]._id._text == req.params.productId) {
                            productFound = true;

                            var productDeleted = jsObject.database.restaurants[i].products.splice(j, 1);

                            var xml = parser.js2xml(jsObject, { compact: true, spaces: 4 });

                            fs.writeFile("./restaurants.xml", xml, function (err, data) {
                                if (err) {
                                    next(err);
                                }
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

            if (!restaurantFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Restaurant of Id: " + req.params.restaurantId + " not found");
            } else if (!productFound) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.json("Product of Id: " + req.params.productId + " not found for restaurant of Id: " + req.params.restaurantId);
            }
        });
    });

/*--------------------------------------------------------
 * /restaurants/:restaurantId/products/:productId/comments
 * -------------------------------------------------------*/
restaurantRouter.route("/:restaurantId/products/:productId/comments")
    .get((req, res, next) => {
        Restaurant.findById(req.params.restaurantId)
            .populate("products.comments.author", "username")
            .then((restaurant) => {
                if (restaurant != null && restaurant.products.id(req.params.productId) != null) {
                    restaurant.products.id(req.params.productId).comments.forEach(comment => {
                        comment.createdAt -= GMT_Brasil;
                        comment.updatedAt -= GMT_Brasil;
                    });

                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(restaurant.products.id(req.params.productId).comments);
                }
                else if (restaurant == null) {
                    err = new Error("Restaurant " + req.params.restaurantId + " not found!");
                    err.statusCode = 404;
                    return next(err);
                }
                else {
                    err = new Error("Product " + req.params.productId + " not found!");
                    err.statusCode = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(authenticate.verifyUser, (req, res, next) => {
        Restaurant.findById(req.params.restaurantId)
            .then((restaurant) => {
                if (restaurant != null && restaurant.products.id(req.params.productId) != null) {
                    req.body.author = req.user._id;
                    restaurant.products.id(req.params.productId).comments.push(req.body);
                    restaurant.save()
                        .then((restaurant) => {
                            var comment = restaurant.products.id(req.params.productId)
                                .comments[restaurant.products.id(req.params.productId).comments.length - 1];

                            comment.createdAt -= GMT_Brasil;
                            comment.updatedAt -= GMT_Brasil;

                            var response = {
                                _id: comment._id
                                , text: comment.text
                                , author: {
                                    _id: req.user._id
                                    , username: req.user.username
                                }
                                , createdAt: comment.createdAt
                                , updatedAt: comment.updatedAt
                            }

                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(response);
                        }, (err) => next(err));
                }
                else if (restaurant == null) {
                    err = new Error("Restaurant " + req.params.restaurantId + " not found!");
                    err.statusCode = 404;
                    return next(err);
                }
                else {
                    err = new Error("Product " + req.params.productId + " not found!");
                    err.statusCode = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end("PUT operation not supported on /restaurants/restaurantId/products/productId/comments");
    })
    .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Restaurant.findById(req.params.restaurantId)
            .then((restaurant) => {
                if (restaurant != null && restaurant.products.id(req.params.productId) != null) {
                    for (var i = (restaurant.products.id(req.params.productId).comments.length - 1); i >= 0; i--) {
                        restaurant.products.id(req.params.productId)
                            .comments.id(restaurant.products.id(req.params.productId).comments[i]._id).remove();
                    }

                    restaurant.save()
                        .then((restaurant) => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(restaurant.products.id(req.params.productId).comments);
                        }, (err) => next(err));
                }
                else if (restaurant == null) {
                    err = new Error("Restaurant " + req.params.restaurantId + " not found!");
                    err.statusCode = 404;
                    return next(err);
                }
                else {
                    err = new Error("Product " + req.params.productId + " not found!");
                    err.statusCode = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

/*-------------------------------------------------------------------
 * /restaurants/:restaurantId/products/:productId/comments/:commentId
 * ------------------------------------------------------------------*/
restaurantRouter.route("/:restaurantId/products/:productId/comments/:commentId")
    .get((req, res, next) => {
        Restaurant.findById(req.params.restaurantId)
            .populate("products.comments.author", "username")
            .then((restaurant) => {
                if (restaurant != null && restaurant.products.id(req.params.productId) != null
                    && restaurant.products.id(req.params.productId).comments.id(req.params.commentId) != null) {
                    restaurant.products.id(req.params.productId)
                        .comments.id(req.params.commentId).createdAt -= GMT_Brasil;
                    restaurant.products.id(req.params.productId)
                        .comments.id(req.params.commentId).updatedAt -= GMT_Brasil;

                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(restaurant.products.id(req.params.productId).comments.id(req.params.commentId));
                }
                else if (restaurant == null) {
                    err = new Error("Restaurant " + req.params.restaurantId + " not found!");
                    err.statusCode = 404;
                    return next(err);
                }
                else if (restaurant.products.id(req.params.productId) == null) {
                    err = new Error("Product " + req.params.productId + " not found!");
                    err.statusCode = 404;
                    return next(err);
                }
                else {
                    err = new Error("Comment " + req.params.commentId + " not found!");
                    err.statusCode = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end("POST method not supported on /restaurants/restaurantId/products/productId/comments/commentId");
    })
    .put(authenticate.verifyUser, (req, res, next) => {
        Restaurant.findById(req.params.restaurantId)
            .then((restaurant) => {
                if (restaurant != null && restaurant.products.id(req.params.productId) != null
                    && restaurant.products.id(req.params.productId).comments.id(req.params.commentId) != null) {
                    if (restaurant.products.id(req.params.productId)
                        .comments.id(req.params.commentId).author.equals(req.user._id)) {
                        if (req.body.text != null) {
                            restaurant.products.id(req.params.productId)
                                .comments.id(req.params.commentId).text = req.body.text;
                        }
                        if (req.body.image != null) {
                            restaurant.products.id(req.params.productId)
                                .comments.id(req.params.commentId).image = req.body.image;
                        }

                        restaurant.save()
                            .then((restaurant) => {
                                var comment = restaurant.products.id(req.params.productId)
                                    .comments[restaurant.products.id(req.params.productId).comments.length - 1];

                                comment.createdAt -= GMT_Brasil;
                                comment.updatedAt -= GMT_Brasil;

                                var response = {
                                    _id: comment._id
                                    , text: comment.text
                                    , author: {
                                        _id: req.user._id
                                        , username: req.user.username
                                    }
                                    , createdAt: comment.createdAt
                                    , updatedAt: comment.updatedAt
                                }

                                res.statusCode = 200;
                                res.setHeader("Content-Type", "application/json");
                                res.json(response);
                            }, (err) => next(err));
                    }
                    else {
                        var err = new Error("You are not authorized to update this comment!");
                        err.statusCode = 403;
                        return next(err);
                    }
                }
                else if (restaurant == null) {
                    err = new Error("Restaurant " + req.params.restaurantId + " not found!");
                    err.statusCode = 404;
                    return next(err);
                }
                else if (restaurant.products.id(req.params.productId) == null) {
                    err = new Error("Product " + req.params.productId + " not found!");
                    err.statusCode = 404;
                    return next(err);
                }
                else {
                    err = new Error("Comment " + req.params.commentId + " not found!");
                    err.statusCode = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .delete(authenticate.verifyUser, (req, res, next) => {
        Restaurant.findById(req.params.restaurantId)
            .then((restaurant) => {
                if (restaurant != null && restaurant.products.id(req.params.productId) != null
                    && restaurant.products.id(req.params.productId).comments.id(req.params.commentId) != null) {
                    if (restaurant.products.id(req.params.productId)
                        .comments.id(req.params.commentId).author.equals(req.user._id)) {
                        var commentRemoved = restaurant.products.id(req.params.productId).comments.id(req.params.commentId).remove();

                        restaurant.save()
                            .then((restaurant) => {
                                commentRemoved.createdAt -= GMT_Brasil;
                                commentRemoved.updatedAt -= GMT_Brasil;

                                var response = {
                                    _id: commentRemoved._id
                                    , text: commentRemoved.text
                                    , author: {
                                        _id: req.user._id
                                        , username: req.user.username
                                    }
                                    , createdAt: commentRemoved.createdAt
                                    , updatedAt: commentRemoved.updatedAt
                                }

                                res.statusCode = 200;
                                res.setHeader("Content-Type", "application/json");
                                res.json(response);
                            }, (err) => next(err));
                    }
                    else {
                        var err = new Error("You are not authorized to delete this comment!");
                        err.statusCode = 403;
                        return next(err);
                    }
                }
                else if (restaurant == null) {
                    err = new Error("Restaurant " + req.params.restaurantId + " not found!");
                    err.statusCode = 404;
                    return next(err);
                }
                else if (restaurant.products.id(req.params.productId) == null) {
                    err = new Error("Product " + req.params.productId + " not found!");
                    err.statusCode = 404;
                    return next(err);
                }
                else {
                    err = new Error("Comment " + req.params.commentId + " not found!");
                    err.statusCode = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

/*---------------
 * Exports Module
 * --------------*/
module.exports = restaurantRouter;
