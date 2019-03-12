const Store = require('../lib/mongo').store
module.exports = {
    // 注册一个用户

    create: function create(store) {
        return Store.create(store).exec()
    },

    // 通过用户名获取用户信息
    getUserByName: function getUserByName(name) {
        return Store
            .findOne({ name: name })
            .addCreatedAt()
            .exec()
    }
}