module.exports = {
  port: 3000,
  session: {
    secret: 'blockchain',
    key: 'blockchain',
    maxAge: 2592000000
  },
  mongodb: 'mongodb://120.125.82.4:27017/blockchain'
}
