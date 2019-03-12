const Manager = require('../lib/mongo').manager
module.exports = {
    // 注册一个用户

    create: function create(manager) {
        return Manager.create(manager).exec()
    },

    // 通过用户名获取用户信息
    getUserByName: function getUserByName(name) {
        return Manager
            .findOne({ name: name })
            .addCreatedAt()
            .exec()
    }
}