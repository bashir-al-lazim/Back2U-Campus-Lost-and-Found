const adminRoutes = require("./routes/adminroutes");
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

// initialization
const app = express();
const port = process.env.PORT || 5000;

// ✅ SIZE LIMIT FIRST
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// middleware
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

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
    const db = client.db("back2uDB");
    app.locals.db = db;
    app.use("/admin", adminRoutes);
    const itemsCollection = db.collection("items");
    const lostReportsCollection = db.collection("lostreports");
    const authorityCollection = db.collection("authorities");
    const notificationsCollection = db.collection("notifications"); // ✅ Feature 6
    const claimsCollection = db.collection("claims");
    const commentsCollection = db.collection("comments");
    const studentsCollection = db.collection("students");
    const reportsCollection = db.collection("reports");


  
    // -----------------------
    // Helper functions
    // -----------------------

    // Check if a student is currently banned (by email)
    // and auto-clear expired bans + warnings.
    async function checkBanBeforeAction(email, res) {
      if (!email) return false; // nothing to check

      let student = await studentsCollection.findOne({ email });
      if (!student) return false; // not in students ⇒ not banned

      const now = new Date();

      // --- Auto-clear expired ban + reset warnings ---
      if (student.bannedUntil && new Date(student.bannedUntil) <= now) {
        const updatedResult = await studentsCollection.findOneAndUpdate(
          { email },
          {
            $set: {
              banned: false,
              warningsCount: 0,
              updatedAt: now,
            },
            $unset: { bannedUntil: "" },
          },
          { returnDocument: "after" }
        );

        student =
          updatedResult.value || {
            ...student,
            banned: false,
            warningsCount: 0,
            bannedUntil: null,
          };
      }

      // --- Active ban? (bannedUntil still in the future) ---
      if (student.bannedUntil && new Date(student.bannedUntil) > now) {
        res.status(403).json({
          success: false,
          message: `You are temporarily banned until ${student.bannedUntil}.`,
        });
        return true;
      }

      return false;
    }


    // TTL permanent delete after 30 days
    await itemsCollection.createIndex(
      { deletedAt: 1 },
      {
        expireAfterSeconds: 60 * 60 * 24 * 30,
        partialFilterExpression: { isDeleted: true, deletedAt: { $type: "date" } },
      }
    );

    await lostReportsCollection.createIndex(
      { deletedAt: 1 },
      {
        expireAfterSeconds: 60 * 60 * 24 * 30,
        partialFilterExpression: { isDeleted: true, deletedAt: { $type: "date" } },
      }
    );

    // Notifications index 
    await notificationsCollection.createIndex(
      { userEmail: 1, isRead: 1, createdAt: -1 }
    );

    // -----------------------
    // Notifications
    // -----------------------
    async function createNotification({
      userEmail,
      type,
      title,
      message,
      link,
      entity = null,
    }) {
      if (!userEmail) return;

      const now = new Date();

      await notificationsCollection.insertOne({
        userEmail,
        type,
        title,
        message,
        link,
        entity,
        isRead: false,
        createdAt: now,
        readAt: null,
      });

      // ✅ Keep only latest 50 notifications per user (delete oldest)
      const count = await notificationsCollection.countDocuments({ userEmail });

      if (count > 50) {
        const extra = count - 50;

        const oldest = await notificationsCollection
          .find({ userEmail })
          .sort({ createdAt: 1 }) // oldest first
          .limit(extra)
          .project({ _id: 1 })
          .toArray();

        if (oldest.length > 0) {
          await notificationsCollection.deleteMany({
            _id: { $in: oldest.map((d) => d._id) },
          });
        }
      }
    }
    // ✅ Notify all staff/admin users (for claim-created alerts)
    async function notifyAuthorities(notification) {
      const authorities = await authorityCollection
        .find({ role: { $in: ["admin", "staff"] } })
        .project({ email: 1 })
        .toArray();

      await Promise.all(
        authorities
          .filter((a) => a?.email)
          .map((a) =>
            createNotification({
              ...notification,
              userEmail: a.email,
            })
          )
      );
    }

