const express = require('express')
const router = express.Router()

router.post('/', function (req, res, next) {
    if (req.session.user || req.session.manager || req.session.store || req.session.student) {
        return res.status(200).json({ status: "ok", message: '已登入' });
    }
    else {
        return res.status(400).json({ status: "error", message: '請輸入帳號密碼' });
    }
})

module.exports = router