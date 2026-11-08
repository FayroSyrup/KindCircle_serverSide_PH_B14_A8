
import { Router } from "express";
import { ObjectId } from "mongodb";

import { collections } from "../db.js";
import { today } from "../utils/date.js";
import { verifyToken } from "../middleware/auth.js";
import {
  checkEvent,
  pickEventFields,
} from "../utils/validate.js";

const router = Router();

// Convert string ID into MongoDB ObjectId
const toId = (id) =>
  ObjectId.isValid(id) ? new ObjectId(id) : null;


// GET ALL UPCOMING EVENTS + SEARCH AND FILTER

router.get("/", async (req, res) => {
  const { events } = await collections();

  const { q, type } = req.query;
  const limit = Number(req.query.limit) || 0;

  const filter = {
    eventDate: { $gte: today() },
  };

  if (type && type !== "All") {
    filter.eventType = String(type);
  }

  if (q) {
    const safe = String(q).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    filter.title = {
      $regex: safe,
      $options: "i",
    };
  }

  const list = await events
    .find(filter)
    .sort({ eventDate: 1 })
    .limit(limit)
    .toArray();

  res.json(list);
});

// CREATE EVENT
// Only authenticated users can create events

router.post("/", verifyToken, async (req, res) => {
  const data = pickEventFields(req.body);
  const error = checkEvent(data);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const { events } = await collections();

  const result = await events.insertOne({
    ...data,
    creatorEmail: req.user.email,
    creatorName: req.user.name,
    createdAt: new Date(),
  });

  res.status(201).json({
    message: "Event created",
    id: result.insertedId,
  });
});


// GET EVENTS CREATED BY LOGGED-IN USER

router.get("/mine", verifyToken, async (req, res) => {
  const { events } = await collections();

  const list = await events
    .find({ creatorEmail: req.user.email })
    .sort({ eventDate: 1 })
    .toArray();

  res.json(list);
});


// GET SINGLE EVENT BY ID
// Public route

router.get("/:id", async (req, res) => {
  const _id = toId(req.params.id);

  if (!_id) {
    return res.status(400).json({
      message: "Invalid event id",
    });
  }

  const { events } = await collections();

  const event = await events.findOne({ _id });

  if (!event) {
    return res.status(404).json({
      message: "Event not found",
    });
  }

  res.json(event);
});


// UPDATE EVENT
// Only the creator can update their event

router.put("/:id", verifyToken, async (req, res) => {
  const _id = toId(req.params.id);

  if (!_id) {
    return res.status(400).json({
      message: "Invalid event id",
    });
  }

  const data = pickEventFields(req.body);
  const error = checkEvent(data);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const { events } = await collections();

  const event = await events.findOne({ _id });

  if (!event) {
    return res.status(404).json({
      message: "Event not found",
    });
  }

  if (event.creatorEmail !== req.user.email) {
    return res.status(403).json({
      message: "You can only edit your own events",
    });
  }

  await events.updateOne(
    { _id },
    { $set: data }
  );

  res.json({
    message: "Event updated",
  });
});


// DELETE EVENT
// Only the creator can delete their event

router.delete("/:id", verifyToken, async (req, res) => {
  const _id = toId(req.params.id);

  if (!_id) {
    return res.status(400).json({
      message: "Invalid event id",
    });
  }

  const { events, joins } = await collections();

  const event = await events.findOne({ _id });

  if (!event) {
    return res.status(404).json({
      message: "Event not found",
    });
  }

  if (event.creatorEmail !== req.user.email) {
    return res.status(403).json({
      message: "You can only delete your own events",
    });
  }

  await events.deleteOne({ _id });

  // Remove all joins associated with this event
  await joins.deleteMany({ eventId: _id });

  res.json({
    message: "Event deleted",
  });
});


export default router;