// ---------------- FEATURE 15 ROUTES ----------------
const feature15Routes = require("./routes/feature15Routes");
app.use("/feature15", feature15Routes);

    // -----------------------
    // AUTHORITY ROUTE
    // -----------------------
    app.get("/authority/:email", async (req, res) => {
      const email = req.params.email;
      try {
        const user = await authorityCollection.findOne({ email });
        if (!user || !["admin", "staff"].includes(user.role)) {
          return res.status(404).json({ message: "Not an authority user" });
        }
        res.json({ email: user.email, role: user.role });
      } catch (err) {
        console.error("Error fetching authority:", err);
        res.status(500).json({ message: "Server error" });
      }
    });

    // ========================
    // AUTH: SYNC USER ON LOGIN
    // ========================
    app.post("/auth/sync-user", async (req, res) => {
      try {
        const { email, name, photoURL } = req.body;

        if (!email) {
          return res.status(400).json({
            success: false,
            message: "email is required",
          });
        }

        // 1) Check if this email is an authority (staff/admin)
        const authority = await authorityCollection.findOne({ email });
        if (authority) {
          // Do NOT create a student record for authorities
          return res.status(200).json({
            success: true,
            isAuthority: true,
            role: authority.role,
          });
        }

        // 2) Ensure there is a student doc (create if new, update if existing)
        const now = new Date();

        await studentsCollection.updateOne(
          { email },
          {
            $set: {
              name: name || email,
              email,
              photoURL: photoURL || "",
              updatedAt: now,
            },
            $setOnInsert: {
              studentId: null,
              banned: false,
              bannedUntil: null,
              warningsCount: 0,
              createdAt: now,
            },
          },
          { upsert: true }
        );

        const student = await studentsCollection.findOne({ email });

        res.status(200).json({
          success: true,
          isAuthority: false,
          role: "student",
          student,
        });
      } catch (err) {
        console.error("Error syncing user:", err);
        res.status(500).json({
          success: false,
          message: "Failed to sync user",
          error: err.message,
        });
      }
    });



    // -----------------------
    // PUBLIC COMMENTS
    // -----------------------

    // Get visible comments for an item
    app.get('/api/items/:id/comments', async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: 'Invalid item ID' });
        }

        const itemId = new ObjectId(id);

        const comments = await commentsCollection
          .find({ itemId, hidden: { $ne: true } })
          .sort({ createdAt: 1 })   // oldest first
          .toArray();

        res.status(200).json({
          success: true,
          data: comments,
        });
      } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch comments',
          error: error.message,
        });
      }
    });

    // Create a new comment on an item
    app.post('/api/items/:id/comments', async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: 'Invalid item ID' });
        }

        const { text, author, mentions } = req.body;

        if (!text || !author || !author.email || !author.name) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields (text, author.name, author.email)',
          });
        }

        //Ban check
        const banned = await checkBanBeforeAction(author.email, res);
        if (banned) return;

        const now = new Date();
        const newComment = {
          itemId: new ObjectId(id),
          text: text.trim(),
          author: {
            name: author.name,
            email: author.email,
            avatar: author.avatar || '',
            role: author.role || 'student',
          },
          mentions: Array.isArray(mentions) ? mentions : [],
          likes: [],
          likesCount: 0,
          hidden: false,
          createdAt: now,
          updatedAt: now,
        };

        const result = await commentsCollection.insertOne(newComment);
        const created = await commentsCollection.findOne({ _id: result.insertedId });

        res.status(201).json({
          success: true,
          data: created,
        });
      } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to create comment',
          error: error.message,
        });
      }
    });

    // Like/unlike a comment (toggle)
    app.post('/api/comments/:id/like', async (req, res) => {
      try {
        const { id } = req.params;
        const { userEmail } = req.body;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: 'Invalid comment ID' });
        }
        if (!userEmail) {
          return res.status(400).json({ success: false, message: 'userEmail is required' });
        }

        const commentId = new ObjectId(id);
        const comment = await commentsCollection.findOne({ _id: commentId });
        if (!comment) {
          return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        const alreadyLiked = (comment.likes || []).includes(userEmail);

        const update = alreadyLiked
          ? {
            $pull: { likes: userEmail },
            $inc: { likesCount: -1 },
            $set: { updatedAt: new Date() },
          }
          : {
            $addToSet: { likes: userEmail },
            $inc: { likesCount: 1 },
            $set: { updatedAt: new Date() },
          };

        // prevent going below zero
        if (alreadyLiked && comment.likesCount <= 0) {
          delete update.$inc;
        }

        const result = await commentsCollection.findOneAndUpdate(
          { _id: commentId },
          update,
          { returnDocument: 'after' }
        );

        res.status(200).json({
          success: true,
          data: result.value,
        });
      } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to toggle like',
          error: error.message,
        });
      }
    });


    // Delete a comment (author can delete own; staff/admin can also delete)
    app.delete('/api/comments/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { userEmail, userRole } = req.body || {};

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: 'Invalid comment ID' });
        }
        if (!userEmail) {
          return res.status(400).json({
            success: false,
            message: 'userEmail is required to delete a comment',
          });
        }

        const commentId = new ObjectId(id);
        const comment = await commentsCollection.findOne({ _id: commentId });
        if (!comment) {
          return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        const isOwner = comment.author?.email === userEmail;
        const isStaffOrAdmin = userRole === 'staff' || userRole === 'admin';

        if (!isOwner && !isStaffOrAdmin) {
          return res.status(403).json({ success: false, message: 'Not allowed to delete this comment' });
        }

        await commentsCollection.deleteOne({ _id: commentId });

        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to delete comment',
          error: error.message,
        });
      }
    });

    // Hide / unhide a comment (used by both public UI + moderation)
    app.patch('/api/comments/:id/hide', async (req, res) => {
      try {
        const { id } = req.params;
        const { hidden = true } = req.body;

        if (!ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, message: 'Invalid comment ID' });
        }

        const commentId = new ObjectId(id);

        // 1) Check if the comment actually exists
        const existing = await commentsCollection.findOne({ _id: commentId });

        if (!existing) {
          // This is the ONLY place we should ever send 404 for this route
          return res
            .status(404)
            .json({ success: false, message: 'Comment not found' });
        }

        const desiredHidden = !!hidden;

        // 2) If it’s already in the desired state, just return it as success.
        //    (Prevents your “Content was already removed” flow from being hit
        //     when the comment is actually still there.)
        if (!!existing.hidden === desiredHidden) {
          return res.status(200).json({
            success: true,
            data: existing,
          });
        }

        // 3) Update hidden flag
        await commentsCollection.updateOne(
          { _id: commentId },
          { $set: { hidden: desiredHidden, updatedAt: new Date() } }
        );

        // 4) Fetch updated comment to return
        const updated = await commentsCollection.findOne({ _id: commentId });

        return res.status(200).json({
          success: true,
          data: updated || { ...existing, hidden: desiredHidden },
        });
      } catch (error) {
        console.error('Error hiding/unhiding comment:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to hide/unhide comment',
          error: error.message,
        });
      }
    });





    // Edit a comment's text (ONLY author)
    app.patch('/api/comments/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { userEmail, text } = req.body || {};

        if (!ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, message: 'Invalid comment ID' });
        }

        if (!userEmail) {
          return res.status(400).json({
            success: false,
            message: 'userEmail is required to edit a comment',
          });
        }

        const trimmed = (text || '').trim();
        if (!trimmed) {
          return res.status(400).json({
            success: false,
            message: 'text is required',
          });
        }

        const commentId = new ObjectId(id);

        // 1) Make sure the comment exists
        const existing = await commentsCollection.findOne({ _id: commentId });
        if (!existing) {
          return res
            .status(404)
            .json({ success: false, message: 'Comment not found' });
        }

        // 2) Only the author can edit
        const isOwner = existing.author?.email === userEmail;
        if (!isOwner) {
          return res.status(403).json({
            success: false,
            message: 'Not allowed to edit this comment',
          });
        }

        // 3) Update text + updatedAt, then return the updated doc
        const now = new Date();
        const result = await commentsCollection.findOneAndUpdate(
          { _id: commentId },
          {
            $set: {
              text: trimmed,
              updatedAt: now,
            },
          },
          { returnDocument: 'after' } // MongoDB Node driver v4 style
        );

        // We already know the comment existed; in normal cases value will be there.
        const updatedDoc = result.value || {
          ...existing,
          text: trimmed,
          updatedAt: now,
        };

        return res.status(200).json({
          success: true,
          data: updatedDoc,
        });
      } catch (error) {
        console.error('Error editing comment:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to edit comment',
          error: error.message,
        });
      }
    });

    // Moderation: fetch a single comment by ID (including hidden ones)
    app.get('/api/moderation/comments/:id', async (req, res) => {
      try {
        const { id } = req.params;

        if (!id) {
          return res
            .status(400)
            .json({ success: false, message: 'Comment ID is required' });
        }

        let filter;
        if (ObjectId.isValid(id)) {
          filter = {
            $or: [
              { _id: new ObjectId(id) },
              { _id: id },
            ],
          };
        } else {
          filter = { _id: id };
        }

        const comment = await commentsCollection.findOne(filter);

        if (!comment) {
          return res
            .status(404)
            .json({ success: false, message: 'Comment not found' });
        }

        res.status(200).json({ success: true, data: comment });
      } catch (error) {
        console.error('Error fetching comment for moderation:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch comment for moderation',
          error: error.message,
        });
      }
    });








    // -----------------------
    // ITEMS CRUD
    // -----------------------

    // hide soft-deleted and hidden items 
    app.get("/items", async (req, res) => {
      try {
        const items = await itemsCollection
          .find({
            isDeleted: { $ne: true },
            hidden: { $ne: true }
          })
          .sort({ _id: -1 })
          .toArray();

        res.send(items);
      } catch (error) {
        res.status(500).send({ message: "Error fetching items", error });
      }
    });


    //create items
    app.post("/items", async (req, res) => {
      const item = req.body;
      if (!item.title || !item.category || !item.description || !item.locationText) {
        return res.status(400).send("Missing required fields");
      }
      const newItem = {
        ...item,
        photo: item.photoUrl || item.photo || "",
        photoUrl: item.photoUrl || item.photo || "",
        location: item.location || item.locationText || "",
        dateFound: item.dateFound || new Date(),
        status: item.status || "Open",
        hidden: false,              // NEW
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0,
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
    app.delete("/items/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const _id = new ObjectId(id);

        const item = await itemsCollection.findOne({ _id });
        if (!item) return res.status(404).send("Item not found");

        await itemsCollection.updateOne(
          { _id },
          {
            $set: {
              isDeleted: true,
              deletedAt: new Date(),
              deletedBy: req.body?.deletedBy || null,
              updatedAt: new Date(),
            },
          }
        );
        // create notification on ITEM delete 
        await createNotification({
          userEmail: req.body?.deletedBy || null,
          type: "ITEM_DELETED",
          title: "Item moved to Recycle Bin",
          message: `“${item.title || "Untitled"}” was deleted. You can restore it from Recycle Bin.`,
          link: "/dashboard/recycle-bin",
          entity: { kind: "item", id },
        });

        res.send({ ok: true, softDeleted: true });
      } catch (err) {
        console.error(err);
        res.status(400).send("Invalid item id");
      }
    });


    // -----------------------
    // LOST REPORTS CRUD
    // -----------------------

    app.get("/lostreports", async (req, res) => {
      try {
        const { userEmail } = req.query;

        const filter = {
          ...(userEmail ? { userEmail } : {}),
          isDeleted: { $ne: true },   // ✅ NEW         
          hidden: { $ne: true }, // 🚫 do not return hidden lost reports in normal views
        };

        const reports = await lostReportsCollection
          .find(filter)
          .sort({ _id: -1 })
          .toArray();

        res.send(reports);
      } catch (err) {
        console.error(err);
        res.status(500).send("Failed to fetch lost reports");
      }
    });


    app.get("/lostreports/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const filter = { _id: new ObjectId(id) };
        const report = await lostReportsCollection.findOne({
          ...filter,
          isDeleted: { $ne: true }
        });

        if (!report) return res.status(404).send("Lost report not found");
        res.send(report);
      } catch (err) {
        console.error(err);
        res.status(400).send("Invalid report id");
      }
    });

    app.post("/lostreports", async (req, res) => {
      const report = req.body;

      // 🚫 Ban check (student by email)
      if (report.userEmail) {
        const banned = await checkBanBeforeAction(report.userEmail, res);
        if (banned) return;
      }

      if (!report.title || !report.category || !report.description || !report.locationLost || !report.userEmail) {
        return res.status(400).send("Missing required fields");
      }

      const newReport = {
        ...report,
        status: report.status || "Active",
        hidden: false,          // 👈 start as visible
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0,
      };

      const result = await lostReportsCollection.insertOne(newReport);
      const created = await lostReportsCollection.findOne({ _id: result.insertedId });
      res.status(201).send(created);
    });


    app.put("/lostreports/:id", async (req, res) => {
      const { id } = req.params;
      const update = req.body;
      try {
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { ...update, updatedAt: new Date() } };
        const result = await lostReportsCollection.findOneAndUpdate(filter, updateDoc, { returnDocument: "after" });
        if (!result.value) return res.status(404).send("Lost report not found");
        res.send(result.value);
      } catch (err) {
        console.error(err);
        res.status(400).send("Invalid report id");
      }
    });



    // SOFT DELETE Lost Report 
    app.delete("/lostreports/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const _id = new ObjectId(id);

        const report = await lostReportsCollection.findOne({ _id });
        if (!report) return res.status(404).send("Lost report not found");

        await lostReportsCollection.updateOne(
          { _id },
          {
            $set: {
              isDeleted: true,
              deletedAt: new Date(),
              deletedBy: req.body?.deletedBy || report.userEmail || null,
              updatedAt: new Date(),
            },
          }
        );

        // create notification on lost report delete  
        await createNotification({
          userEmail: report.userEmail,
          type: "LOSTREPORT_DELETED",
          title: "Lost report moved to Recycle Bin",
          message: `“${report.title || "Untitled"}” was deleted. You can restore it from Recycle Bin.`,
          link: "/dashboard/recycle-bin",
          entity: { kind: "lostreport", id },
        });

        res.send({ ok: true, softDeleted: true });
      } catch (err) {
        console.error(err);
        res.status(400).send("Invalid report id");
      }
    });



    // -----------------------
    // LINKING LOST REPORTS TO ITEMS
    // -----------------------
    // Link a lost report to a found item
    app.post("/link", async (req, res) => {
      const { reportId, itemId } = req.body;

      if (!reportId || !itemId) {
        return res.status(400).send("Both reportId and itemId are required");
      }

      try {
        // Check if report exists and is not already linked
        const report = await lostReportsCollection.findOne({ _id: new ObjectId(reportId) });
        if (!report) return res.status(404).send("Lost report not found");
        if (report.linkedItemId) {
          return res.status(400).send("This report is already linked to an item");
        }

        // Check if item exists and is not already linked
        const item = await itemsCollection.findOne({ _id: new ObjectId(itemId) });
        if (!item) return res.status(404).send("Item not found");
        if (item.linkedReportId) {
          return res.status(400).send("This item is already linked to a report");
        }

        // Link both records
        await lostReportsCollection.updateOne(
          { _id: new ObjectId(reportId) },
          {
            $set: {
              linkedItemId: itemId,
              linkedAt: new Date(),
              updatedAt: new Date()
            }
          }
        );

        await itemsCollection.updateOne(
          { _id: new ObjectId(itemId) },
          {
            $set: {
              linkedReportId: reportId,
              linkedAt: new Date(),
              updatedAt: new Date()
            }
          }
        );

        res.status(200).json({
          success: true,
          message: "Successfully linked report to item",
          reportId,
          itemId
        });
      } catch (err) {
        console.error(err);
        res.status(500).send("Failed to link report and item");
      }
    });

    // Unlink a lost report from a found item
    app.post("/unlink", async (req, res) => {
      const { reportId, itemId } = req.body;

      if (!reportId || !itemId) {
        return res.status(400).send("Both reportId and itemId are required");
      }

      try {
        // Unlink both records
        await lostReportsCollection.updateOne(
          { _id: new ObjectId(reportId) },
          {
            $unset: { linkedItemId: "", linkedAt: "" },
            $set: { updatedAt: new Date() }
          }
        );

        await itemsCollection.updateOne(
          { _id: new ObjectId(itemId) },
          {
            $unset: { linkedReportId: "", linkedAt: "" },
            $set: { updatedAt: new Date() }
          }
        );

        res.status(200).json({
          success: true,
          message: "Successfully unlinked report from item"
        });
      } catch (err) {
        console.error(err);
        res.status(500).send("Failed to unlink report and item");
      }
    });

    // Get linked item for a report
    app.get("/lostreports/:id/linked-item", async (req, res) => {
      const { id } = req.params;
      try {
        const report = await lostReportsCollection.findOne({ _id: new ObjectId(id) });
        if (!report) return res.status(404).send("Lost report not found");

        if (!report.linkedItemId) {
          return res.status(200).json(null);
        }

        const item = await itemsCollection.findOne({
          _id: new ObjectId(report.linkedItemId),
          isDeleted: { $ne: true }, //  don't return deleted linked items
        });

        res.status(200).json(item);
      } catch (err) {
        console.error(err);
        res.status(500).send("Failed to fetch linked item");
      }
    });

    // Get linked report for an item
    app.get("/items/:id/linked-report", async (req, res) => {
      const { id } = req.params;
      try {
        const item = await itemsCollection.findOne({
          _id: new ObjectId(id),
          isDeleted: { $ne: true },
        });

        if (!item) return res.status(404).send("Item not found");

        if (!item.linkedReportId) {
          return res.status(200).json(null);
        }

        const report = await lostReportsCollection.findOne({
          _id: new ObjectId(item.linkedReportId),
          isDeleted: { $ne: true }, //  don't return deleted linked reports
        });

        res.status(200).json(report);
      } catch (err) {
        console.error(err);
        res.status(500).send("Failed to fetch linked report");
      }
    });

    // -----------------------
    // ANALYTICS
    // -----------------------
    app.get("/analytics", async (req, res) => {
      try {
        const [items, lostReports] = await Promise.all([
          itemsCollection.find({ isDeleted: { $ne: true } }).toArray(),       //  ignore deleted items
          lostReportsCollection.find({ isDeleted: { $ne: true } }).toArray(), //  ignore deleted reports
        ]);
        const combined = [...items, ...lostReports];

        const activeItems = combined.filter((doc) =>
          ["Open", "Active", "Claimed"].includes(doc.status)
        ).length;

        const totalCount = combined.length;
        const claimedResolved = combined.filter((d) =>
          ["Claimed", "Resolved"].includes(d.status)
        ).length;
        const claimMatchRate = totalCount > 0 ? ((claimedResolved / totalCount) * 100).toFixed(2) : 0;

        const resolvedItems = combined.filter((d) => d.resolvedAt && d.status === "Resolved");
        let medianDays = 0;
        if (resolvedItems.length > 0) {
          const daysArray = resolvedItems.map((doc) => (new Date(doc.resolvedAt) - new Date(doc.createdAt)) / (1000 * 60 * 60 * 24));
          daysArray.sort((a, b) => a - b);
          const mid = Math.floor(daysArray.length / 2);
          medianDays = daysArray.length % 2 === 0 ? (daysArray[mid - 1] + daysArray[mid]) / 2 : daysArray[mid];
        }

        res.json({ activeItems, claimMatchRate, medianTimeToResolution: medianDays.toFixed(1) });
      } catch (err) {
        console.error("❌ /analytics error", err);
        res.status(500).json({ error: "Failed to fetch analytics" });
      }
    });

    app.get("/analytics/monthly", async (req, res) => {
      try {
        const monthsBack = parseInt(req.query.months || "6", 10);
        const now = new Date();
        const months = [];
        for (let i = monthsBack - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }

        const [items, lostReports] = await Promise.all([
          itemsCollection.find({ isDeleted: { $ne: true } }).toArray(),       //  ignore deleted items
          lostReportsCollection.find({ isDeleted: { $ne: true } }).toArray(), //  ignore deleted reports
        ]);
        const combined = [...items, ...lostReports];

        const safeMonth = (dateVal) => {
          if (!dateVal) return null;
          const d = new Date(dateVal);
          if (isNaN(d.getTime())) return null;
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        };

        const countByMonth = (statuses, dateField) => {
          const map = {};
          combined.forEach(doc => {
            if (!statuses.includes(doc.status)) return;
            const month = safeMonth(doc[dateField]);
            if (!month) return;
            map[month] = (map[month] || 0) + 1;
          });
          return map;
        };

        const open = countByMonth(["Open", "Active"], "createdAt");
        const claimed = countByMonth(["Claimed"], "createdAt");
        const resolved = countByMonth(["Resolved"], "resolvedAt");
        const unresolved = countByMonth(["Open", "Active", "Claimed"], "createdAt");

        res.json({
          months,
          series: {
            Open: months.map(m => open[m] || 0),
            Claimed: months.map(m => claimed[m] || 0),
            Resolved: months.map(m => resolved[m] || 0),
            Unresolved: months.map(m => unresolved[m] || 0),
          }
        });
      } catch (err) {
        console.error("❌ /analytics/monthly error", err);
        res.status(500).json({ error: "Failed to compute monthly analytics" });
      }
    });

    // ========================
    // ITEMS ROUTES (Item Discovery Feature)
    // ========================
    app.get('/api/items', async (req, res) => {
      try {
        const {
          keyword,
          category,
          status,
          dateFrom,
          dateTo,
          page = 1,
          limit = 12,
        } = req.query;

        const query = {};
        // exclude deleted items everywhere in discovery/share
        query.isDeleted = { $ne: true };


        if (keyword) {
          query.$or = [
            { title: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
          ];
        }

        if (category && category !== 'All') {
          query.category = category;
        }

        if (status && status !== 'All') {
          query.status = status;
        }

        if (dateFrom || dateTo) {
          query.dateFound = {};
          if (dateFrom) {
            query.dateFound.$gte = new Date(dateFrom);
          }
          if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
            query.dateFound.$lte = endDate;
          }
        }
        query.hidden = { $ne: true };

        const skip = (page - 1) * limit;
        const limitNum = parseInt(limit);

        const items = await itemsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .limit(limitNum)
          .skip(skip)
          .toArray();

        const total = await itemsCollection.countDocuments(query);

        res.status(200).json({
          success: true,
          data: items,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limitNum),
            totalItems: total,
            itemsPerPage: limitNum,
          },
        });
      } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch items',
          error: error.message,
        });
      }
    });

    // Get single item by ID
    app.get('/api/items/:id', async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid item ID',
          });
        }
        const item = await itemsCollection.findOne({
          _id: new ObjectId(id),
          isDeleted: { $ne: true }, //  hide deleted items from detail/share link
        });


        if (!item || item.hidden) {
          return res.status(404).json({
            success: false,
            message: 'Item not found',
          });
        }

        res.status(200).json({
          success: true,
          data: item,
        });
      } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch item',
          error: error.message,
        });
      }
    });

    // ========================
    // CLAIMS MANAGEMENT ROUTES-------(##4)-loba
    // ========================

    // POST /claims - Student creates a new claim
    app.post('/claims', async (req, res) => {
      const claimData = req.body;

      if (!claimData.itemId || !claimData.claimantEmail || (!claimData.proofText && !claimData.proofPhotoUrl)) {
        return res.status(400).json({ message: 'Missing required fields (itemId, claimantEmail, and at least one proof).' });
      }

      try {

        const item = await itemsCollection.findOne({ _id: new ObjectId(claimData.itemId) });
        if (!item) {
          return res.status(404).json({ message: 'Item not found or is no longer claimable.' });
        }


        const status = (item.status || 'Open').trim().toLowerCase();
        if (status !== 'open') {
          return res.status(404).json({ message: 'Item not found or is no longer claimable.' });
        }


        const newClaim = {
          itemId: claimData.itemId,
          itemTitle: item.title,
          claimantEmail: claimData.claimantEmail,
          proofText: claimData.proofText || '',
          proofPhotoUrl: claimData.proofPhotoUrl || '',
          status: 'Pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await claimsCollection.insertOne(newClaim);
        // ✅ Claim created → notify staff/admin
        await notifyAuthorities({
          type: "CLAIM_CREATED",
          title: "New claim submitted",
          message: `A new claim was submitted for “${item.title || "item"}”.`,
          link: `/dashboard/claims/${result.insertedId}`,
          entity: { kind: "claim", id: String(result.insertedId), itemId: String(claimData.itemId) },
        });

        res.status(201).json({
          success: true,
          message: 'Claim submitted successfully. Waiting for staff review.',
          claimId: result.insertedId
        });
      } catch (error) {
        console.error('Error submitting claim:', error);
        res.status(500).json({ message: 'Failed to submit claim.' });
      }
    });

    // NEW: POST /items/:itemId/claims  <-- used by StudentClaimPage
    app.post('/items/:itemId/claims', async (req, res) => {
      const { itemId } = req.params;
      const {
        claimantEmail,
        claimantName,
        proofText,
        proofPhotoUrl,
      } = req.body;

      // 0) Basic validation
      if (!itemId || !claimantEmail || (!proofText && !proofPhotoUrl)) {
        return res.status(400).json({
          message:
            'Missing required fields (itemId param, claimantEmail, and at least one proof).',
        });
      }

      try {
        // 1) Verify item exists
        let item = null;

        if (ObjectId.isValid(itemId)) {
          item = await itemsCollection.findOne({ _id: new ObjectId(itemId) });
        }
        if (!item) {

          item = await itemsCollection.findOne({ _id: itemId });
        }

        if (!item) {

          return res.status(404).json({
            message: 'Item not found.',
          });
        }

        // 2) Check if this student already has a pending claim for this item
        const existingClaim = await claimsCollection.findOne({
          itemId: String(itemId),
          claimantEmail,
          status: 'Pending',
        });

        if (existingClaim) {
          return res.status(400).json({
            message: 'You already have a pending claim for this item.',
          });
        }

        // 3) Enforce EXACTLY ONE proof (text XOR photo)
        const text = (proofText || '').trim();
        const photo = (proofPhotoUrl || '').trim();

        if (!text && !photo) {
          return res.status(400).json({
            message: 'Provide exactly one proof: text OR photo.',
          });
        }

        if (text && photo) {
          return res.status(400).json({
            message: 'Provide exactly one proof: text OR photo (not both).',
          });
        }

        // 4) Create the claim
        const newClaim = {
          itemId: String(itemId),
          itemTitle: item.title,
          claimantEmail,
          claimantName: claimantName || null,
          proofText: text || '',
          proofPhotoUrl: photo || '',
          status: 'Pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await claimsCollection.insertOne(newClaim);
        // ✅ Claim created → notify staff/admin
        await notifyAuthorities({
          type: "CLAIM_CREATED",
          title: "New claim submitted",
          message: `A new claim was submitted for “${item.title || "item"}”.`,
          link: `/dashboard/claims/${result.insertedId}`,
          entity: { kind: "claim", id: String(result.insertedId), itemId: String(itemId) },
        });


        return res.status(201).json({
          success: true,
          message: 'Claim submitted successfully. Waiting for staff review.',
          claimId: result.insertedId,
        });
      } catch (error) {
        console.error('Error submitting claim via /items/:itemId/claims:', error);
        return res.status(500).json({ message: 'Failed to submit claim.' });
      }
    });



    // GET /claims - Staff gets all claims, Student gets claims by email
    app.get('/claims', async (req, res) => {
      try {
        const { email } = req.query; // Used by student for 'My Claims'

        let filter = {};
        if (email) {

          filter.claimantEmail = email;
        } else {

          filter.status = { $in: ["Pending", "Accepted", "Rejected"] };
        }

        const claims = await claimsCollection.find(filter).sort({ createdAt: -1 }).toArray();
        res.status(200).json(claims);
      } catch (error) {
        console.error('Error fetching claims:', error);
        res.status(500).json({ message: 'Failed to fetch claims.' });
      }
    });

    // GET /claims/:id - Get single claim details
    app.get('/claims/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const claim = await claimsCollection.findOne({ _id: new ObjectId(id) });
        if (!claim) {
          return res.status(404).json({ message: 'Claim not found.' });
        }
        res.status(200).json(claim);
      } catch (error) {
        console.error('Error fetching claim details:', error);
        res.status(400).json({ message: 'Invalid claim ID.' });
      }
    });

    // PUT /claims/:id/accept - Staff accepts a claim
    app.put('/claims/:id/accept', async (req, res) => {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid claim ID.' });
      }

      try {
        const _id = new ObjectId(id);

        // 1) Find the claim first
        const claim = await claimsCollection.findOne({ _id });

        if (!claim) {
          return res.status(404).json({ message: 'Claim not found.' });
        }

        if (claim.status !== 'Pending') {
          return res
            .status(400)
            .json({ message: `Cannot accept claim with status "${claim.status}".` });
        }

        // 2) Generate a 6-digit OTP as string
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        const updateDoc = {
          $set: {
            status: 'Accepted',
            otp: otp,
            reviewedAt: new Date(),
            updatedAt: new Date(),
          }
        };

        const result = await claimsCollection.findOneAndUpdate(
          { _id },
          updateDoc,
          { returnDocument: 'after' }
        );


        // ✅ Notify student 
        await createNotification({
          userEmail: claim.claimantEmail,
          type: "CLAIM_ACCEPTED",
          title: "Claim accepted",
          message: `Your claim for “${claim.itemTitle || "item"}” was accepted. Please check My Claims for details.`,
          link: "/dashboard/my-claims",
          entity: { kind: "claim", id: String(_id), itemId: claim.itemId },
        });


        return res.json({
          message: 'Claim accepted successfully.',
          ...result.value
        });

      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error while accepting claim.' });
      }
    });

    // PUT /claims/:id/reject - Staff rejects a claim
    app.put('/claims/:id/reject', async (req, res) => {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid claim ID.' });
      }

      try {
        const _id = new ObjectId(id);

        // 1) Find the claim first
        const claim = await claimsCollection.findOne({ _id });

        if (!claim) {
          return res.status(404).json({ message: 'Claim not found.' });
        }

        if (claim.status !== 'Pending') {
          return res
            .status(400)
            .json({ message: `Cannot reject claim with status "${claim.status}".` });
        }

        const updateDoc = {
          $set: {
            status: 'Rejected',
            reviewedAt: new Date(),
            updatedAt: new Date(),
          },
          $unset: { otp: "" }
        };

        const result = await claimsCollection.findOneAndUpdate(
          { _id },
          updateDoc,
          { returnDocument: 'after' }
        );


        // ✅ Notify student
        await createNotification({
          userEmail: claim.claimantEmail,
          type: "CLAIM_REJECTED",
          title: "Claim rejected",
          message: `Your claim for “${claim.itemTitle || "item"}” was rejected. Please check My Claims for details.`,
          link: "/dashboard/my-claims",
          entity: { kind: "claim", id: String(_id), itemId: claim.itemId },
        });


        return res.status(200).json(result.value);
      } catch (error) {
        console.error('Error rejecting claim:', error);
        res.status(500).json({ message: 'Failed to reject claim.' });
      }
    });

    // PUT /claims/:id/cancel - Student cancels a claim
    app.put('/claims/:id/cancel', async (req, res) => {
      const { id } = req.params;
      try {
        const filter = { _id: new ObjectId(id), status: 'Pending' };
        const updateDoc = {
          $set: {
            status: 'Cancelled',
            updatedAt: new Date(),
          },
          $unset: { otp: "" }
        };

        const result = await claimsCollection.findOneAndUpdate(
          filter,
          updateDoc,
          { returnDocument: 'after' }
        );

        const updated = result && (result.value ?? result);

        if (!updated) {
          return res
            .status(404)
            .json({ message: 'Claim not found or status is not Pending.' });
        }

        res.status(200).json(updated);
      } catch (error) {
        console.error('Error canceling claim:', error);
        res.status(500).json({ message: 'Failed to cancel claim.' });
      }
    });

    // -----------------------
    // HANDOVER OTP VERIFICATION (##5)-loba
    // -----------------------
    app.post('/handover/verify-otp', async (req, res) => {
      const { claimId, otp } = req.body;

      if (!claimId || !otp) {
        return res.status(400).json({ message: 'Claim ID and OTP are required.' });
      }

      try {
        let claim = null;
        if (ObjectId.isValid(claimId)) {
          const objectId = new ObjectId(claimId);
          claim = await claimsCollection.findOne({ _id: objectId });
        }


        if (!claim) {
          claim = await claimsCollection.findOne({ itemId: String(claimId) });
        }

        if (!claim) {
          return res.status(400).json({
            message: 'Verification failed. Invalid Claim ID or claim not found.'
          });
        }

        //  Check status
        if (claim.status !== 'Accepted') {
          return res.status(400).json({
            message: 'Verification failed. Claim is not Accepted.'
          });
        }

        // Check OTP (string-safe compare)
        if (String(claim.otp) !== String(otp)) {
          return res.status(400).json({
            message: 'Verification failed. Invalid OTP.'
          });
        }

        // All good → mark as handed over
        const updateDoc = {
          $set: {
            status: 'HandedOver',
            resolvedAt: new Date(),
            updatedAt: new Date(),
            otpVerifiedAt: new Date(),
          }
        };

        const result = await claimsCollection.findOneAndUpdate(
          { _id: claim._id },
          updateDoc,
          { returnDocument: 'after' }
        );

        // ✅ Notify student: handover verified
        await createNotification({
          userEmail: claim.claimantEmail,
          type: "HANDOVER_VERIFIED",
          title: "Handover verified",
          message: `Your handover for “${claim.itemTitle || "item"}” was verified successfully.`,
          link: "/dashboard/my-claims",
          entity: { kind: "claim", id: String(claim._id), itemId: String(claim.itemId) },
        });

        return res.json({
          message: 'Item successfully handed over.',
          ...result.value
        });

      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error verifying OTP.' });
      }
    });



    // -----------------------
    // Feature 10 Moderation
    // -----------------------
    // Hide / unhide an item (for staff/admin via moderation)
    app.patch('/api/items/:id/hide', async (req, res) => {
      try {
        const { id } = req.params;
        const { hidden = true } = req.body;

        const desiredHidden = !!hidden;

        // Build a query that works whether _id is an ObjectId or a string
        let query;
        if (ObjectId.isValid(id)) {
          query = {
            $or: [
              { _id: new ObjectId(id) }, // normal ObjectId-based docs
              { _id: id },               // any legacy string _id docs
            ],
          };
        } else {
          // not a valid ObjectId: treat it as a plain string id
          query = { _id: id };
        }

        // 1) Check if the item actually exists
        const existing = await itemsCollection.findOne(query);

        if (!existing) {
          // This is the ONLY place we send 404 for this route
          return res
            .status(404)
            .json({ success: false, message: 'Item not found' });
        }

        // 2) If it’s already in the desired state, just return it as success
        if (!!existing.hidden === desiredHidden) {
          return res.status(200).json({
            success: true,
            data: existing,
          });
        }

        // 3) Update hidden flag using the exact _id we just found
        await itemsCollection.updateOne(
          { _id: existing._id },
          { $set: { hidden: desiredHidden, updatedAt: new Date() } }
        );

        // 4) Fetch updated item to return
        const updated = await itemsCollection.findOne({ _id: existing._id });

        return res.status(200).json({
          success: true,
          data: updated || { ...existing, hidden: desiredHidden },
        });
      } catch (error) {
        console.error('Error hiding/unhiding item:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to hide/unhide item',
          error: error.message,
        });
      }
    });

    // Hide / unhide a lost report (for staff/admin via moderation)
    app.patch("/api/lostreports/:id/hide", async (req, res) => {
      try {
        const { id } = req.params;
        const { hidden = true } = req.body;

        const desiredHidden = !!hidden;

        // Build a query that works whether _id is an ObjectId or a string
        let query;
        if (ObjectId.isValid(id)) {
          query = {
            $or: [
              { _id: new ObjectId(id) }, // normal ObjectId-based docs
              { _id: id },               // any legacy string _id docs
            ],
          };
        } else {
          // not a valid ObjectId: treat it as a plain string id
          query = { _id: id };
        }

        // 1) Check if the lost report actually exists
        const existing = await lostReportsCollection.findOne(query);

        if (!existing) {
          // This is the ONLY place we send 404 for this route
          return res
            .status(404)
            .json({ success: false, message: "Lost report not found" });
        }

        // 2) If it’s already in the desired state, just return it as success
        if (!!existing.hidden === desiredHidden) {
          return res.status(200).json({
            success: true,
            data: existing,
          });
        }

        // 3) Update hidden flag using the exact _id we just found
        await lostReportsCollection.updateOne(
          { _id: existing._id },
          { $set: { hidden: desiredHidden, updatedAt: new Date() } }
        );

        // 4) Fetch updated lost report to return
        const updated = await lostReportsCollection.findOne({
          _id: existing._id,
        });

        return res.status(200).json({
          success: true,
          data: updated || { ...existing, hidden: desiredHidden },
        });
      } catch (error) {
        console.error("Error hiding/unhiding lost report:", error);
        res.status(500).json({
          success: false,
          message: "Failed to hide/unhide lost report",
          error: error.message,
        });
      }
    });



    // Create a report on an item, comment, or lost report
    app.post("/api/reports", async (req, res) => {
      try {
        const { targetType, targetId, reason, details, reporter } = req.body;

        const allowedTypes = ["item", "comment", "lostreport"];

        if (!targetType || !allowedTypes.includes(targetType)) {
          return res.status(400).json({
            success: false,
            message: 'targetType must be "item", "comment", or "lostreport"',
          });
        }

        if (!targetId || !ObjectId.isValid(targetId)) {
          return res
            .status(400)
            .json({ success: false, message: "Valid targetId is required" });
        }

        if (!reason || !reason.trim()) {
          return res
            .status(400)
            .json({ success: false, message: "Reason is required" });
        }

        if (!reporter || !reporter.email) {
          return res.status(400).json({
            success: false,
            message: "Reporter email is required",
          });
        }

        const targetObjectId = new ObjectId(targetId);
        let targetItemId = null;
        let targetLostReportId = null;

        if (targetType === "item") {
          const item = await itemsCollection.findOne({ _id: targetObjectId });
          if (!item) {
            return res.status(404).json({
              success: false,
              message: "Reported item not found",
            });
          }
          targetItemId = item._id;
        } else if (targetType === "comment") {
          const comment = await commentsCollection.findOne({
            _id: targetObjectId,
          });
          if (!comment) {
            return res.status(404).json({
              success: false,
              message: "Reported comment not found",
            });
          }
          targetItemId = comment.itemId;
        } else if (targetType === "lostreport") {
          const lostReport = await lostReportsCollection.findOne({
            _id: targetObjectId,
          });
          if (!lostReport) {
            return res.status(404).json({
              success: false,
              message: "Reported lost report not found",
            });
          }
          targetLostReportId = lostReport._id;
        }

        const now = new Date();
        const doc = {
          targetType, // 'item' | 'comment' | 'lostreport'
          targetId: targetObjectId,
          targetItemId: targetItemId || null,
          targetLostReportId: targetLostReportId || null,
          reason: reason.trim(),
          details: details?.trim() || "",
          reporter: {
            email: reporter.email,
            name: reporter.name || reporter.email,
            role: reporter.role || "student",
          },
          status: "open", // 'open' | 'resolved' | 'dismissed'
          actionTaken: null, // 'hidden' | 'warning' | 'ban' | 'none'
          handledBy: null, // { email, name } when processed
          createdAt: now,
          updatedAt: now,
        };

        const result = await reportsCollection.insertOne(doc);
        const created = await reportsCollection.findOne({
          _id: result.insertedId,
        });

        res.status(201).json({ success: true, data: created });
      } catch (error) {
        console.error("Error creating report:", error);
        res.status(500).json({
          success: false,
          message: "Failed to create report",
          error: error.message,
        });
      }
    });


    // Get reports (moderation queue)
    app.get('/api/reports', async (req, res) => {
      try {
        const { status = 'open', page = 1, limit = 20 } = req.query;

        const query = {};
        if (status !== 'all') {
          query.status = status;
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [reports, total] = await Promise.all([
          reportsCollection
            .find(query)
            .sort({ createdAt: -1 }) // newest first
            .skip(skip)
            .limit(limitNum)
            .toArray(),
          reportsCollection.countDocuments(query),
        ]);

        res.status(200).json({
          success: true,
          data: reports,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalItems: total,
            itemsPerPage: limitNum,
          },
        });
      } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch reports',
          error: error.message,
        });
      }
    });

    // Delete a report entirely (after a moderation decision)
    app.delete('/api/reports/:id', async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, message: 'Invalid report ID' });
        }

        const result = await reportsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .json({ success: false, message: 'Report not found' });
        }

        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to delete report',
          error: error.message,
        });
      }
    });

    //-----------------------------

    // issue warning
    app.post('/api/moderation/warn', async (req, res) => {
      try {
        const { email, reason, reportId, staff } = req.body;

        if (!email) {
          return res.status(400).json({ success: false, message: 'email is required' });
        }

        const now = new Date();
        let student = await studentsCollection.findOne({ email });

        // create student doc if missing
        if (!student) {
          student = {
            email,
            name: email,
            studentId: null,
            banned: false,
            warningsCount: 0,
            bannedUntil: null,
            createdAt: now,
            updatedAt: now,
          };
          const insertResult = await studentsCollection.insertOne(student);
          student._id = insertResult.insertedId;
        }

        let warningsCount = (student.warningsCount || 0) + 1;
        let bannedUntil = student.bannedUntil;

        if (warningsCount >= 3) {
          const banMs = 30 * 24 * 60 * 60 * 1000;
          bannedUntil = new Date(now.getTime() + banMs);
        }

        const updatedResult = await studentsCollection.findOneAndUpdate(
          { email },
          {
            $set: {
              warningsCount,
              bannedUntil: bannedUntil || null,
              banned: !!bannedUntil,
              lastWarningReason: reason || '',
              lastWarningBy: staff?.email || null,
              lastWarningAt: now,
              updatedAt: now,
            },
          },
          { returnDocument: 'after' }
        );

        // mark report as resolved with correct action, if linked
        if (reportId && ObjectId.isValid(reportId)) {
          await reportsCollection.updateOne(
            { _id: new ObjectId(reportId) },
            {
              $set: {
                status: 'resolved',
                actionTaken: bannedUntil ? 'ban' : 'warning',
                handledBy: staff || null,
                updatedAt: new Date(),
              },
            }
          );
        }

        res.status(200).json({ success: true, data: updatedResult.value });
      } catch (error) {
        console.error('Error issuing warning:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to issue warning',
          error: error.message,
        });
      }
    });

    app.get('/api/moderation/user-status/:email', async (req, res) => {
      try {
        const { email } = req.params;
        if (!email) {
          return res
            .status(400)
            .json({ success: false, message: 'email is required' });
        }

        let student = await studentsCollection.findOne({ email });
        const now = new Date();

        // --- Auto-clear expired ban + reset warnings ---
        if (student && student.bannedUntil && new Date(student.bannedUntil) <= now) {
          const updatedResult = await studentsCollection.findOneAndUpdate(
            { email },
            {
              $set: {
                banned: false,
                warningsCount: 0,
                updatedAt: now,
              },
              $unset: { bannedUntil: "" },
            },
            { returnDocument: "after" }
          );

          student =
            updatedResult.value || {
              ...student,
              banned: false,
              warningsCount: 0,
              bannedUntil: null,
            };
        }

        const warningsCount = student?.warningsCount || 0;
        const bannedUntil = student?.bannedUntil || null;
        const isBanned = !!bannedUntil && new Date(bannedUntil) > now;

        res.status(200).json({
          success: true,
          data: { email, warningsCount, bannedUntil, isBanned },
        });
      } catch (error) {
        console.error('Error fetching user moderation status:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch user moderation status',
          error: error.message,
        });
      }
    });

    // Moderation: list hidden items
    app.get('/api/moderation/hidden-items', async (req, res) => {
      try {
        const { page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const query = { hidden: true };

        const [items, total] = await Promise.all([
          itemsCollection
            .find(query)
            .sort({ updatedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .toArray(),
          itemsCollection.countDocuments(query),
        ]);

        res.status(200).json({
          success: true,
          data: items,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalItems: total,
            itemsPerPage: limitNum,
          },
        });
      } catch (error) {
        console.error('Error fetching hidden items:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch hidden items',
          error: error.message,
        });
      }
    });

    // Moderation: list hidden comments
    app.get('/api/moderation/hidden-comments', async (req, res) => {
      try {
        const { page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const query = { hidden: true };

        const [comments, total] = await Promise.all([
          commentsCollection
            .find(query)
            .sort({ updatedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .toArray(),
          commentsCollection.countDocuments(query),
        ]);

        res.status(200).json({
          success: true,
          data: comments,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalItems: total,
            itemsPerPage: limitNum,
          },
        });
      } catch (error) {
        console.error('Error fetching hidden comments:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch hidden comments',
          error: error.message,
        });
      }
    });

    // Moderation: list hidden lost reports
    app.get("/api/moderation/hidden-lostreports", async (req, res) => {
      try {
        const { page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const query = { hidden: true };

        const [lostReports, total] = await Promise.all([
          lostReportsCollection
            .find(query)
            .sort({ updatedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .toArray(),
          lostReportsCollection.countDocuments(query),
        ]);

        res.status(200).json({
          success: true,
          data: lostReports,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalItems: total,
            itemsPerPage: limitNum,
          },
        });
      } catch (error) {
        console.error("Error fetching hidden lost reports:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch hidden lost reports",
          error: error.message,
        });
      }
    });


    // -----------------------
    // RESTORE Item (undo soft delete)
    // ----------------------- 

    app.patch("/items/:id/restore", async (req, res) => {
      const { id } = req.params;

      try {
        const _id = new ObjectId(id);

        const item = await itemsCollection.findOne({ _id, isDeleted: true });
        if (!item) return res.status(404).send("Item not found in recycle bin");


        await itemsCollection.updateOne(
          { _id },
          {
            $set: {
              isDeleted: false,
              restoredAt: new Date(),
              restoredBy: req.body?.restoredBy || null,
              updatedAt: new Date(),
            },
            // unset deletedAt so TTL won't remove restored item
            $unset: { deletedAt: "", deletedBy: "" },
          }
        );

        // create notification on ITEM restore
        await createNotification({
          userEmail: req.body?.restoredBy || null,
          type: "ITEM_RESTORED",
          title: "Item restored",
          message: `“${item.title || "Untitled"}” has been restored successfully.`,
          link: "/dashboard/items",
          entity: { kind: "item", id },
        });

        res.send({ ok: true, restored: true });
      } catch (err) {
        console.error(err);
        res.status(400).send("Invalid item id");
      }
    });

    // RESTORE Lost Report (undo soft delete)
    app.patch("/lostreports/:id/restore", async (req, res) => {
      const { id } = req.params;

      try {
        const _id = new ObjectId(id);

        const report = await lostReportsCollection.findOne({ _id, isDeleted: true });
        if (!report) return res.status(404).send("Lost report not found in recycle bin");


        await lostReportsCollection.updateOne(
          { _id },
          {
            $set: {
              isDeleted: false,
              restoredAt: new Date(),
              restoredBy: req.body?.restoredBy || null,
              updatedAt: new Date(),
            },
            // unset deletedAt so TTL won't remove restored report
            $unset: { deletedAt: "", deletedBy: "" },
          }
        );

        // notify student 
        await createNotification({
          userEmail: report.userEmail,
          type: "LOSTREPORT_RESTORED",
          title: "Lost report restored",
          message: `“${report.title || "Untitled"}” has been restored successfully.`,
          link: "/app/lost-reports",
          entity: { kind: "lostreport", id },
        });

        res.send({ ok: true, restored: true });
      } catch (err) {
        console.error(err);
        res.status(400).send("Invalid report id");
      }
    });

    // -----------------------
    // RECYCLE BIN ROUTES
    // ----------------------- 

    app.get("/api/recycle-bin", async (req, res) => {
      try {
        const { role, userEmail } = req.query;

        if (!role) {
          return res
            .status(400)
            .json({ success: false, message: "role is required" });
        }

        if (role === "admin" || role === "staff") {
          const deletedItems = await itemsCollection
            .find({ isDeleted: true })
            .sort({ deletedAt: -1 })
            .toArray();
          const data = deletedItems.map((doc) => ({
            ...doc,
            displayName: doc.title || doc.name || "(no title)",
          }));

          return res.json({ success: true, entityType: "items", data });
        }


        if (role === "student") {
          if (!userEmail) {
            return res.status(400).json({
              success: false,
              message: "userEmail is required for students",
            });
          }

          const deletedReports = await lostReportsCollection
            .find({ isDeleted: true, userEmail })
            .sort({ deletedAt: -1 })
            .toArray();

          const data = deletedReports.map((doc) => ({
            ...doc,
            displayName: doc.title || doc.name || "(no title)",
          }));

          return res.json({ success: true, entityType: "lostreports", data });
        }

        return res
          .status(400)
          .json({ success: false, message: "Unknown role" });
      } catch (err) {
        console.error(err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to load recycle bin" });
      }
    });

    // -----------------------
    // NOTIFICATIONS ROUTES
    // -----------------------

    // GET /notifications?userEmail=...&limit=50
    app.get("/notifications", async (req, res) => {
      try {
        const { userEmail, limit = 50 } = req.query;
        if (!userEmail) return res.status(400).json({ message: "userEmail is required" });

        const limitNum = Math.min(parseInt(limit, 10) || 50, 100);

        const data = await notificationsCollection
          .find({ userEmail })
          .sort({ createdAt: -1 })
          .limit(limitNum)
          .toArray();

        res.json({ success: true, data });
      } catch (err) {
        console.error("GET /notifications error:", err);
        res.status(500).json({ success: false, message: "Failed to load notifications" });
      }
    });

    // PATCH /notifications/:id/read
    app.patch("/notifications/:id/read", async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

        const result = await notificationsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { isRead: true, readAt: new Date() } }
        );

        res.json({ success: true, updated: result.modifiedCount === 1 });
      } catch (err) {
        console.error("PATCH /notifications/:id/read error:", err);
        res.status(500).json({ success: false, message: "Failed to mark as read" });
      }
    });

    // PATCH /notifications/read-all?userEmail=...
    app.patch("/notifications/read-all", async (req, res) => {
      try {
        const { userEmail } = req.query;
        if (!userEmail) return res.status(400).json({ message: "userEmail is required" });

        const result = await notificationsCollection.updateMany(
          { userEmail, isRead: false },
          { $set: { isRead: true, readAt: new Date() } }
        );

        res.json({ success: true, updatedCount: result.modifiedCount });
      } catch (err) {
        console.error("PATCH /notifications/read-all error:", err);
        res.status(500).json({ success: false, message: "Failed to mark all as read" });
      }
    });


    // GET /notifications/unread-count?userEmail=...
    app.get("/notifications/unread-count", async (req, res) => {
      try {
        const { userEmail } = req.query;
        if (!userEmail) return res.status(400).json({ message: "userEmail is required" });

        const count = await notificationsCollection.countDocuments({
          userEmail,
          isRead: false,
        });

        res.json({ success: true, count });
      } catch (err) {
        console.error("GET /notifications/unread-count error:", err);
        res.status(500).json({ success: false, message: "Failed to load unread count" });
      }
    });
    // DELETE /notifications/:id
    app.delete("/notifications/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { userEmail } = req.body || {};

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: "Invalid id" });
        }
        if (!userEmail) {
          return res.status(400).json({ success: false, message: "userEmail is required" });
        }

        // Only allow deleting own notifications
        const result = await notificationsCollection.deleteOne({
          _id: new ObjectId(id),
          userEmail,
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ success: false, message: "Notification not found" });
        }

        res.json({ success: true, deleted: true });
      } catch (err) {
        console.error("DELETE /notifications/:id error:", err);
        res.status(500).json({ success: false, message: "Failed to delete notification" });
      }
    });

    // -----------------------
        // FEATURE 12 (Example: Campus Lost and Found Chat Feature)
        // -----------------------
        const chatsCollection = db.collection("chats");
    
        app.post("/feature12/chat", async (req, res) => {
          const { userEmail, message } = req.body;
          if (!userEmail || !message) return res.status(400).send("Missing fields");
    
          const newMsg = {
            userEmail,
            message,
            createdAt: new Date()
          };
          const result = await chatsCollection.insertOne(newMsg);
          const created = await chatsCollection.findOne({ _id: result.insertedId });
          res.status(201).json(created);
        });
    
        app.get("/feature12/chat/:email", async (req, res) => {
          const { email } = req.params;
          const msgs = await chatsCollection.find({ userEmail: email }).sort({ createdAt: 1 }).toArray();
          res.status(200).json(msgs);
        });
    
    
    
        
    
    
        // -----------------------
        // FEATURE 15 (Example: Notification / Alerts Feature)
        // -----------------------
        
    
        app.post("/feature15/notify", async (req, res) => {
          const { userEmail, title, message } = req.body;
          if (!userEmail || !title || !message) return res.status(400).send("Missing fields");
    
          const newNotif = {
            userEmail,
            title,
            message,
            read: false,
            createdAt: new Date()
          };
    
          const result = await notificationsCollection.insertOne(newNotif);
          const created = await notificationsCollection.findOne({ _id: result.insertedId });
          res.status(201).json(created);
        });
    
        app.get("/feature15/notifications/:email", async (req, res) => {
          const { email } = req.params;
          const notifs = await notificationsCollection.find({ userEmail: email }).sort({ createdAt: -1 }).toArray();
          res.status(200).json(notifs);
        });
    
        app.put("/feature15/notifications/:id/read", async (req, res) => {
          const { id } = req.params;
          const result = await notificationsCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { read: true, updatedAt: new Date() } },
            { returnDocument: "after" }
          );
          if (!result.value) return res.status(404).send("Notification not found");
          res.status(200).json(result.value);
        });
    
        //Feature20
        const adminExportRoutes = require("./routes/adminExportRoutes");
        app.use("/admin", adminExportRoutes);





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Back2U server is running')
})

app.listen(port, () => {
  console.log(`Back2U server is running on port ${port}`)
})
