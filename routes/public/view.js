
const db = require('../../connectors/db');

module.exports = function(app) {
  //Register HTTP endpoint to render /index page
  app.get('/', function(req, res) {
    console.log("view 1")
    return res.render('login');
  });
  app.get('/login', function(req, res) {
    console.log("view 1")
    return res.render('login');
  });
// example of passing variables with a page
  app.get('/register', async function(req, res) {
    console.log("view 2")
    const stations = await db.select('*').from('se_project.stations');
    return res.render('register', { stations });
  });

  app.get('/resetPassword', function(req, res) {
    console.log("view 1")
    return res.render('resetPassword');
  });
};
