require('dotenv').config()

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const bodyParser = require('body-parser');
const connection = require('./database');
const arxiv = require('arxiv-api');
const SerpApi = require('google-search-results-nodejs')

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
    // connection.query(
    //   "SELECT * FROM `videos` WHERE keyword = ? LIMIT 1", req.params.keyword,
    //   function (error, results, fields) {
    //     if (error) throw error;
    //     res.json(results);
    //   }
    // );

    // --------- API ----------
    const apiKey = '5b5c52fda8d7d5897c27ad1b5553e6a16c482bfce824dd2dbe19f685d23762d4';
    const search = new SerpApi.GoogleSearch(apiKey)
    const params = {
      engine: "youtube",
      search_query: req.params.keyword
    };
    
    const callback = function(data) {
      let video_res = data['video_results']
      video_res = video_res.map(video_res => {
        return {
          title: video_res.title,
          id: video_res.link.split('v=')[1],
          thumbnail: video_res.thumbnail
        }
      })
      res.json(video_res.splice(0, 6))
    };
    search.json(params, callback)
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
      maxResults: 50,
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
        const parsedResults = results.map(res => {
          return {
            link: res.link,
            thumbnail: res.link
          }
        })
        res.json(parsedResults);
      }
    );
    // ---------
    // const apiKey = 'b430cc42ff0212b08e4879dd70f19f315431fce8b031b5cba85bd9ac4b700980';
    // const search = new SerpApi.GoogleSearch(apiKey)
    // search.json({
    //   q: req.params.keyword,
    //   tbm: 'isch',
    //   safe: true,
    // }, (result) => {
    //   let images = result.images_results;
    //   images = images.map(image => {
    //     return {
    //       link: image.original,
    //       thumbnail: image.thumbnail
    //     }
    //   })
    //   res.json(images.splice(0, 10))
    // })
  });

app.get('/status', (req, res) => res.send('Working!'));

// Port 8080 for Google App Engine
const port = process.env.PORT || 5000
app.set('port', port);
app.listen(port);