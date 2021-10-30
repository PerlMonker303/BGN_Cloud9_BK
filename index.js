require('dotenv').config()

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const bodyParser = require('body-parser');
const connection = require('./database');
const arxiv = require('arxiv-api');

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

const getPdfLink = (articleLinks) => {
  return articleLinks.find(lnk => lnk.type == "application/pdf")
}

// route for fetching articles that contain keyword
app.route('/articles/:keyword')
  .get(async (req, res, next) => {
    let articles = await arxiv.search({
      searchQueryParams: [
        {
          include: [{ name: req.params.keyword }],
        },
      ],
      start: 0,
      maxResults: 10,
    });

    articles = articles.map(article => {
      const pdfLink = getPdfLink(article.links);
      if (!pdfLink) {
        return undefined;
      }
      return {
        title: article.title,
        description: article.summary,
        link: pdfLink.href + ".pdf"
      }
    })
    articles = articles.filter(article => article !== undefined)
    res.json(articles);
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
const port = process.env.PORT || 5000
app.set('port', port);
app.listen(port);