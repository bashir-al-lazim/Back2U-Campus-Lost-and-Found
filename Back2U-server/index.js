const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// initialization
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// MongoDB connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.SECRET_KEY}@back2u.slzfoxx.mongodb.net/?appName=Back2U`;

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
    const usersCollection = db.collection('users');
    const itemsCollection = db.collection('item');
    const lostReportsCollection = db.collection('lostreports');

    await client.db('admin').command({ ping: 1 });
    console.log('✅ MongoDB connected successfully');

    // -----------------------
    // ROUTES
    // -----------------------

    app.get('/', (req, res) => {
      res.send('Back2U server is running');
    });

    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // 📊 Combined Analytics Route (item + lostreports)
    app.get('/analytics', async (req, res) => {
      console.log('📈 /analytics route hit');
      try {
        // Fetch data from both collections
        const [items, lostReports] = await Promise.all([
          itemsCollection.find().toArray(),
          lostReportsCollection.find().toArray(),
        ]);

        const combined = [...items, ...lostReports];

        // Active items = Open or Claimed or Active
        const activeCount = combined.filter((d) =>
          ['Open', 'Claimed', 'Active'].includes(d.status)
        ).length;

        // Claim/match rate = Claimed or Resolved divided by total
        const totalCount = combined.length;
        const claimedResolvedCount = combined.filter((d) =>
          ['Claimed', 'Resolved'].includes(d.status)
        ).length;
        const claimMatchRate =
          totalCount > 0 ? (claimedResolvedCount / totalCount) * 100 : 0;

        // Median time-to-resolution
        const resolvedItems = combined.filter(
          (d) => d.status === 'Resolved' && d.resolvedAt
        );
        let medianResolutionDays = 0;
        if (resolvedItems.length > 0) {
          const daysArray = resolvedItems.map((item) => {
            const created = new Date(item.createdAt);
            const resolved = new Date(item.resolvedAt);
            return (resolved - created) / (1000 * 60 * 60 * 24);
          });
          daysArray.sort((a, b) => a - b);
          const mid = Math.floor(daysArray.length / 2);
          medianResolutionDays =
            daysArray.length % 2 === 0
              ? (daysArray[mid - 1] + daysArray[mid]) / 2
              : daysArray[mid];
        }

        res.json({
          activeItems: activeCount,
          claimMatchRate: claimMatchRate.toFixed(2),
          medianTimeToResolution: medianResolutionDays.toFixed(1),
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
      }
    });

    // 📆 Combined Monthly Analytics Route (item + lostreports)
    app.get('/analytics/monthly', async (req, res) => {
      try {
        const monthsBack = parseInt(req.query.months || '6', 10);

        const months = [];
        const now = new Date();
        for (let i = monthsBack - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push(d.toISOString().slice(0, 7)); // "YYYY-MM"
        }

        // Combine both collections' data
        const [items, lostReports] = await Promise.all([
          itemsCollection.find().toArray(),
          lostReportsCollection.find().toArray(),
        ]);

        const combined = [...items, ...lostReports];

        // Helper: Count items by month and status
        const countByMonth = (statusList, dateField) => {
          const map = {};
          combined.forEach((doc) => {
            const date = doc[dateField];
            if (!date || !statusList.includes(doc.status)) return;
            const month = new Date(date).toISOString().slice(0, 7);
            map[month] = (map[month] || 0) + 1;
          });
          return map;
        };

        const openMap = countByMonth(['Open', 'Active'], 'createdAt');
        const claimedMap = countByMonth(['Claimed'], 'createdAt');
        const resolvedMap = countByMonth(['Resolved'], 'resolvedAt');
        const unresolvedMap = countByMonth(
          ['Open', 'Active', 'Claimed'],
          'createdAt'
        );

        const series = {
          Open: months.map((m) => openMap[m] || 0),
          Claimed: months.map((m) => claimedMap[m] || 0),
          Resolved: months.map((m) => resolvedMap[m] || 0),
          Unresolved: months.map((m) => unresolvedMap[m] || 0),
        };

        res.json({ months, series });
      } catch (err) {
        console.error('Failed to compute monthly analytics', err);
        res.status(500).json({ error: 'Failed to compute monthly analytics' });
      }
    });

    // -----------------------
    // START SERVER
    // -----------------------
    app.listen(port, () => {
      console.log(`Back2U server is running on port ${port}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error);
  }
}

run().catch(console.dir);
