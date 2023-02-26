const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080


const generateRandomString = () => {
  return Math.random().toString(36).substring(2,5);
}
 
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

// helper function to look up user by email
const getUserByEmail = (email) => {
  for (const item in users) {
  if(users[item]["email"] === email) {
    return email;
  }
 }
 return null;
};

// MIDDLE WARE
app.set("view engine", "ejs");
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));

//POST REQUESTS

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  res.redirect("/urls/:id"); 
});

app.post("/urls/:id/delete", (req, res) => {
  console.log("URL has been deleted")
  delete urlDatabase[req.params.id]
  res.redirect("/urls")
});

app.post("/urls/:id", (req, res) => {
  console.log("URL has been updated")
  urlDatabase[req.params.id].longURL = req.body.newURL;
  res.redirect("/urls")
});

app.post("/login", (req, res) => {
  // const email = req.body.email;
  // const password = req.body.password;
  // const user = getUserEmail(email);



  // console.log("Login with username", req.body)
  // const username = req.body.username;
  // res.cookie("username", username);
  res.redirect("/urls")
});

app.post("/logout", (req, res) => {
  const usersShort = users[req.cookies.user_id];
  res.cookie("user_id", usersShort);
  res.clearCookie("user_id", usersShort);
  res.redirect("/urls")
});

app.post("/register", (req, res) => {
  // const username = req.body.username;
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if(getUserByEmail(email) || email === "" || password === "") {
    return res.sendStatus(400);
  } else {
    const user = {
     id: id,
     email: email,
     password: password,
  };
  users[id] = user;
  
  res.cookie("user_id", id);

  console.log(users);
  
  res.redirect("/urls")
}
});

// GET REQUESTS 

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
    
    // username: req.cookies["username"] 
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id]};
    // username: req.cookies["username"]
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: users[req.cookies.user_id]};
  // username: req.cookies["username"]
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_register", templateVars);
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