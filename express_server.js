const express = require('express')
const app = express()
const PORT = 8080
app.set('view engine', 'ejs')
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

// functionality for home page / 
app.get('/', (req, res) => {
  res.send('Hello')
})


// functionality for /urls page 
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars)
})

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString()
  urlDatabase[shortURL] = req.body.longURL
  res.redirect(`/urls/${shortURL}`)
});

// functionality for /urls/new page 
app.get('/urls/new', (req, res) => {
  res.render('urls_new')
})

// functionality for /urls/:shortURL pages
app.get("/urls/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  const templateVars = { shortURL: req.params.shortURL, longURL: longURL };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL)
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
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