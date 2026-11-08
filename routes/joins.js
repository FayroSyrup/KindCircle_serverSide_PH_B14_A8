import { Router } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../db.js";
import { verifyToken } from "../middleware/auth.js";
import { today } from "../utils/date.js";

const router = Router();

// join an event
router.post("/", verifyToken, async (req, res) => {
  const { eventId } = req.body ?? {};
  if (!ObjectId.isValid(eventId))
    return res.status(400).json({ message: "Invalid event id" });

  const { events, joins } = await collections();
  const event = await events.findOne({ _id: new ObjectId(eventId) });
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (event.eventDate < today())
    return res.status(400).json({ message: "This event has already passed" });

  const old = await joins.findOne({ eventId: event._id, userEmail: req.user.email });
  if (old) return res.status(409).json({ message: "You already joined this event" });

  await joins.insertOne({
    eventId: event._id,
    eventTitle: event.title,
    userEmail: req.user.email,
    userName: req.user.name,
    joinedAt: new Date(),
  });
  res.status(201).json({ message: "Joined successfully" });
});

// events joined by the user, sorted by event date
router.get("/mine", verifyToken, async (req, res) => {
  const { joins } = await collections();
  const list = await joins
    .aggregate([
      { $match: { userEmail: req.user.email } },
      { $lookup: { from: "events", localField: "eventId", foreignField: "_id", as: "event" } },
      { $unwind: "$event" },
      { $sort: { "event.eventDate": 1 } },
      { $replaceRoot: { newRoot: { $mergeObjects: ["$event", { joinedAt: "$joinedAt" }] } } },
    ])
    .toArray();
  res.json(list);
});

export default router;