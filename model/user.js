const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: {type: mongoose.Types.ObjectId},
  username: {type: String, required: true, unique: true},
  log:[
        {
          description: {type: String, required: true},
          duration: {type: Number, required: true},
          date: {type: String}
        }
      ]
},  {
  timestamps: true
})

module.exports = mongoose.model('user', userSchema);