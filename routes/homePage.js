const express = require('express')
const router = express.Router()

const checkLogin = require('../middlewares/check').checkLogin
const PostModel = require('../models/posts')

router.get('/', function (req, res, next) {
  const author = req.query.author
  var manager = req.session.manager
  var store = req.session.store

  if (manager != null) {
    res.redirect('/manager/manage')
  }
  if (store != null) {
    res.redirect('/store/store')
  }
  PostModel.getPosts(author)
    .then(function (posts) {
      res.render('homePage', {
        homePage: posts
      })
    })
    .catch(next)

})

module.exports = router