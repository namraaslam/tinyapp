const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const generateRandomString = () => {
  return Math.random().tostring(36).substring(2,5);
}

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true }));

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
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls")
});

app.post("/login", (req, res) => {
  console.log("Login with username", req.body)
  const cookie1 = req.body.username
  res.cookie("username", cookie1)
  res.redirect("/urls")
});


app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
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