const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// .env needs:
// DB_USER=admin
// SECRET_KEY=yourRealPassword
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.SECRET_KEY}@back2u.slzfoxx.mongodb.net/back2uDB?retryWrites=true&w=majority&appName=Back2U`;

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

    const db = client.db('back2uDB');
    const itemsCollection = db.collection('items');

    // GET all items
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

    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to Mongo!');
  } catch (err) {
    console.error('Mongo connection error:', err);
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Back2U server is running');
});

app.listen(port, () => {
  console.log(`Back2U server is running on port ${port}`);
});
