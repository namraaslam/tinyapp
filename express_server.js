const cookieSession = require('cookie-session');
const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const getUserByEmail = require("./helpers");
const PORT = 8080; // default port 8080

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  }
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const generateRandomString = () => {
  return Math.random().toString(36).substring(2,5);
};
 
const urlsForUser = (id) => {
  const usersURL = {};
  for (const ids in urlDatabase) {
    if (urlDatabase[ids] === id) {
      usersURL = urlDatabase[ids];
    }
  }
  return usersURL;
};

// MIDDLE WARE
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["hellowhatsup"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


// POST REQUESTS

app.post("/urls", (req, res) => {
  const loggedIn = req.session.user_id;
  if (!loggedIn) {
    return res.status(403).send("URL cannot be shortened because you are not logged in. Please <a href= '/login'>try again.</a");
  };
  const shortendURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortendURL] = { longURL: longURL, user_id: loggedIn};
  res.redirect("/urls/");
});


app.post("/urls/:id/delete", (req, res) => {
  const usersID = urlDatabase[req.params.id].user_id;
  const loggedIn = req.session.user_id;

  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("URL does not exist.");
  };

  if (!loggedIn) {
    return res.status(403).send("You are not logged in. Please <a href= '/login'>try again.</a");
  };

  if (loggedIn !== usersID) {
    return res.status(400).send("Sorry, this URL does not belong to your account.");
  };

  console.log("URL has been deleted");
  delete urlDatabase[req.params.id].longURL;
  res.redirect("/urls");
});


app.post("/urls/:id", (req, res) => {
  const usersID = urlDatabase[req.params.id].user_id;
  const loggedIn = req.session.user_id;

  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("URL does not exist.");
  };

  if (!loggedIn) {
    return res.status(403).send("You are not logged in. Please <a href= '/login'>try again.</a");
  };

  if (loggedIn !== usersID) {
    return res.status(400).send("This URL does not belong to your account.");
  };

  console.log("URL has been updated");
  urlDatabase[req.params.id].longURL = req.body.newURL;
  res.redirect("/urls");
});


app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!user || ((bcrypt.compareSync(user.password, hashedPassword) === false))) {
    return res.status(403).send("Error: 403 - Email or Password not valid. Please <a href= '/login'>try again.</a");
  };

  req.session.user_id = user.id;
  res.redirect("/urls");
});


app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});


app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const existingUser = getUserByEmail(email, users);
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (existingUser || email === "" || password === "") {
    return res.status(400).send("Invalid email or password.");
  };
  
  //happy path
  const user = {
    id: id,
    email: email,
    password: hashedPassword,
  };
  users[id] = user;
  res.session.user_id = id;
  res.redirect("/urls");
});


// GET REQUESTS

app.get("/urls", (req, res) => {
  const loggedIn = req.session.user_id;
  if (!loggedIn) {
    return res.status(400).send("To view URLs, please <a href= '/login'>login.</a");
  };

  const templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  const loggedIn = req.session.user_id;
  if (!loggedIn) {
    res.redirect("/login");
  };

  const templateVars = { user: users[req.session.user_id]};
  res.render("urls_new", templateVars);
});


app.get("/urls/:id", (req, res) => {
  const usersID = urlDatabase[req.params.id].user_id;
  const loggedIn = req.session.user_id;
  if (!loggedIn) {
    return res.status(400).send("To view URLs, please <a href= '/login'>login.</a");
  };
  if (loggedIn !== usersID) {
    return res.status(400).send("This URL does not belong to your account.");
  };

  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: users[req.session.user_id]};
  res.render("urls_show", templateVars);
});


app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("URL does not exist.");
  };
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const loggedIn = req.session.user_id;
  if (loggedIn) {
    res.redirect("/urls");
  };

  const templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const loggedIn = req.session.user_id;
  if (loggedIn) {
    res.redirect("/urls");
  };

  const templateVars = {user: users[req.session.user_id]};
  res.render("urls_login", templateVars);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});