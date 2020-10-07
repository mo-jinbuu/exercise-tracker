const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')

// import model
const user = require('./model/user.js')

require('dotenv').config()

const urlencodedParser = bodyParser.urlencoded({ extended: false })

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, (err) => {
  if (err) console.log(err)

  console.log("Connection established with MongoDB: " + mongoose.connection.readyState)
})

app.use(cors())

app.get('/api/exercise/users', urlencodedParser, async (req, res) => {
  let results = [];
  let allUsers = await user.find({}, (err, data) => {
    if (err) console.log(err)
    for (let element of data) {
      results.push({
        userId: element._id,
        username: element.username
      })
    }
  })

  res.send(results)
})

app.get('/api/exercise/log', urlencodedParser, async (req, res) => {
  let { userId: _id, from, to, limit } = req.query;

  let foundUser = await user.findById({ _id }, (err, data) => {
    if (err) console.log(err)

    if (!data) {
      // If user not found, send error message to user
      res.send(`User not found (id: ${data._id}) in database`)
    } else {
      // User found
      let username = data.username;
      let log = [...data.log];

      // filter exercise log based off query inputs (from, to and limit)
      if (from) {
        let startDate = new Date(from)
        log = log.filter(element => new Date(element.date).getTime() > startDate.getTime())
      }

      if (to) {
        let endDate = new Date(to)
        log = log.filter(element => new Date(element.date).getTime() < endDate.getTime())
      }

      if (limit) {
        log = log.slice(0, limit)
      }

      // Sort logs based of date (newest to oldest)
      log = log.sort((first, second) => first.date > second.date)

      // Structure log information to desired format
      log = log.map((i) => ({
        description: i.description,
        duration: parseInt(i.duration),
        date: i.date.toString().substring(0, 15)
      }))

      console.log('Final log: ' + JSON.stringify(log))
      // Send information to user
      res.send({
        _id: _id,
        username: username,
        count: log.length,
        log: [...log]
      })
    }
  })
})

app.post('/api/exercise/new-user', urlencodedParser, async (req, res) => {
  let username = req.body.username;

  let userExist = await user.findOne({ username: username }, (err, data) => {
    if (err) { return res.send('Error: ' + err) }

    // If no user found with that username in db, create user
    if (!data) {
      // Create New User
      let newUser = new user({
        _id: mongoose.Types.ObjectId(),
        username: username
      })

      newUser.save((err, savedUser) => {
        if (err) {
          console.log(err);
          process.exit(0)
        }
        console.log('Document inserted successfuly')
        // Send user information as json
        res.send(newUser)
      })

      // If user already exist
    } else {
      console.log('User already exist')
      res.send('Cannot add user as username already exist: ' + data.username)
    }
  })
})

app.post('/api/exercise/add', urlencodedParser, async (req, res) => {
  let { userId: _id, description, duration, date } = req.body;
  duration = parseInt(duration)
  // If no date is specified by user, use today as date object
  if (!date) {
    date = new Date()
  } else {
    // Convert date string to date object
    date = new Date(date)
  }

  let foundUser = await user.findById({ _id }, (err, data) => {

    if (err) console.log(err)

    if (!data) {
      // User Id not found in db
      res.send(`User not found (id: ${_id}) in database`)
    } else {
      // User found, push new exercise information to user
      data.log.push({
        description: description,
        duration: parseInt(duration),
        date: date
      })

      data.save((err, savedUser) => {
        if (err) console.log(err)

        console.log(`New exercise added to userId: ${savedUser._id}`)

        let resObj = {
          _id: savedUser._id,
          username: savedUser.username,
          date: date.toString().substring(0, 15),
          duration: parseInt(duration),
          description: description
        }
        res.send(resObj)
      })
    }
  })
})

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
