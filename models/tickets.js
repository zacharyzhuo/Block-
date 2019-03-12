const Ticket = require('../lib/mongo').Ticket

module.exports = {
  // 注册一个用户
  create: function create (ticket) {
    return Ticket.create(ticket).exec()
  },

  // 通过用户名获取用户信息
  getTicketByStudentId: function getTicketByStudentId (student_id) {
    return Ticket
      .findOne({ student_id: student_id })
      .addCreatedAt()
      .exec()
  }
}
