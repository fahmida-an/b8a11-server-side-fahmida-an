const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 4000;

//middlewares
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pdaizgq.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


//middleware made
const logger = async(req, res, next) => {
  console.log('called:', req.host, req.originalUrl);
  next();
}

const verifyToken = async(req, res, next) => {
  const token = req.cookies?.token;
  console.log('value of token in middleware: ', token);
  if(!token){
    return res.status(401).send({message: 'not authorized'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,decoded) =>{
    //error
    if(err){
      console.log(err);
      return res.status(401).send({message: 'unauthorized'})
    }
    // valid decoded
    console.log('value in the token', decoded);
    req.user = decoded;
    next()
  })
 
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db("techGadgets").collection("services");
    const bookServiceCollection = client.db("techGadgets").collection("bookServices");

    //auth api

    app.post('/jwt', logger, async(req,res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})

      res
      .cookie('token', token, {
        httpOnly: true,
        secure: false
      })
      .send({success: true})
    })

    //service api
    app.get("/services", logger, async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.post("/services", async (req, res) => {
      const newServices = req.body;
      console.log(newServices);
      const result = await serviceCollection.insertOne(newServices);
      res.send(result);
    });

    app.put("/services/:id", async(req,res)=> {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const options = {upsert: true}
      const updatedBookServices = req.body;
      const service = {
        $set: {
          serviceImage:updatedBookServices.serviceImage,
          serviceName:updatedBookServices.serviceName,
          price:updatedBookServices.price,
          providerName:updatedBookServices.providerName,
          providerImage:updatedBookServices.providerImage,
          providerEmail:updatedBookServices.providerEmail,
          providerLocation:updatedBookServices.providerLocation,
          providerDescription:updatedBookServices.providerDescription,
          details:updatedBookServices.details
        }
      }
      const result = await serviceCollection.updateOne(filter,service,options);
      res.send(result)
    })


    app.delete("/service/:id", async(req,res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await serviceCollection.deleteOne(query)
      res.send(result)
    })

    app.post("/bookServices", async (req, res) => {
      const bookService = req.body;
      console.log(bookService);
      const result = await bookServiceCollection.insertOne(bookService);
      res.send(result);
    });

    //get bookservice data with user email
    app.get("/bookServices", logger, verifyToken, async (req, res) => {
      console.log(req.query.email);
      // console.log('token', req.cookies.token);
      console.log('user in valid token',req.user);
      if(req.query.email !== req.user.email){
        return res.status(403).send({message: 'forbidden'})
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await bookServiceCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/allBookServices", async(req,res) => {
      const cursor = bookServiceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
      
    })

    app.patch('/bookServices/:id', async(req,res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedBookServices = req.body;
      console.log(updatedBookServices);
      const updatedDoc = {
        $set: {
          status: updatedBookServices.status
        }
      }

      const result = await bookServiceCollection.updateOne(filter, updatedDoc)
      res.send(result)

    })

    app.delete('/bookServices/:id', async(req,res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await bookServiceCollection.deleteOne(query);
      res.send(result)
    })


    

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("tech gadget server is running");
});

app.listen(port, () => {
  console.log(`tech gadhet server is running on port: ${port}`);
});
