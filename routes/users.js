var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/Add', function(req, res, next) {
  res.render('addUser', { title: 'Add User' });
});


router.post('/upload', function (req, res, next) {
  console.log(req);
  if (!req.files)
      return res.status(400).send('No files were uploaded.');

  let sampleFile = req.files.imageFile;
    // Use the mv() method to place the file somewhere on your server
    let path= __dirname +'\\..\\uploads\\'+sampleFile.name;

 console.log(path);
  sampleFile.mv(path, function(err) {
    if (err)
      return res.status(500).send(err);
 
    res.send('File uploaded!');
  });
});

module.exports = router;
