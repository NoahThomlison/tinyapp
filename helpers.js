/**
 * fucntion which returns the user by their email
 * Input:
 *   - email and the userDatabase
 * Returns:
 *   - user ID or false
 */
 const getUserByEmail = function(email, userDatabase) {
  // lookup magic...
    for (const user in userDatabase) {
        if(userDatabase[user].email === email){
          return(userDatabase[user].id)
        }
    }
    return(undefined)
}

module.exports = getUserByEmail