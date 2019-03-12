const fs = require('fs')
const path = require('path')
const sha1 = require('sha1')
const express = require('express')
const router = express.Router()

const UserModel = require('../../models/student')
const checkNotLogin = require('../../middlewares/check').checkNotLogin

// GET /signup 注册页
router.get('/', checkNotLogin, function (req, res, next) {
  res.render('student/studentsignup')
})

// POST /signup 用户注册
router.post('/', checkNotLogin, function (req, res, next) {
  const name = req.fields.name
  let password = req.fields.password
  const repassword = req.fields.repassword

  // 校验参数
  try {
    if (!(name.length >= 1 && name.length <= 10)) {
      throw new Error('帳號請控制在1-10個字元')
    }
    if (password.length < 6) {
      throw new Error('密碼至少6個字元')
    }
    if (password !== repassword) {
      throw new Error('兩次輸入密碼不一致')
    }
  } catch (e) {
    if (req.headers['mobile']) {
      return res.status(400).json({ status: "error", message: e.message });
    }
    else {
      req.flash('error', e.message)
      return res.redirect('/student/signup')
    }
  }

  // 明文密码加密
  password = sha1(password)

  // 待写入数据库的用户信息
  let student = {
    name: name,
    password: password
  }
  // 用户信息写入数据库
  UserModel.create(student)
    .then(function (result) {
      // 此 user 是插入 mongodb 后的值，包含 _id
      student = result.ops[0]
      // 删除密码这种敏感信息，将用户信息存入 session
      delete student.password
      //req.session.student = student
      
      if (req.headers['mobile']) {
        return res.status(200).json({ status: "ok", message: '註冊成功' });
      }
      else {
        // 写入 flash
        req.flash('success', '註冊成功')
        // 跳转到首页
        res.redirect('/posts')
      }
    })
    .catch(function (e) {
      // 用户名被占用则跳回注册页，而不是错误页
      if (e.message.match('duplicate key')) {
        if (req.headers['mobile']) {
          return res.status(400).json({ status: "error", message: '此帳號已被使用' });
        }
        else {
          req.flash('error', '此帳號已被使用')
          return res.redirect('/student/signup')
        }
      }
      next(e)
    })
})

module.exports = router
