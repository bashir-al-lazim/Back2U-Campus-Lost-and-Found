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
