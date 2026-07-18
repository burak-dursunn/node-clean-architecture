if (process.env.NODE_ENV !== "production") {
  require('dotenv').config()
}

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var auth = require('./lib/auth');
var httpLogger = require('./lib/logger/httpLogger');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var categoriesRouter = require('./routes/categories');
var rolesRouter = require('./routes/roles');
var auditLogsRouter = require('./routes/auditlogs');
var eventsRouter = require('./routes/events');
var productsRouter = require('./routes/products');
var cartsRouter = require('./routes/carts');
var favoritesRouter = require('./routes/favorites');
var ordersRouter = require('./routes/orders');
var addressesRouter = require('./routes/addresses');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(auth.initialize());
app.use(httpLogger);

//! Routers
//todo Controller class
app.use('/api/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/addresses', addressesRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  const statusCode = err.status || err.code || 500;

  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(req.app.get('env') === 'development' && { stack: err.stack })
    }
  });
});

module.exports = app;
