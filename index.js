const express = require("express");
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.znptc55.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();

    // Create Collections
    const availableFoodCollection = client
      .db("zeroHungerDB")
      .collection("availableFoods");
    const requestedFoodCollection = client
      .db("zeroHungerDB")
      .collection("requestedFoods");

    // Send All Food Data Data To DB
    app.post("/available-foods", async (req, res) => {
      const addedFoodInfo = req.body;
      console.log("body data", addedFoodInfo);
      const result = await availableFoodCollection.insertOne(addedFoodInfo);
      res.send(result);
    });

    // Send Food Request Data Data To DB
    app.post("/requested-foods", async (req, res) => {
      const requestedFoodInfo = req.body;

      const result = await requestedFoodCollection.insertOne(requestedFoodInfo);
      res.send(result);
    });

    // Get All data from available

    // app.get("/available-foods", async (req, res) => {
    //   result = await availableFoodCollection.find().toArray();
    //   console.log(req.query);
    //   res.send(result);
    // });

    // Get Only Selected ID Food
    app.get("/available-foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await availableFoodCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    });

    // Get data matching user Email and Donator Email
    app.get("/available-foods", async (req, res) => {
      console.log(req.query.donatorEmail);
      let query = {};
      if (req.query?.donatorEmail) {
        query = { donatorEmail: req.query.donatorEmail };
      }
      const result = await availableFoodCollection.find(query).toArray();
      res.send(result);
    });

    // Get Data matching email from request food Receiver Email: User Email
    app.get("/requested-foods", async (req, res) => {
      let query = {};
      if (req.query?.receiverEmail) {
        query = { receiverEmail: req.query.receiverEmail };
      }
      const result = await requestedFoodCollection.find(query).toArray();
      res.send(result);
    });

    // Get Data foodCollection ->requestID === _id & userEmail = donator email

    // Get All Food Sorted Data For Featured
    app.get("/available-foods-feature", async (req, res) => {
      result = await availableFoodCollection
        .find()
        .sort({ foodQuantityNumber: -1 })
        .toArray();
      console.log(req.query);
      res.send(result);
    });

    // Delete A specific food
        app.delete("/available-foods-delete/:id", async (req, res) => {
          const id = req.params.id; //get from front
          const query = { _id: new ObjectId(id) };
          const result = await availableFoodCollection.deleteOne(query);
          console.log(result);
          res.send(result);
        });
    // Delete A requested food
        app.delete("/requested-food-delete/:id", async (req, res) => {
          const id = req.params.id; //get from front
          const query = { _id: new ObjectId(id) };
          const result = await requestedFoodCollection.deleteOne(query);
          console.log(result);
          res.send(result);
        });
    

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
  res.send("Zero Hunger server is running");
});

app.listen(port, () => {
  console.log(`Zero Hunger Server is running on port: ${port}`);
});
