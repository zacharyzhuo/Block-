module.exports = function (app) {
  app.get('/', function (req, res) {
    res.redirect('/homePage')
  })
  app.use('/manager/signup', require('./manager/signup'))
  app.use('/manager/signin', require('./manager/signin'))
  app.use('/manager/manage', require('./manager/manage'))
  app.use('/manager/verifyApplicationPass', require('./manager/verifyApplicationPass'))
  app.use('/manager/verifyApplicationFail', require('./manager/verifyApplicationFail'))
  app.use('/manager/querySuccessApplyStatusFalse', require('./manager/querySuccessApplyStatusFalse'))
  app.use('/manager/querySuccessApplyStatusTrue', require('./manager/querySuccessApplyStatusTrue'))
  app.use('/manager/queryFailedApplyStatus', require('./manager/queryFailedApplyStatus'))
  app.use('/manager/queryUsedTicket', require('./manager/queryUsedTicket'))
  app.use('/manager/queryNotUsedTicket', require('./manager/queryNotUsedTicket'))
  app.use('/manager/queryStore', require('./manager/queryStore'))


  app.use('/store/signup', require('./store/signup'))
  app.use('/store/signin', require('./store/signin'))
  app.use('/store/store', require('./store/store'))
  app.use('/store/queryStoreTicket', require('./store/queryStoreTicket'))
  app.use('/store/transaction', require('./store/transaction'))

  app.use('/student/signup', require('./student/signup'))
  app.use('/student/signin', require('./student/signin'))
  app.use('/student/queryTicketsByOwner', require('./student/queryTicketsByOwner'))
  app.use('/student/createQrcode', require('./student/createQrcode'))
  app.use('/student/apply', require('./student/apply'))
  app.use('/student/queryApplyStatus', require('./student/queryApplyStatus'))
  app.use('/student/queryConsumptionRecords', require('./student/queryConsumptionRecords'))
  app.use('/student/personalInfo', require('./student/personalInfo'))
  
  app.use('/signout', require('./signout'))
  app.use('/posts', require('./posts'))
  app.use('/homePage', require('./homePage'))
  app.use('/comments', require('./comments'))
  app.use('/mobileCheckLogin', require('./mobileCheckLogin'))


  // 404 page
  app.use(function (req, res) {
    if (!res.headersSent) {
      res.status(404).render('404')
    }
  })
}
