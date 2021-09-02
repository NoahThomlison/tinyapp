const express = require('express')
const app = express()
const PORT = 8080
app.set('view engine', 'ejs')
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser');
const { compile } = require('ejs');
app.use(cookieParser())

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
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
  res.send('Hello')
})

/////////////////////   REGISTER URL  /////////////////////
app.get('/register', (req, res) => {
  const templateVars = { 
    user: req.cookies["userID"],
    urls: urlDatabase };
    res.render('urls_registration', templateVars)
})

// function which creates a new user in the user object based on information passed during registration page. Checks if valid email + password combo has been entered. Checks if user already exits. If passes the checks then creates the new user and adds to the user object. Then creates a cookie and redirects to /urls
app.post("/register", (req, res) => {
  //check if a password and email has been entered, if not, return status 400
  if (!req.body.email || !req.body.password) return (res.status(400).send('Bad Request, invalid email/password'));

  //check if the user exists, if true, return status 400
  if (registerChecking(req.body)) return (res.status(400).send('Bad Request, User already exists'));

  const userID = generateRandomString()
  const email = req.body.email
  const password = req.body.password
  users[userID] = {
    id: userID,
    email: email,
    password: password
  }
  res.cookie("userID", userID); 
  res.redirect(`/urls/`)
});

/////////////////////   LOGIN URL  /////////////////////
app.post("/login", (req, res) => {
  //If a user with that e-mail cannot be found, return a response with a 403 status code.
  if (!registerChecking(req.body)) return (res.status(403).send('Forbidden, user does not exist'));

  const userIDLogin = registerChecking(req.body)

  //If a user with that e-mail address is located, compare the password given in the form with the existing user's password. If it does not match, return a response with a 403 status code.
  if (req.body.password !== users[userIDLogin].password) return (res.status(403).send('Forbidden, password wrong'));

  //if both checks pass as
  res.cookie("userID", userIDLogin); 
  res.redirect(`/urls/`)
});

app.get("/login", (req, res) => {
  const templateVars = { 
    user: req.cookies["userID"],
  };
  res.render('urls_login', templateVars)
});

/////////////////////   LOGOUT URL  /////////////////////
app.post("/logout", (req, res) => {
  res.clearCookie("userID")
  res.redirect(`/urls/`)
});

/////////////////////   /URL URL  /////////////////////
app.get('/urls', (req, res) => {
  const userID = req.cookies["userID"]
  const templateVars = { 
    user: users[userID],
    urls: urlDatabase };
  res.render('urls_index', templateVars)
})

//function which recieves the results of the form for creating new urls. Creates and adds a new key to the object in the form of shortUrl: {longUrl: website, userID: userID}. Then redirects to the new shortURL url to allow user to view/edit the url
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString()

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies.userID
  }

  res.redirect(`/urls/${shortURL}`)
});

// functionality for /urls/new page 
app.get('/urls/new', (req, res) => {
  const userID = req.cookies["userID"]

  //if user is not logged in sent them to login page
  if (userID === undefined) res.redirect(`/login/`)

  const templateVars = { 
    user: users[userID],
    urls: urlDatabase };
  res.render('urls_new', templateVars)
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

/////////////////////   LOGIN /urls/:shortURL  /////////////////////

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL)
});

//function which dynamically loads the urls by catching the shortURL entered and dynamically passing it to the urls_show ejs
app.get("/urls/:shortURL", (req, res) => {
  const urlObject = urlDatabase[req.params.shortURL]
  const longURL = urlObject.longURL
  console.log(longURL)
  const templateVars = { 
    user: req.cookies["userID"],
    shortURL: req.params.shortURL, longURL: longURL };
  res.render("urls_show", templateVars);
});

//post method for updating entries in the urls
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  const newLongURL = req.body.longURL
  urlDatabase[shortURL] = newLongURL
  res.redirect(`/urls`)
});

//post method for deleting entries in the urls
app.post("/urls/:shortURL/delete", (req, res) => {
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

//function which looks through the user registry and determines if the user already exists. If the user exists return the usersID, If the user does not exist return null
const registerChecking = (body) => {
  for (const user in users) {
      if(users[user].email === body.email){
        return(users[user].id)
      }
  }
  return(false)
}