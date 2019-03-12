const express = require('express')
const router = express.Router()
const checkLogin = require('../../middlewares/check').checkLogin
var queryStore
var queryStoreTickets

//
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://120.125.82.4:27017/";
//

MongoClient.connect(url, checkLogin, function (err, db) {
    if (err) throw err;
    var dbo = db.db("blockchain");
    dbo.collection("stores").find({}).toArray(function (err, result) { // 返回集合中所有数据
        if (err) throw err;
        queryStore = result
        db.close();
    });
});

router.get('/', checkLogin, function (req, res, next) {
    res.render('manager/queryStore', {
        queryStore: queryStore
    })
})



module.exports = router