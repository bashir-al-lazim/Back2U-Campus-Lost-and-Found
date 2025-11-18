const express = require('express');
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

//initialization
const app = express()
const port = process.env.PORT || 5000

//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.SECRET_KEY}@back2u.slzfoxx.mongodb.net/?appName=Back2U`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const authorityCollection = client.db('back2uDB').collection('authorities')
    const itemsCollection = client.db('back2uDB').collection('items');


    app.get('/authority/:email', async (req, res) => {
      const email = req.params.email;

      try {
        const user = await authorityCollection.findOne({ email });

        if (!user || !['admin', 'staff'].includes(user.role)) {
          return res.status(404).json({ message: 'Not an authority user' });
        }

        res.json({
          email: user.email,
          role: user.role,
        });
      } catch (err) {
        console.error('Error fetching authority by email:', err);
        res.status(500).json({ message: 'Server error' });
      }
    });

    //(curd opetaions) items collection api by Loba-Authorithy Inatake & Catalog page
    app.get('/items', async (req, res) => {
      const items = await itemsCollection.find().sort({ _id: -1 }).toArray();
      res.send(items);
    });

    // CREATE item
    app.post('/items', async (req, res) => {
      const item = req.body;

      if (
        !item.title ||
        !item.category ||
        !item.description ||
        !item.locationText
      ) {
        return res.status(400).send('Missing required fields');
      }

      // Build the item with defaults
      const newItem = {
        title: item.title,
        description: item.description,
        category: item.category,
        photo: item.photoUrl || item.photo || '',
        photoUrl: item.photoUrl || item.photo || '',
        location: item.location || item.locationText || '',
        locationText: item.locationText,
        internalTag: item.internalTag || '',
        dateFound: item.dateFound || new Date(),
        status: item.status || 'Open',
        postedBy: item.postedBy || null,
        claimedBy: item.claimedBy || null,
        resolvedAt: item.resolvedAt || null,
        acceptedClaim: item.acceptedClaim || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      };

      const result = await itemsCollection.insertOne(newItem);
      const created = await itemsCollection.findOne({ _id: result.insertedId });
      res.status(201).send(created);
    });

    // UPDATE item
    app.put('/items/:id', async (req, res) => {
      const { id } = req.params;
      const update = req.body;

      try {
        const filter = { _id: new ObjectId(id) };

        // Build update object with proper fields
        const updateDoc = {
          $set: {
            ...update,
            photo: update.photoUrl || update.photo || update.photoUrl,
            photoUrl: update.photoUrl || update.photo || update.photoUrl,
            location: update.location || update.locationText || update.location,
            updatedAt: new Date()
          }
        };

        const result = await itemsCollection.findOneAndUpdate(
          filter,
          updateDoc,
          { returnDocument: 'after' }
        );

        if (!result) {
          return res.status(404).send('Item not found');
        }

        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(400).send('Invalid item id');
      }
    });

    // DELETE item
    app.delete('/items/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const filter = { _id: new ObjectId(id) };
        const result = await itemsCollection.deleteOne(filter);
        if (result.deletedCount === 0) {
          return res.status(404).send('Item not found');
        }
        res.send({ ok: true });
      } catch (err) {
        console.error(err);
        res.status(400).send('Invalid item id');
      }
    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

  } finally {

  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Back2U server is running')
})

app.listen(port, () => {
  console.log(`Back2U server is running on port ${port}`)
})
