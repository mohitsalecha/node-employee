var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
const db = require('../db/dbwrapper');

const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');

const jwt = require('jsonwebtoken');

const expTime = '1h';
const sercertkey = 'sercertkey';

const users = [
  {
    Id: 1, UserName: 'mohits', Password: 'test123', Role: 'admin',
    Name: 'Mohit', PriEmail: 'm@m.com', SecEmail: 'm@m.com', Gender: 'male',
    DOB: new Date('08/01/1992'), PhoneNo: '9876544565', SkillSet: 'test1,test2',
    TotalExp: 4, PhotoPath: '', ResumePath: ''
  },
  {
    Id: 2, UserName: 'mohit1', Password: 'test123', Role: 'emp',
    Name: 'Mohit1', PriEmail: 'm@m.com', SecEmail: 'm@m.com', Gender: 'male',
    DOB: new Date('08/01/1992'), PhoneNo: '9876544565', SkillSet: 'test1,test2',
    TotalExp: 4, PhotoPath: '', ResumePath: ''
  },
  {
    Id: 3, UserName: 'mohit2', Password: 'test123', Role: 'emp',
    Name: 'Mohit2', PriEmail: 'm@m.com', SecEmail: 'm@m.com', Gender: 'male',
    DOB: new Date('08/01/1992'), PhoneNo: '9876544565', SkillSet: 'test1,test2',
    TotalExp: 4, PhotoPath: '', ResumePath: ''
  },
];

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

  let user = db.CheckUser(req.body.username, req.body.password);
  if (!user) {
    res.redirect("/users", { msg: "Invalid username or password." });
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
  let users = db.GetAllUsers();
  if (!users || typeof users === 'undefined') users = [];

  res.render('userList', { users: users, token: req.token });

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
  res.redirect('/', { msg: 'Logout success..' });
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

router.get('/addUser',verifyToken, function (req, res, next) {
  res.render('addUser', { title: 'Add User' });
});

router.post('/addUser', [
  check('primaryEmail').isEmail().withMessage('must be an email')
    .trim()
    .normalizeEmail(),

  check('EmpName').exists(),

  check('phoneNumber').exists().isLength({ min: 10, max: 12 }).withMessage('phone number required.')
    .matches(/\d/)

], function (req, res, next) {
  console.log(req);
  if (!req.files)
    return res.status(400).send('No files were uploaded.');

  // req.checkBody('EmpName').notEmpty().withMessage("Field requiredd.");
  // req.checkBody('txtPEmail').isEmail().withMessage("This should be proper email.");

  // req.checkBody('imageFile', 'Length should not more than 100Kb').custom((value, { req }) => req.files.imageFile.data.length / 1000 <= 100);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }

  let data = matchedData(req);
  console.log(data);
  let sampleFile = req.files.imageFile;
  // Use the mv() method to place the file somewhere on your server
  let path = __dirname + '\\..\\uploads\\' + sampleFile.name;

  console.log(path);
  sampleFile.mv(path, function (err) {
    if (err)
      return res.status(500).send(err);

    res.send('File uploaded!');
  });
});

module.exports = router;
