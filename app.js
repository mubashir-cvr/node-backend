const path = require('path');
const mongoose = require('mongoose');

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

const appRoutes = require('./routes/v1/index');
const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('', appRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

mongoose
  .connect(
    'mongodb://marjintechonline:mubashirjan24@ac-rap9dl6-shard-00-00.a1ijif0.mongodb.net:27017,ac-rap9dl6-shard-00-01.a1ijif0.mongodb.net:27017,ac-rap9dl6-shard-00-02.a1ijif0.mongodb.net:27017/?ssl=true&replicaSet=atlas-14h2xo-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster1'
  )
  .then(result => {
    console.log("Connected")
    app.listen(3000);
  })
  .catch(err => {
    console.log(err)
    console.log("Not Connected")
  });
