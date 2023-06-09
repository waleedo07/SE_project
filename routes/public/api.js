const { isEmpty } = require("lodash");
const { v4 } = require("uuid");
const db = require("../../connectors/db");
const roles = require("../../constants/roles");
const bcrypt = require("bcrypt");

module.exports = function (app) {
  app.post("/register", async function (req, res) {
    // Check if user already exists in the system
    const userExists = await db
      .select("*")
      .from("se_project.users")
      .where("email", req.body.email);

    if (!isEmpty(userExists)) {
      return res.status(400).send("User already exists");
    }

    const newUser = {
      firstname: req.body.firstName,
      lastname: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      roleid: roles.user,
    };

    try {
      const user = await db("se_project.users")
        .insert(newUser)
        .returning("*");

      return res.status(200).json(user);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send("Could not register user");
    }
  });

  // Register HTTP endpoint to create a new user
  app.post("/login", async function (req, res) {
    // get users credentials from the JSON body
    const { email, password } = req.body;
    if (!email) {
      // If the email is not present, return an HTTP unauthorized code
      return res.status(400).send("email is required");
    }
    if (!password) {
      // If the password is not present, return an HTTP unauthorized code
      return res.status(400).send("Password is required");
    }

    // validate the provided password against the password in the database
    // if invalid, send an unauthorized code
    const user = await db
      .select("*")
      .from("se_project.users")
      .where("email", email)
      .first();
    if (isEmpty(user)) {
      return res.status(400).send("user does not exist");
    }

    if (user.password !== password) {
      return res.status(401).send("Password does not match");
    }

    // set the expiry time as 15 minutes after the current time
    const token = v4();
    const currentDateTime = new Date();
    const expiresat = new Date(+currentDateTime + 900000); // expire in 15 minutes

    // create a session containing information about the user and expiry time
    const session = {
      userid: user.id,
      token,
      expiresat,
    };
    try {
      await db("se_project.sessions").insert(session);
      // In the response, set a cookie on the client with the name "session_cookie"
      // and the value as the UUID we generated. We also set the expiration time.
      res.cookie("session_token", token, { expires: expiresat });
      res.redirect("/dashboard");
      
    } catch (e) {
      console.log(e.message);
      return res.status(400).send("Could not register user");
    }
  });

  app.put("/resetPassword", async function (req, res) {
    const { email, newPassword } = req.body;

    // Check if the email is provided
    if (!email) {
      return res.status(400).send("Email is required");
    }

    // Check if the new password is provided
    if (!newPassword) {
      return res.status(400).send("New password is required");
    }

    try {
      // Find the user by email
      const user = await db
        .select("*")
        .from("se_project.users")
        .where("email", email)
        .first();

      // If user not found, return an error
      if (isEmpty(user) ) {
        return res.status(404).send("User not found");
      }

      

      // Update the user's password in the database
      await db("se_project.users")
        .where("id", user.id)
        .update({ password: newPassword });

      return res.status(200).send("Password reset successful");
    } catch (e) {
      console.log(e.message);
      return res.status(400).send("Could not reset password");
    }
  });

};
