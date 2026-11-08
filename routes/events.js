import { Router } from "express";
import { collections } from "../db.js";
import { today } from "../utils/date.js";
import { ObjectId } from "mongodb";
import { verifyToken } from "../middleware/auth.js";
import { checkEvent, pickEventFields } from "../utils/validate.js";

const router = Router();

// upcoming events only, nearest date first
router.get("/", async (req, res) => {
  const { events } = await collections();
  const limit = Number(req.query.limit) || 0;
  const list = await events
    .find({ eventDate: { $gte: today() } })
    .sort({ eventDate: 1 })
    .limit(limit)
    .toArray();
  res.json(list);
});

// CREATE EVENT - creator comes from the token
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

const toId = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : null);

// single event for the details page
router.get("/:id", async (req, res) => {
  const _id = toId(req.params.id);

  if (!_id) {
    return res.status(400).json({ message: "Invalid event id" });
  }

  const { events } = await collections();
  const event = await events.findOne({ _id });

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  res.json(event);
});

export default router;
