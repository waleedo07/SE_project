
const { v4 } = require("uuid");
const db = require("../../connectors/db");
const roles = require("../../constants/roles");
const {getSessionToken}=require('../../utils/session')
const getUser = async function (req) {
  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    return res.status(301).redirect("/");
  }
  console.log("hi",sessionToken);
  const Tuser = await db
    .select("*")
    .from("se_project.sessions")
    .where("token", sessionToken)
    .innerJoin(
      "se_project.users",
      "se_project.sessions.userid",
      "se_project.users.id"
    )
    
   
   console.log("Tuser =>",Tuser );
   const user=Tuser[0];

  console.log("user =>", user.roleid);
  user.isNormal = user.roleid === roles.user;
  user.isAdmin = user.roleid === roles.admin;
  user.isSenior = user.roleid === roles.senior;
  console.log("user =>", user)
  return user;
};

module.exports = function (app) {
  
 
  
app.get("/api/v1/zones", async function (req, res) {
  const user = await getUser(req);

  try {
    
    const zones= await db("se_project.zones")
      .select("*");

    if (!zones) {
      return res.status(404).send("zones not found");
    }

    return res.status(200).json(zones);
  } catch (e) {
    console.log(e.message);
    return res.status(400).send("Failed");
  }
});




  app.post("/api/v1/payment/subscription" ,async function (req, res) {
    const user = await getUser(req);
    creditCardNumber= req.body.creditCardNumber;
    holderName= req.body.holderName;
    payedAmount= req.body.payedAmount;
    
    
      const subscription = {
      nooftickets : 0,
      subtype: req.body.subType,
      
      userid : user.userid,
      zoneid: req.body.zoneId
    
    };

    try {
      const user = await db("se_project.subsription")
        .insert(subscription)
        .returning("*");

      return res.status(200).json(user);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send("Could not subscribe");
    }
    


  });



  app.get('/tickets', async function(req, res) {
    const user = await getUser(req);
    try {
      const tickets = await db
        .select('*')
        .from('se_project.tickets')
        .where('userid', user.id)
        .innerJoin('se_project.users', 'se_project.tickets.userid', 'se_project.users.id');
  
      return res.status(200).json(tickets);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send('Could not fetch tickets');
    }
  });
  
  app.post("/api/v1/refund/:ticketId", async function (req, res) {
    const user = await getUser(req);
    const ticketId = req.params.ticketId;
  
    try {
      const ticket = await db("se_project.tickets")
        .where("id", ticketId)
        .where("userid", user.id)
        .where("tripdate", ">", new Date())
        .first();
  
      if (!ticket) {
        return res.status(404).send("Ticket not found ");
      }
  
      
      await db("se_project.tickets").where("id", ticketId).del();
  
      
      if (ticket.subid) {
       
        await db("se_project.subscription")
          .where("id", ticket.subid)
          .decrement("nooftickets", 1);
      } else {
        
        
        const transaction = {
          ticketid: ticket.id,
          userid: user.id,
          amount: ticket.payedAmount,
          status: "pending",
          refundDate: new Date(),
        };
  
        await db("se_project.transactions").insert(transaction);
      }
  
      return res.status(200).send("Ticket refunded successfully");
    } catch (e) {
      console.log(e.message);
      return res.status(400).send("Failed to process refund");
    }
  });
  
app.post("/api/v1/payment/ticket" , async function (req, res){
  const user = await getUser(req);
    
  
    const ticket = {
    origin :req.body.origin,
    destination: req.body.destination,
    
    userid : user.userid,
    tripDate: req.body.tripDate
  
  };

  try {
    const user = await db("se_project.tickets")
      .insert(ticket)
      .returning("*");

    return res.status(200).json(user);
  } catch (e) {
    console.log(e.message);
    return res.status(400).send("Could not buy ticket");
  }

});

app.post("/api/v1/tickets/purchase/subscription" , async function (req, res){
  const user = await getUser(req);
    subscription=await db.select("*")
    .from("se_project.tickets")
    .where("id", req.body.subId)
    .increment("nooftickets", 1);
  
  
    const ticket = {
    origin :req.body.origin,
    destination: req.body.destination,
    
    userid : user.userid,
    tripDate: req.body.tripDate
  
  };

  try {
    const user = await db("se_project.tickets")
      .insert(ticket)
      .returning("*");


    return res.status(200).json(user);
  } catch (e) {
    console.log(e.message);
    return res.status(400).send("Could not buy ticket");
  }

});






app.get("/api/v1/tickets/price/:originId&:destinationId", async function (req, res) {
  const originId = req.params.originId;
  const destinationId = req.params.destinationId;

  try {
    
    const prices = await db("se_project.prices")
      .where("originId", originId)
      .where("destinationId", destinationId)
      .first();

    if (!prices) {
      return res.status(404).send("Prices not found");
    }

    return res.status(200).json(prices);
  } catch (e) {
    console.log(e.message);
    return res.status(400).send("Failed");
  }
});





app.post("/api/v1/senior/request", async function (req, res) {
  const { nationalId } = req.body;

  try {


    if (!user) {
      return res.status(404).send("User not found");
    }

    
    const existingRequest = await db("se_project.senior_requests")
      .where("userid", user.id)
      .first();

    if (existingRequest) {
      return res.status(400).send("Senior request already exists");
    }

    
    const newRequest = {
      status: "Pending",
      userid: user.id,
      nationalid: nationalId
    };

    
  } catch (e) {
    console.log(e.message);
    return res.status(400).send("Failed to request senior");
  }
});

app.put('/api/v1/ride/simulate', async function(req, res) {
  const user = await getUser(req);
  rides=await db.select("*")
  .from("se_project.tickets")
  .where("id", req.body.subId)
  .increment("nooftickets", 1);


  const rides = {
  origin :req.body.origin,
  destination: req.body.destination,
  
  userid : user.userid,
  tripDate: req.body.tripDate

};
  
});

app.put("/api/v1/ride/simulate", async function (req, res) {
  const { origin, destination, tripDate } = req.body;
  const user= await getUser(req);
  const ticket = await db.select("*")
  .from("se_project.tickets")
  .where("userid",user.id)
  .and("origin",origin)
  .and("destination",destination)
  .and("tripdate",tripDate)

  try {
    
    const rideId = await db("se_project.rides")
      .insert({
        status: "Scheduled",
        origin: origin,
        destination: destination,
        userid: used.id,
        ticketid: ticket.id, 
        tripdate: tripDate,
      })
      .returning("id");

    res.status(201).json({ rideId: rideId[0] });
  } catch (e) {
    console.log(e.message);
    return res.status(400).send("Failed to add ride");
  }
});


//admin 


// Admin Register
app.post("/register", async function (req, res) {
  // Check if user already exists in the system
  const userExists = await db
    .select("*")
    .from("se_project.users")
    .where("email", req.body.email);

  if (!isEmpty(userExists)) {
    return res.status(400).send("Admin already exists");
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
    return res.status(400).send("Could not register Admin");
  }
});

// Admin SignIn
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
    return res.status(400).send("Admin does not exist");
  }

  if (user.password !== password) {
    return res.status(401).send("Password does not match");
  }

  
  const token = v4();
  const currentDateTime = new Date();
  const expiresat = new Date(+currentDateTime + 900000); 
  const session = {
    userid: user.id,
    token,
    expiresat,
  };
  try {
    await db("se_project.sessions").insert(session);
    
    return res
      .cookie("session_token", token, { expires: expiresat })
      .status(200)
      .send("login successful");
  } catch (e) {
    console.log(e.message);
    return res.status(400).send("Could not register Admin");
  }
});

