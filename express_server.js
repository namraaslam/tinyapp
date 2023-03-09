const cookieSession = require('cookie-session');
const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const getUserByEmail = require("./helpers");
const PORT = 8080; // default port 8080



const urlDatabase = {
};

const users = {
};

// function that returns urls registers to a user 
const urlsForUser = (id) => {
  const usersURL = {};
  for (const ids in urlDatabase) {
    if (urlDatabase[ids] === id) {
      usersURL[ids] = urlDatabase[ids];
    }
  }
  return usersURL;
};

// function to create random string 
const generateRandomString = () => {
  return Math.random().toString(36).substring(2,8);
};



/* ---------- MIDDLEWARE ---------- */
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["hellowhatsup"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));




/* ---------- POST REQUESTS ---------- */

app.post("/urls", (req, res) => {
  const loggedIn = req.session.user_id;

  // error msg sent if user isnt logged in
  if (!loggedIn) {
    return res.status(403).send("URL cannot be shortened because you are not logged in. Please <a href= '/login'>try again.</a");
  };

  // happy path
  const shortendURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortendURL] = { longURL: longURL, user_id: loggedIn};
  res.redirect(`/urls/${shortendURL}`);
});


app.post("/urls/:id/delete", (req, res) => {
  const loggedIn = req.session.user_id;

  // error msg sent if url doesnt exist 
  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("URL does not exist.");
  };

  // error msg sent if user isnt logged in 
  if (!loggedIn) {
    return res.status(403).send("You are not logged in. Please <a href= '/login'>try again.</a");
  };

  const usersID = urlDatabase[req.params.id].user_id;

  // error msg sent if url doesnt belong to logged in user 
  if (loggedIn !== usersID) {
    return res.status(400).send("Sorry, this URL does not belong to your account.");
  };

  // happy path 
  console.log("URL has been deleted");
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});



app.post("/urls/:id", (req, res) => {
  // error msg if url doesnt exist
  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("URL does not exist.");
  };

  const loggedIn = req.session.user_id;
  // error msg sent if user isnt logged in 
  if (!loggedIn) {
    return res.status(403).send("You are not logged in. Please <a href= '/login'>try again.</a");
  };

  const usersID = urlDatabase[req.params.id].user_id;
  // error msg sent if url doesnt belong to logged in user 
  if (loggedIn !== usersID) {
    return res.status(400).send("This URL does not belong to your account.");
  };

  // happy path 
  console.log("URL has been updated");
  urlDatabase[req.params.id].longURL = req.body.newURL;
  res.redirect("/urls");
});


app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const existingUser = getUserByEmail(email, users);
  
  // error msg sent if user not logged in 
  if(!existingUser) {
    return res.status(403).send("Error: 403 - Email or Password not valid. Please <a href= '/login'>try again.</a");
  };

  // error msg sent for non matching passwords 
  if (((bcrypt.compareSync(password, existingUser.password) === false))) {
    return res.status(403).send("Error: 403 - Email or Password not valid. Please <a href= '/login'>try again.</a");
  };

  // happy path 
  req.session.user_id = existingUser.id;
  res.redirect("/urls");
});


app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});


app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  // error msg sent if email or password empty 
  if (!email|| !password) {
    return res.status(400).send("Invalid email or password."); // not specific for security 
  };

  const existingUser = getUserByEmail(email, users);
  // error msg sent if user already exists in database
  if (existingUser) {
    return res.status(400).send("Invalid email or password."); // not specific for security 
  };

  const id = generateRandomString();
  // happy path
  const user = {
    id: id,
    email: email,
    password: hashedPassword,
  };
  users[id] = user;
  req.session.user_id = id;
  res.redirect("/urls");
});





/* ---------- GET REQUESTS ---------- */

app.get("/urls", (req, res) => {
  const loggedIn = req.session.user_id;

  // error msg sent if user isnt logged in 
  if (!loggedIn) {
    return res.status(400).send("To view URLs, please <a href= '/login'>login.</a");
  };

  // happy path if user is logged in 
  const templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  const loggedIn = req.session.user_id;

  // redirect to login page if user isnt logged in 
  if (!loggedIn) {
    res.redirect("/login");
  };

  // happy path 
  const templateVars = { user: users[req.session.user_id]};
  res.render("urls_new", templateVars);
});


app.get("/urls/:id", (req, res) => {
  const loggedIn = req.session.user_id;

  // error msg sent if user isnt logged in
  if (!loggedIn) {
    return res.status(400).send("To view URLs, please <a href= '/login'>login.</a");
  };
  
  const urlObj = urlDatabase[req.params.id];

  // error msg sent if url does not exist 
  if (!urlObj) {
    return res.status(400).send("The url doesnt exist.");
  }

  // error msg sent if url does not belong to logged in user
  if (urlObj.user_id !== loggedIn) {
    return res.status(400).send("This URL does not belong to your account.");
  };

  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: users[req.session.user_id]};
  res.render("urls_show", templateVars);
});


app.get("/u/:id", (req, res) => {
  // error msg sent if url doenst exist 
  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("URL does not exist.");
  };

  // happy path 
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const loggedIn = req.session.user_id;

  // redirect to urls page if user is logged in 
  if (loggedIn) {
    res.redirect("/urls");
  };

  const templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const loggedIn = req.session.user_id;

  // redirect to urls page if user is logged in 
  if (loggedIn) {
    res.redirect("/urls");
  };

  const templateVars = {user: users[req.session.user_id]};
  res.render("urls_login", templateVars);
});

app.get("/", (req, res) => {
  const userID = req.session.user_id;

  // conditions to redirect if user is/isn't logged in
  if(!userID) {
     res.redirect("/login");
  }
  if(userID) {
    res.redirect("/urls");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
