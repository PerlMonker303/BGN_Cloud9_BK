require('dotenv').config()

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const connection = require('./database');
const arxiv = require('arxiv-api');
const SerpApi = require('google-search-results-nodejs')

// route for fetching youtube playlist link that is of the topic keyword  
app.route('/videos/:keyword')
  .get(function (req, res, next) {
    const apiKey = '9ffa4a58c902e8ca500a8e88020e029de4d703f7a3a45760c4071c01e2ee64e6';
    const search = new SerpApi.GoogleSearch(apiKey)
    const params = {
      engine: "youtube",
      search_query: req.params.keyword + ' khanacademy'
    };
    const callback = function (data) {
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
    const apiKey = 'fd82d9f422cd157f5c18d74f4528d34f116ff85094d8b29f95f0160b612f034e';
    const search = new SerpApi.GoogleSearch(apiKey)
    search.json({
      q: req.params.keyword,
      tbm: 'isch',
      safe: true,
    }, (result) => {
      let images = result.images_results;
      images = images.map(image => {
        return {
          link: image.original,
          thumbnail: image.thumbnail
        }
      })
      res.json(images.splice(0, 10))
    })
  });

app.get('/status', (req, res) => res.send('Working!'));

// Port 8080 for Google App Engine
const port = process.env.PORT || 5000
app.set('port', port);
app.listen(port);