//reset Password for Admin

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


//Get Stations

app.get("/stations",async function(req,res) {
  try {
    const user = await getUser(req);
    const stations = await db.select('*').from('se_project.stations');
    return res.render('stations_example', { ...user, stations });
  } catch (error) {
    res.json({message:"Error",error})
  }
});

// delete Station

app.delete("/api/v1/station/:id", async function(req,res){
  try {
    let {id} = req.params;
    const deleted = await db("se_project.stations").delete({id})
    res.status(200).json({message:"Deleted",deleted})
  } catch (error) {
    res.json({message:"Error",error})
  }
});


// create Station

app.post("/api/v1/station", async function(req,res){
  try {
    const newStation = {
      stationname : req.body.stationname,
      stationType : req.body.stationtype,
      stationPosition : req.body.stationposition,
      stationStatus : req.body.stationstatus
    }
  const station = await db("se_project.stations")  
  .insert(newStation).returning("*")
    res.status(201).json({message:"Added Successfully",station})
  } catch (error) {
    res.json({message:"Error",error})
  }
});

// Update Station 

app.put("/api/v1/station/:id", async function(req,res){
  try {
    const {id} = req.params;
    const {stationname} = req.body;
    const updated = await db("se_project.stations").update({stationname}).where({id:id})
    res.status(200).json({message:"Updated successfully",updated})
  } catch (error) {
    res.json({message:"Error",error})
  }
});
// Delete Routes

app.delete("/api/v1/route/:routeId",async function(req,res){
  try {
    const {id} = req.params;
    const deletedRoutes = await db("se_project.routes").delete({id})
    res.status(200).json({message:"Deleted",deletedRoutes})
  } catch (error) {
    res.json({message:"Error",error})
  }
});

// Create Route 

app.post("/api/v1/route",async function(req,res){
  try {
    const newRoute = {
      routename : req.body.routename,
      from : req.body.fromStationid,
      To : req.body.toStationid
    }
    const route = await db("se_project.routes").insert(newRoute).returning("*")
    res.status(201).json({message:"Added Successfully",route})
  } catch (error) {
    res.json({message:"Error",error})
  }
});

// Update Route 

app.put("/api/v1/route/:id", async function(req,res){
  try {
    const {id} = req.params;
    const {routename} = req.body
    const updated = await db("se_project.routes").update({routename}).where({id:id})
    res.status(200).json({message:"Updated successfully",updated})
  } catch (error) {
    res.json({message:"Error",error})
  }
});

// Accept or Reject refund

app.put("/api/v1/requests/refunds/:id", async function(req,res){
  try {
    const {id} = req.params;
    const {refundStatus} = req.body;
    const updated = await db("se_project.requests").update({refundStatus}).where({id:id})
    res.status(200).json({message:"Updated",updated})
  } catch (error) {
    res.json({message:"Error",error})
  }
});

// Accept Senior

app.put("/api/v1/requests/senior/:id",async function(req,res){
  try {
    const {id} = req.params;
    const {seniorStatus} = req.body;
    const updated = await db("se_project.requests").update({seniorStatus}).where({id:id})
    res.status(200).json({message:"Updated",updated})
  } catch (error) {
    res.json({message:"Error",error})
  }
});

//Get Zones

app.get("/api/v1/zones", async function(req,res){
  try {
    const user = await getUser(req);
    const zones = await db.select('*').from('se_project.zones');
    return res.render('zones_example', { ...user, zones });
  } catch (error) {
    res.json({message:"Error",error})
  }
});

//Update Zones

app.put("/api/v1/zones/:zoneId",async function(req,res){
  try {
    const {id} = req.params;
    const {price} = req.body;
    const updated = await db("se_project.zones").update({price}).where({id:id})
    res.status(200).json({message:"Updated",updated})
  } catch (error) {
    res.json({message:"Error",error})
  }
})







  
};
