const sha1 = require('sha1')
const express = require('express')
const router = express.Router()

const UserModel = require('../../models/student')
const checkNotLogin = require('../../middlewares/check').checkNotLogin

// GET /signin 
router.get('/', checkNotLogin, function (req, res, next) {
  res.render('studentsignin')
})

// POST /signin 
router.post('/', function (req, res, next) {
  if (req.headers['mobile']) {
    const name = req.fields.name
    const password = req.fields.password

    // 校验参数
    try {
      if (!name.length) {
        throw new Error('請輸入帳號')
      }
      if (!password.length) {
        throw new Error('請輸入密碼')
      }
    } catch (e) {
      req.flash('error', e.message)
      if (req.headers['mobile']) {
        return res.status(400).json({ status: "error", message: e.message });
      }
      else {
        return res.redirect('back')
      }
    }
    UserModel.getUserByName(name)
      .then(function (user) {
        if (!user) {
          if (req.headers['mobile']) {
            return res.status(400).json({ status: "error", message: '此帳號不存在' });
          }
          else {
            req.flash('error', '此帳號不存在')
            return res.redirect('back')
          }
        }
        // 检查密码是否匹配
        if (sha1(password) !== user.password) {
          if (req.headers['mobile']) {
            return res.status(400).json({ status: "error", message: '帳號或密碼輸入錯誤' });
          }
          else {
            req.flash('error', '帳號或密碼輸入錯誤')
            return res.redirect('back')
          }
        }
        req.flash('success', '登入成功')
        // 用户信息写入 session
        delete user.password
        req.session.student = user
        // 跳转到主页
        if (req.headers['mobile']) {
          return res.status(200).json({ status: "ok", message: '登入成功' });
        }
        else {
          res.redirect('../posts')
        }
      })
      .catch(next)
  }
})

module.exports = router