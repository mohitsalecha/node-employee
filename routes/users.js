var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
const db = require('../db/dbwrapper');

const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');
const emailLib = require('../lib/email');

const jwt = require('jsonwebtoken');

const expTime = '1h';
const sercertkey = 'sercertkey';


/* GET users listing. */
router.get('/', function (req, res, next) {
  // db.SaveUser(users[0]);
  // res.send(db.GetAllUsers());
  // check if user already login
  if (typeof req.session.token !== 'undefined' && typeof req.session.userData !== 'undefined') {
    if (req.session.userData.Role === 'admin') {
      res.redirect('/users/userList/');
    } else {
      res.redirect('/users/userPage/' + user.id)
    }
  }
  res.render('index', { title: 'login' });
  //   res.send('respond with a resource');
  //req.session.errors = null;
});

// Check user and create token
router.post('/login', function (req, res, next) {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }
  let user = db.CheckUser(req.body.username, req.body.password);
  if (!user) {
    res.redirect("/users/");
  }

  jwt.sign({ user: user }, sercertkey, { expiresIn: expTime }, (err, token) => {
    // res.json({
    //   token
    // });
    req.session.success = true;
    req.session.token = token;
    req.session.userData = user;
    if (user.Role === 'admin') {
      res.redirect('/users/userList/');
    } else {
      res.redirect('/users/userPage/' + user.id)
    }
  });

});

// user list page
router.get('/userList', verifyToken, (req, res) => {
  let msg = req.query.msg || '';

  let users = db.GetAllUsers();
  if (!users || typeof users === 'undefined') users = [];

  res.render('userList', { users: users, token: req.token, msg:msg });

});

// Get user detail page
router.get('/userPage/:userId', verifyToken, (req, res) => {
  if (parseInt(req.params.userId) === req.authData.user.Id) {
    res.send('congo, you passed this check..');
  } else {
    res.send('you tring to cheat me...' + req.params.userId);
  }
});

router.post('/deleteUser/:userId', verifyToken, (req, res) => {
  db.DeleteUser(req.params.userId);
  res.redirect('/users/userList/')
});

router.get('/logout', verifyToken, (req, res) => {
  req.session.token = null;
  res.redirect('/users/', { msg: 'Logout success..' });
})

router.post('/api/posts', verifyToken, (req, res) => {

  jwt.verify(req.token, 'sercertkey', (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      res.json({
        authData,
        message: 'post created...'
      });
    }
  });
});


router.post('/api/login', (req, res) => {
  let user = { id: 1, username: 'mohits', password: 'test123' };

  jwt.sign({ user: user }, 'sercertkey', { expiresIn: '30s' }, (err, token) => {
    res.json({
      token
    });
  });
});

function verifyToken(req, res, next) {
  // get auth header value
  const bearerHeader = req.headers['authorization'];
  //token format => Authorization: Bearer <access_token>

  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    req.token = bearerToken;
    try {
      var authData = jwt.verify(bearerToken, sercertkey);
      req.authData = authData;
    } catch (err) {
      // err
      console.log(err);
      res.sendStatus(401);
    }
    next();
  } else if (typeof req.session.token !== 'undefined') {
    req.token = req.session.token;
    try {
      var authData = jwt.verify(req.token, sercertkey);
      req.authData = authData;
    } catch (err) {
      // err
      console.log(err);
      res.sendStatus(401);
    }
    next();
  } else {
    // forbidden
    res.sendStatus(401);
  }
}

router.get('/addUser', verifyToken, function (req, res, next) {
  res.render('addUser', { title: 'Add User' });
});

router.post('/addUser',verifyToken, function (req, res, next) {
  console.log(req);
  let errors = [];
  if (!req.files)
    return res.status(400).send('No files were uploaded.');
  if (!req.files.imageFile)
    errors.push("Please upload image file");
  if (!req.files.pdfFile)
    errors.push("Please upload pdf file");

  let data = matchedData(req);
  console.log(data);
  // Use the mv() method to place the file somewhere on your server
  let imageFile = req.files.imageFile;
  let pdfFile = req.files.pdfFile;
  let imgPath ='';
  let pdfPath ='';

  if (typeof imageFile !== 'undefined' && typeof pdfFile !== 'undefined') {
    imgPath = __dirname + '\\..\\uploads\\' + new Date().getTime().toString() + '_' + imageFile.name;
    pdfPath = __dirname + '\\..\\uploads\\' + new Date().getTime().toString() + '_' + pdfFile.name;
    console.log(imgPath);
    imageFile.mv(imgPath, function (err) {
      if (err)
        errors.push("Error in image file upload, " + err);
    });
    pdfFile.mv(pdfPath, function (err) {
      if (err)
        errors.push("Error in pdf file upload, " + err);
    });
  }
  if (errors.length > 0)
    return res.render('addUser', { title: 'Add User', errors: errors })

  let fields = req.body;
  user = {
    Id: 0,
    UserName: fields.username,
    Password: fields.password, Role: 'emp',
    Name: fields.fullName,
    PriEmail: fields.priEmail, SecEmail: fields.secEmail, Gender: fields.gender,
    DOB: new Date(fields.dob),
    PhoneNo: fields.phoneno, SkillSet: fields.skillSet,
    TotalExp: fields.totalExp, PhotoPath: imgPath, ResumePath: pdfPath
  };

  
  let result = db.SaveUser(user);

  switch (result) {
    case -1:
      errors.push('Username already exists.');
      return res.render('addUser', { title: 'Add User', errors: errors })
      break;
    case 0:
      errors.push('some error occur, user not saved.');
      return res.render('addUser', { title: 'Add User', errors: errors })
      break;
  }
  
  emailLib.sendRegistrationMail(user.PriEmail, user.UserName, user.Password);
  var string = encodeURIComponent('User added successfully.');
  res.redirect('/users/userList/?msg=' + string);
  
});

module.exports = router;
