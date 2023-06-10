const db = require('../../connectors/db');
const roles = require('../../constants/roles');
const { getSessionToken } = require('../../utils/session');

const getUser = async function(req) {
  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    return res.status(301).redirect('/');
  }

  const user = await db.select('*')
    .from('se_project.sessions')
    .where('token', sessionToken)
    .innerJoin('se_project.users', 'se_project.sessions.userid', 'se_project.users.id')
    .first();
  
  console.log('user =>', user)
  user.isStudent = user.roleid === roles.student;
  user.isAdmin = user.roleid === roles.admin;
  user.isSenior = user.roleid === roles.senior;

  return user;  
}

module.exports = function(app) {
  // Register HTTP endpoint to render /users page
  app.get('/dashboard', async function(req, res) {
    const user = await getUser(req);
    
    if (user.roleid === 2) {
      res.render('adminDashboard');
    } else {
      res.render('userDashboard');
    }
  });

  // Register HTTP endpoint to render /users page
  app.get('/users', async function(req, res) {
    const users = await db.select('*').from('se_project.users');
    return res.render('users', { users });
  });


  app.get('/subscriptions', async function(req, res) {
    try {
      const user = await getUser(req);
  
      const subscriptions = await db
        .select('*')
        .from('se_project.subscription')
        .where('userid', user.id);
  
      return res.status(200).json(subscriptions);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send('Could not get subscriptions');
    }
  });
  
  

  app.get('/subscriptions/purchase', async function(req, res) {
    return res.render('subscriptionPurchase');
  });
  
  
  

  app.get('/tickets/purchase', async function(req, res) {
    const user = await getUser(req);
    
    return res.render('ticketsPurchase');
  });

  app.get('/prices', async function(req, res) {
    const user = await getUser(req);
    
    return res.render('prices');
  });
  app.get('/rides', async function(req, res) {
    try {
      const user = await getUser(req);
  
      const rides = await db
        .select('*')
        .from('se_project.rides')
        .where('userid', user.id);
  
      res.status(200).json(rides);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send('Could not get rides');
    }
  });

  app.get('/requests/refund', async function(req, res) {
    try {
      const user = await getUser(req);
  
      const refundRequests = await db
        .select('*')
        .from('se_project.refund_requests')
        .where('userid', user.id);
  
      return res.render('refundRequests', { requests: refundRequests });
    } catch (e) {
      console.log(e.message);
      return res.status(400).send('Could not get refund requests');
    }
  });

  app.get('/requests/senior', async function(req, res) {
    try {
     
      return res.render('seniorRequests');
    } catch (e) {
      console.log(e.message);
      return res.status(400).send('Could not get senior requests');
    }
  });
  
  app.get('/rides/simulate', async function(req, res) {
    try {
     
      return res.render('rideSimulate');
    } catch (e) {
      console.log(e.message);
      return res.status(400).send('Could not get senior requests');
    }
  });
  
  
  


  //admin frontend

  app.get("/manage/stations", async function(req, res) {
    try {
      const user = await getUser(req);
      const stations = await db.select('*').from('se_project.stations');
      return res.json({  stations });
    } catch (error) {
      return res.status(400).json({ message: "Error", error });
    }
  });
  

  app.get("/manage/stations/create",async function(req,res) {
    try {
      const user = await getUser(req);
      return res.render('stationsCreate');
    } catch (error) {
      res.json({message:"Error",error})
    }
  });

  app.get("/manage/stations/edit/:stationId", async function(req, res) {
    try {
      const { stationId } = req.params;
      const user = await getUser(req);
      return res.render('updateStation', { stationId }); // Pass the stationId value to the view
    } catch (error) {
      res.json({ message: "Error", error });
    }
  });


  app.get("/manage/routes", async function(req, res) {
    try {
      const user = await getUser(req);
      const routes = await db.select('*').from('se_project.routes');
      return res.render("routes", { routes });
    } catch (error) {
      return res.status(400).json({ message: "Error", error });
    }
  });
  app.get("/manage/routes/create",async function(req,res) {
    try {
      const user = await getUser(req);
      console.log("rendering")
      return res.render('routeCreate');
    } catch (error) {
      res.json({message:"Error",error})
    }
  });
};
