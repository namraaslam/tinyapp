// helper function to look up user by email
const getUserByEmail = (email, database) => {
  for (const user_id in database) {
  if(database[user_id].email === email) {
    return database[user_id];
  }
 }
};

module.exports = getUserByEmail;
