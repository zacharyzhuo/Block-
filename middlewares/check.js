module.exports = {
  checkLogin: function checkLogin(req, res, next) {
    if ((!req.session.user) && (!req.session.manager) && (!req.session.store) && (!req.session.student)) {
      if (req.headers['mobile']) {
        return res.status(400).json({ status: "error", message: '未登入' });
      }
      else {
        req.flash('error', '未登入')
        return res.redirect('/signin')
      }
    }
    next()
  },

  checkNotLogin: function checkNotLogin(req, res, next) {
    if (req.session.user || req.session.manager || req.session.store || req.session.student) {
      if (req.headers['mobile']) {
        return res.status(400).json({ status: "error", message: '已登入' });
      }
      else {
        req.flash('error', '已登入')
        return res.redirect('homePage')// 返回之前的页面
      }
    }
    next()
  }
}
