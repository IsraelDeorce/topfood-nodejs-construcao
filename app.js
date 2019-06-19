// modules =====================================================================
var createError = require("http-errors");
var express = require("express");
var app = express();
var port = process.env.PORT || 3003;
var mongoose = require("mongoose");
var cookieParser = require("cookie-parser");
var morgan = require("morgan");
var config = require("./config/config");

// variables containing the routes files =======================================
var indexRouter = require("./routes/index");
var restaurantRouter = require("./routes/restaurantRouter");
var databaseRouter = require("./routes/databaseRouter");

// configuration ===============================================================
mongoose.connect(process.env.MONGODB_URI || config.mLab, { useNewUrlParser: true }); // connect to database

// set up our express application ==============================================
app.use(morgan("dev")); // log every request to the console
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes ======================================================================
app.use("/", indexRouter);
app.use("/restaurants", restaurantRouter);
app.use("/database", databaseRouter);

// catch 404 and forward to error handler ======================================
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler ===============================================================
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.statusCode || 500);
  res.setHeader("Content-Type", "application/json");
  res.json({message: err.message});
});

// launch ======================================================================
app.listen(port);
console.log("Acesse localhost:" + port);
