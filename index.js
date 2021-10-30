require('dotenv').config()

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const bodyParser = require('body-parser');
const connection = require('./database');

// route for fetching short description of the keyword searched for
app.route('/paragraphs/:keyword')
  .get(function (req, res, next) {
    connection.query(
      "SELECT * FROM `paragraphs` WHERE keyword = ? LIMIT 1", req.params.keyword,
      function (error, results, fields) {
        if (error) throw error;
        res.json(results);
      }
    );
  });

// route for fetching youtube playlist link that is of the topic keyword  
app.route('/videos/:keyword')
  .get(function (req, res, next) {
    connection.query(
      "SELECT * FROM `videos` WHERE keyword = ? LIMIT 1", req.params.keyword,
      function (error, results, fields) {
        if (error) throw error;
        res.json(results);
      }
    );
  });

// route for fetching articles that contain keyword
app.route('/articles/:keyword')
  .get(function (req, res, next) {
    connection.query(
      "SELECT * FROM `articles` WHERE title LIKE '%" + req.params.keyword + "%';",
      function (error, results, fields) {
        if (error) throw error;
        res.json(results);
      }
    );
  });

// route for fetching images with the keyword searched
app.route('/images/:keyword')
  .get(function (req, res, next) {
    connection.query(
      "SELECT * FROM `Images` WHERE keyword = ?", req.params.keyword,
      function (error, results, fields) {
        if (error) throw error;
        res.json(results);
      }
    );
  });

app.get('/status', (req, res) => res.send('Working!'));

// Port 8080 for Google App Engine
app.set('port', process.env.PORT || 5000);
app.listen(5000);