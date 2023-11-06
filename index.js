const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pdaizgq.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db("techGadgets").collection("services");
    const bookServiceCollection = client
      .db("techGadgets")
      .collection("bookServices");

    app.get("/services", async (req, res) => {
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

    app.post("/bookServices", async (req, res) => {
      const bookService = req.body;
      console.log(bookService);
      const result = await bookServiceCollection.insertOne(bookService);
      res.send(result);
    });

    //get bookservice data with user email
    app.get("/bookServices", async (req, res) => {
      console.log(req.query.email);
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await bookServiceCollection.find(query).toArray();
      res.send(result);
    });

    

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
