var express = require('express');
var router = express.Router();

// for data storage
// https://stackabuse.com/a-sqlite-tutorial-with-node-js/
const AppDAO = require('../dao/dao')
const DataRepository = require("../dao/data-repository")

// setup the database
const dao = new AppDAO('./database.sqlite3', false /* trace for debugging */)
const dataRepo = new DataRepository(dao)

// sqlite3 database
dataRepo.createTable()
  .catch((err) => {
    // error handler
    console.log('Error: ')
    console.log(JSON.stringify(err))
  })

// Example sqlite3 database
/*var dataId;
dataRepo.createTable()
  .then(() => {
    console.log("Creating data...")
    // need to return here so next then function has the data
    return dataRepo.create("what")
  })
  .then((info) => {
    console.log("Returned inserted id:")
    console.log(info)
    // keep track of inserted id
    dataId = info.id
  })
  .then(() => {
    // need to return here so next then function has the data
    return dataRepo.getById(dataId)
  })
  .then((data) => {
    console.log("Got data back:")
    console.log(data)
  })
  .then(() => {
    // get all data, again need to return
    return dataRepo.getAll()
  })
  .then((data2) => {
    console.log("Got all data back:")
    console.log(data2)
  })
  .catch((err) => {
    // error handler
    console.log('Error: ')
    console.log(JSON.stringify(err))
  })
*/

/* GET data listing. */
router.get('/', function(req, res, next) {
  dataRepo.getAll().then((data) => {
    return res.status(200).json({
      status: "success",
      data: data,
    })
  }).catch((err) => {
    return res.status(500).json({
      status: "error",
      message: "error getting data",
    })
  })
});

module.exports = router;
