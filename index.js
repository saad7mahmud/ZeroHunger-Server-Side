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

      const query = {
        requestedId: requestedFoodInfo.requestedId,
        // Add more criteria as needed
      };
      console.log(query);
      async function isExist(requestedFoodCollection, query) {
        try {
          const document = await requestedFoodCollection.findOne(query);
          return document !== null;
        } catch (error) {
          console.error("Error checking document existence:", error);
          return false;
        }
      }

      const exists = await isExist(requestedFoodCollection, query);

      if (exists) {
        res.status(400).send({ error: "Requested food already exists." });
      } else {
        // Insert the requested food if it doesn't exist
        const result = await requestedFoodCollection.insertOne(
          requestedFoodInfo
        );
        res.status(201).send(result);
      }
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
    app.get("/manage-my-food/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { requestedId: id };
      const result = await requestedFoodCollection.find(query).toArray();
      res.send(result);
    });

    // query mail and foodID
    app.get("/requested-foods-select", async (req, res) => {
      const query = {
        $and: [
          { donatorEmail: req.query?.donatorEmail },
          { requestedId: req.query?.requestedId },
        ],
      };
      const result = await requestedFoodCollection.find(query).toArray();
      res.send(result);
    });

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

    // Update some information
    app.get("/available-foods-update/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await availableFoodCollection.findOne(query);
      console.log(result);
      res.send(result);
    });

    // PUT To update
    app.put("/available-foods-update/:id", async (req, res) => {
      const id = req.params.id;
      const updateFoodInfo = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const finalUpdateInfo = {
        $set: {
          foodName: updateFoodInfo.foodName,
          foodImage: updateFoodInfo.foodImage,
          foodQuantityNumber: updateFoodInfo.foodQuantityNumber,
          foodExpiryDate: updateFoodInfo.foodExpiryDate,
          expiryDateMs: updateFoodInfo.expiryDateMs,
          foodPickUpLocation: updateFoodInfo.foodPickUpLocation,
          foodStatus: updateFoodInfo.foodStatus,
          additionalDonatorNotes: updateFoodInfo.additionalDonatorNotes,
          donatorName: updateFoodInfo.donatorName,
          donatorEmail: updateFoodInfo.donatorEmail,
          donatorImage: updateFoodInfo.donatorImage,
        },
      };
      const result = await availableFoodCollection.updateOne(
        query,
        finalUpdateInfo,
        options
      );
      res.send(result);
    });

    // PUT for status change
    app.put("/deliver-status-update/:id", async (req, res) => {
      const id = req.params.id;
      console.log("id is", id);
      const updateFoodInfo = req.body;
      console.log(updateFoodInfo);
      const query = { requestedId: id };
      console.log(query);
      const options = { upsert: true };
      const finalUpdateInfo = {
        $set: {
          requestStatus: updateFoodInfo.requestStatus,
        },
      };
      const result = await requestedFoodCollection.updateOne(
        query,
        finalUpdateInfo,
        options
      );
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
