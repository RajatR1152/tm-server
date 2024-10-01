const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    dueDate: Date,
    status: String,
    asignedUser: String,
    priority: String,
    title: String,
    description: String,
})

const tasks = new mongoose.model('task', taskSchema);

module.exports = tasks;