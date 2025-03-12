const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");


const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(bodyParser.json());

// MongoDB Connection URI (replace with your actual URI)
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function main() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB!");

    const db = client.db("shoppingDB");
    const productsCollection = db.collection("products");
    const cartCollection = db.collection("cart");

    // API Routes

    // Add a product
    app.post("/products", async (req, res) => {
      try {
        const product = req.body;
        const result = await productsCollection.insertOne(product);
        res.status(201).send({ message: "Product added", productId: result.insertedId });
      } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // Get all products
    app.get("/products", async (req, res) => {
      try {
        const products = await productsCollection.find({}).toArray();
        res.send(products);
      } catch (error) {
        console.error("Error getting products:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // Add product to cart
    const { ObjectId } = require('mongodb');

    // Inside the POST /cart route:
    app.post("/cart", async (req, res) => {
      const { productId, quantity } = req.body;
      let objectId;
      try {
        // Check if the productId is a valid MongoDB ObjectId
        if (!ObjectId.isValid(productId)) {
          return res.status(400).send({ message: "Invalid product ID format" });
        }
        objectId = new ObjectId(productId);
      } catch (error) {
        return res.status(400).send({ message: "Invalid product ID format" });
      }
    
      if (typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).send({ message: "Invalid quantity. Quantity must be a number greater than 0." });
      }
    
      try {
        const product = await productsCollection.findOne({ _id: objectId });
        if (!product) {
          return res.status(404).send({ message: "Product not found with the provided ID." });
        }
    
        const result = await cartCollection.updateOne(
          { productId: objectId },
          { $inc: { quantity: quantity }, $setOnInsert: { createdAt: new Date(), productId: objectId } },
          { upsert: true }
        );
    
        if (result.upsertedCount > 0) {
          res.send({ message: "Product added to cart", productId: objectId });
        } else {
          res.send({ message: "Product quantity updated in cart", modifiedCount: result.modifiedCount });
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).send({ message: "Failed to add product to cart. Please try again later." });
      }
    });



    // View cart
    app.get("/cart", async (req, res) => {
      try {
        const cartItems = await cartCollection.find({}).toArray();
        const populatedCart = await Promise.all(
          cartItems.map(async (item) => {
            const product = await productsCollection.findOne({ _id: item.productId });
            return { ...item, product };
          })
        );
        res.send(populatedCart);
      } catch (error) {
        console.error("Error viewing cart:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // Remove item from cart

    app.delete("/cart/:productId", async (req, res) => {
      const { productId } = req.params;
      // Check if productId is a valid ObjectId
      if (!ObjectId.isValid(productId)) {
        return res.status(400).send({ message: "Invalid product ID format" });
      }
      const objectId = new ObjectId(productId);
      try {
        const result = await cartCollection.deleteOne({ productId: objectId });
        // If no documents were deleted, it means the product was not found in the cart
        if (result.deletedCount === 0) {
          return res.status(404).send({ message: "Product not found in cart" });
        }
        res.send({ message: "Product removed from cart", deletedCount: result.deletedCount });
      } catch (error) {
        console.error("Error removing from cart:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });


    // Add this route to calculate cart total
app.get("/cart/total", async (req, res) => {
    try {
      const cartItems = await cartCollection.find({}).toArray();
      let total = 0;
  
      for (const item of cartItems) {
        const product = await productsCollection.findOne({ _id: item.productId });
        if (product) {
          total += product.price * item.quantity;
        }
      }
  
      res.send({ total });
    } catch (error) {
      console.error("Error calculating cart total:", error);
      res.status(500).send({ message: "Failed to calculate cart total. Please try again later." });
    }
  });
  

    // Start the server
    app.listen(port, () => {
      console.log(`Shopping API running on http://localhost:${port}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Closing MongoDB connection...');
      await client.close();
      console.log('MongoDB connection closed.');
      process.exit();
    });

  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();