const express = require('express')
const app = express()
const PORT = 8080

//EJS requires
app.set('view engine', 'ejs')
const { compile } = require('ejs');

//bodyParser requires
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//cookieSession requires
const cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ['key1'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

//bcrypt requires
const bcrypt = require('bcryptjs');

const getUserByEmail = require('./helpers')

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "userRandomID" },
  sodu35: { longURL: "https://www.sometyhing.ca", userID: "user3RandomID" },
  n738xz: { longURL: "https://www.googleasfafaf.ca", userID: "user3RandomID" },
  fnutx: { longURL: "https://www.mdt2.ca", userID: "user4RandomID" },
  qj1zd1: { longURL: "https://www.mdt.ca", userID: "user4RandomID" }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

// functionality for home page / 
app.get('/', (req, res) => {
  res.redirect('/urls')
})

//////////////////////////////////////////   REGISTER URL  //////////////////////////////////////////
app.get('/register', (req, res) => {
  const templateVars = { 
    user: req.session["userID"],
    urls: urlDatabase };
    res.render('urls_registration', templateVars)
})

// function which creates a new user in the user object based on information passed during registration page. Checks if valid email + password combo has been entered. Checks if user already exits. If passes the checks then creates the new user and adds to the user object. Then creates a cookie and redirects to /urls
app.post("/register", (req, res) => {
  //check if a password and email has been entered, if not, return status 400
  if (!req.body.email || !req.body.password) {
    return (res.status(400).send('Bad Request, invalid email/password'));
  }

  //check if the user exists, if true, return status 400
  if (registerChecking(req.body)) {
    return (res.status(400).send('Bad Request, User already exists'));
  }

  const id = generateRandomString()
  const email = req.body.email
  const password = bcrypt.hashSync(req.body.password, 10);
  users[id] = { id, email,password };
  
  req.session.userID = id;
  res.redirect(`/urls/`)
});

//////////////////////////////////////////   LOGIN URL  /////////////////////////////////////////
app.post("/login", (req, res) => {

  const user = getUserByEmail(req.body.email, users);

  //If a user with that e-mail cannot be found, return a response with a 403 status code.
  if (!user) {
    return (res.status(403).send('Forbidden, user does not exist'));
  }

  //function which returns the user by thier email

  //If a user with that e-mail address is located, compare the password given in the form with the existing user's password. If it does not match, return a response with a 403 status code.
  if (!bcrypt.compareSync(req.body.password, user.password)){
    return (res.status(403).send('Forbidden, password wrong'));
  }

  //if both checks pass
  req.session.userID = user.id;
  res.redirect(`/urls/`)
});

app.get("/login", (req, res) => {
  const templateVars = { 
    user: req.session["userID"],
  };
  res.render('urls_login', templateVars)
});

//////////////////////////////////////////   LOGOUT URL  //////////////////////////////////////////
app.post("/logout", (req, res) => {
  req.session = null
  res.redirect(`/urls/`)
});

//////////////////////////////////////////   /URL URL  //////////////////////////////////////////
app.get('/urls', (req, res) => {
  const userID = req.session.userID
  console.log(urlDatabase)
  
  let urls = urlsForUser(userID)

  const templateVars = { 
    user:  users[userID],
    urls: urls }; 

  res.render('urls_index', templateVars)
})

//function which recieves the results of the form for creating new urls. Creates and adds a new key to the object in the form of shortUrl: {longUrl: website, userID: userID}. Then redirects to the new shortURL url to allow user to view/edit the url
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString()
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.userID
  }
  res.redirect(`/urls/${shortURL}`)
});

//////////////////////////////////////////    /urls/new page   //////////////////////////////////////////

// functionality for /urls/new page 
app.get('/urls/new', (req, res) => {
  const userID = req.session.userID
  //if user is not logged in sent them to login page
  if (userID === undefined) {
    return res.redirect(`/login/`)
  }
  const templateVars = { 
    user: users[userID],
    urls: urlDatabase };
  res.render('urls_new', templateVars)
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//////////////////////////////////////////   LOGIN /urls/:shortURL  //////////////////////////////////////////

app.get("/u/:shortURL", (req, res) => {
  console.log(urlDatabase)
  const longURL = urlDatabase[req.params.shortURL].longURL
  res.redirect(longURL)
});

//function which dynamically loads the urls by catching the shortURL entered and dynamically passing it to the urls_show ejs
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session["userID"]
  const shortURL = req.params.shortURL
  const longURL = urlDatabase[shortURL].longURL

  const templateVars = { 
    user: users[userID],
    shortURL, longURL};
  res.render("urls_show", templateVars);
});

//post method for updating entries in the urls
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  const longURL = req.body.longURL
  const userID = req.session["userID"]

  //function which checks if the active user is the the owner of the URL
  if (!isActiveUsersURL(req)) {return(res.status(400).send('Bad Request, this is not your link'))}

  urlDatabase[shortURL] = {longURL, userID: req.session.userID}
  res.redirect(`/urls`)
});

//post method for deleting entries in the urls
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session["userID"]

  //function which checks if the active user is the the owner of the URL
  if (!isActiveUsersURL(req)) {return(res.status(400).send('Bad Request, this is not your link'))}
  
  delete urlDatabase[req.params.shortURL]
  res.redirect(`/urls`)
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//function which generates a random 6 letter string
function generateRandomString() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz123456789'
  let randomString = ''
  for (let i = 0; i < 6; i++){
    let index = [Math.floor(Math.random() * 35)]
    randomString = randomString + alphabet[index]
  }
  return (randomString)
}

//listening functionality
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

/**
//function which looks through the user registry and determines if the user already exists. If the user exists return the usersID, If the user does not exist return null
 * Input:
 *   - req
 * Returns:
 *   - true/false
 */
const registerChecking = (body) => {
  for (const user in users) {
      if(users[user].email === body.email){
        return true
      }
  }
  return(false)
}

/**
* Takes in a userID and loops through the urlDatabase to find out which urls belong to that user. Creates a new urlDatabase for that specific users. Returns the new database.password
 * Input:
 *   - userID
 * Returns:
 *   - userID specific urlDatabase
 */
const urlsForUser = (id) => {
  let userUrlDatabase = {}
  for (const url in urlDatabase) {
    if(id === urlDatabase[url].userID){
      let shortURL = url
      let longURL = urlDatabase[url].longURL
      let userID = urlDatabase[url].userID
      userUrlDatabase[shortURL] = 
        {longURL, userID}
    }
  }
  return(userUrlDatabase)
}

/**
 * function which checks if the active user is the owner of the url being accessed. If not reutrn false
 * Input:
 *   - req object
 * Returns:
 *   - true/false
 */
const isActiveUsersURL = (req) => {
  const userID = req.session["userID"]
  const shortURL = req.params.shortURL
  const longURL = urlDatabase[shortURL].longURL

  //conditional that checks if the user is the owner of the URL being accessed
  if(urlDatabase[shortURL].userID !== userID){
    return (false)
  }
  return true
}

