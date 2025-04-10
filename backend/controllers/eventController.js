const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /events
const createEvent = async (req, res) => {
  const { name, description, location, startTime, endTime, capacity, points } = req.body;

  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const role = req.user.role?.toUpperCase();

  if (!["MANAGER", "SUPERUSER"].includes(role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!name || !description || !location || !startTime || !endTime || points === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (typeof points !== "number" || points <= 0 || !Number.isInteger(points)) {
    return res.status(400).json({ error: "Points must be a positive integer" });
  }

  let start, end;
  try {
    start = new Date(startTime);
    end = new Date(endTime);

    if (isNaN(start) || isNaN(end)) throw new Error();

    if (end <= start) {
      return res.status(400).json({ error: "End time must be after start time" });
    }
  } catch {
    return res.status(400).json({ error: "Invalid start or end time format" });
  }

  if (capacity !== null && capacity !== undefined && (typeof capacity !== "number" || capacity <= 0)) {
    return res.status(400).json({ error: "Invalid capacity" });
  }

  try {
    const newEvent = await prisma.event.create({
      data: {
        name,
        description,
        location,
        startTime: start,
        endTime: end,
        capacity: capacity ?? null,
        pointsRemain: points,
      },
      include: {
        organizers: true,
        rsvps: true,
      },
    });

    return res.status(201).json({
      id: newEvent.id,
      name: newEvent.name,
      description: newEvent.description,
      location: newEvent.location,
      startTime: newEvent.startTime.toISOString(),
      endTime: newEvent.endTime.toISOString(),
      capacity: newEvent.capacity,
      pointsRemain: newEvent.pointsRemain,
      pointsAwarded: newEvent.pointsAwarded,
      published: newEvent.published,
      organizers: [],
      guests: [],
    });
  } catch (err) {
    console.error("Error creating event:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /events
const getEvents = async (req, res) => {
  const {
    name,
    location,
    started,
    ended,
    showFull = "false",
    page = 1,
    limit = 10,
    published,
  } = req.query;

  const role = req.user?.role?.toUpperCase();
  const isManagerOrAbove = ["MANAGER", "SUPERUSER"].includes(role);

  if (!["REGULAR", "CASHIER", "MANAGER", "SUPERUSER"].includes(role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (started !== undefined && ended !== undefined) {
    return res.status(400).json({ error: "Cannot specify both 'started' and 'ended'" });
  }

  const take = parseInt(limit);
  const skip = (parseInt(page) - 1) * take;

  if (isNaN(take) || take <= 0 || isNaN(skip) || skip < 0) {
    return res.status(400).json({ error: "Invalid pagination parameters" });
  }

  const filters = {};

  if (name) filters.name = { contains: name };
  if (location) filters.location = { contains: location };

  const now = new Date();

  if (started !== undefined) {
    filters.startTime = started === "true" ? { lte: now } : { gt: now };
  }

  if (ended !== undefined) {
    filters.endTime = ended === "true" ? { lte: now } : { gt: now };
  }

  if (["REGULAR", "CASHIER"].includes(role)) {
    filters.published = true;
  } else if (isManagerOrAbove && (published === "true" || published === "false")) {
    filters.published = published === "true";
  }

  try {
    const allEvents = await prisma.event.findMany({
      where: filters,
      include: {
        rsvps: true,
      },
    });

    let filtered = allEvents;

    if (showFull !== "true") {
      filtered = allEvents.filter(event => {
        const isFull = event.capacity !== null && event.rsvps.length >= event.capacity;
        return !isFull;
      });
    }

    const results = filtered.map(event => {
      const base = {
        id: event.id,
        name: event.name,
        location: event.location,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        capacity: event.capacity,
        numGuests: event.rsvps.length,
      };

      if (isManagerOrAbove) {
        base.pointsRemain = event.pointsRemain;
        base.pointsAwarded = event.pointsAwarded;
        base.published = event.published;
      }

      return base;
    });

    const count = results.length;
    const paginated = results.slice(skip, skip + take);

    return res.status(200).json({
      count,
      results: paginated,
    });
  } catch (err) {
    console.error("Error fetching events:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /events//:eventId
const getEventById = async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    const userId = req.user?.id;
    const role = req.user?.role?.toUpperCase();
    
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          organizers: {
            include: {
              user: {
                select: { id: true, utorid: true, name: true }
              }
            }
          },
          rsvps: {
            include: {
              user: { select: { id: true } }
            }
          }
        }
      });
  
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
  
      const isManagerOrAbove = ["MANAGER", "SUPERUSER"].includes(role);
      const isOrganizer = event.organizers.some(o => o.userId === userId);
  
      if (!event.published && !isManagerOrAbove && !isOrganizer) {
        return res.status(404).json({ error: "Event not found" });
      }
  
      const baseEvent = {
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        capacity: event.capacity,
        organizers: event.organizers.map(o => o.user),
        numGuests: event.rsvps.length,
      };
  
      if (isManagerOrAbove || isOrganizer) {
        return res.status(200).json({
          ...baseEvent,
          pointsRemain: event.pointsRemain,
          pointsAwarded: event.pointsAwarded,
          published: event.published,
          guests: event.rsvps.map(r => ({ id: r.user.id })),
        });
      } else {
        return res.status(200).json(baseEvent);
      }
  
    } catch (err) {
      console.error("Error fetching event:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
};

// PATCH /events/:eventId
const patchEventById = async (req, res) => { 
  const { eventId } = req.params;
  const normalizedBody = {};
  for (const key in req.body) {
    if (req.body[key] !== null) {
      normalizedBody[key] = req.body[key];
    }
  }

  const {
    name,
    description,
    location,
    startTime,
    endTime,
    capacity,
    points,
    published
  } = normalizedBody;

  const userId = req.user?.id;
  const userRole = req.user?.role?.toUpperCase();
  const isManagerOrAbove = ["MANAGER", "SUPERUSER"].includes(userRole);

  try {
    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
      include: { rsvps: true, organizers: true }
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const isOrganizer = event.organizers.some(org => org.userId === userId);
    if (!isManagerOrAbove && !isOrganizer) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const now = new Date();
    const alreadyStarted = event.startTime <= now;
    const alreadyEnded = event.endTime <= now;

    const updates = {};
    let newStart = event.startTime;
    let newEnd = event.endTime;

    if (name !== undefined) {
      if (alreadyStarted) {
        return res.status(400).json({ error: "Cannot update name after event has started" });
      }
      updates.name = name;
    }

    if (description !== undefined) {
      if (alreadyStarted) {
        return res.status(400).json({ error: "Cannot update description after event has started" });
      }
      updates.description = description;
    }

    if (location !== undefined) {
      if (alreadyStarted) {
        return res.status(400).json({ error: "Cannot update location after event has started" });
      }
      updates.location = location;
    }

    if (startTime !== undefined) {
      const parsedStart = new Date(startTime);
      if (isNaN(parsedStart.getTime()) || parsedStart < now || alreadyStarted) {
        return res.status(400).json({ error: "Invalid or past startTime" });
      }
      updates.startTime = parsedStart;
      newStart = parsedStart;
    }

    if (endTime !== undefined) {
      const parsedEnd = new Date(endTime);
      if (isNaN(parsedEnd.getTime()) || parsedEnd < now || alreadyEnded) {
        return res.status(400).json({ error: "Invalid or past endTime" });
      }
      updates.endTime = parsedEnd;
      newEnd = parsedEnd;
    }

    if (startTime !== undefined && endTime !== undefined) {
      if (newEnd <= newStart) {
        return res.status(400).json({ error: "endTime must be after startTime" });
      }
    }

    if (capacity !== undefined) {
      if (alreadyStarted) {
        return res.status(400).json({ error: "Cannot update capacity after event has started" });
      }
      if (capacity !== null && (typeof capacity !== "number" || capacity <= 0)) {
        return res.status(400).json({ error: "Invalid capacity" });
      }
      if (capacity !== null && event.rsvps.length > capacity) {
        return res.status(400).json({ error: "Capacity less than confirmed guests" });
      }
      updates.capacity = capacity;
    }

    if (points !== undefined && !isManagerOrAbove) {
      return res.status(403).json({ error: "Only managers can update points" });
    }
    
    if (points !== undefined) {
      const parsedPoints = parseInt(points);
      if (!Number.isInteger(parsedPoints) || parsedPoints < 0) {
        return res.status(400).json({ error: "Invalid points value" });
      }
    
      const awarded = event.pointsAwarded ?? 0;
      if (parsedPoints < awarded) {
        return res.status(400).json({ error: "Points cannot be less than awarded" });
      }
    
      updates.pointsRemain = parsedPoints - awarded;
    }
    
    if (published !== undefined) {
      if (!isManagerOrAbove) {
        return res.status(403).json({ error: "Only managers can publish events" });
      }
      const publishBool = published === true || published === "true";
      if (!publishBool) {
        return res.status(400).json({ error: "Published can only be set to true" });
      }
      updates.published = true;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updated = await prisma.event.update({
      where: { id: parseInt(eventId) },
      data: updates,
    });

    const response = {
      id: updated.id,
      name: updated.name,
      location: updated.location,
    };

    for (const key of Object.keys(updates)) {
      response[key] = updated[key];
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error updating event:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /events/:eventId
const deleteEventById = async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
  
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });
  
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
  
      if (event.published) {
        return res.status(400).json({ error: "Cannot delete a published event" });
      }
  
      await prisma.rSVP.deleteMany({ where: { eventId } });
      await prisma.organizer.deleteMany({ where: { eventId } });
  
      await prisma.event.delete({ where: { id: eventId } });
  
      return res.status(204).send();
    } catch (err) {
      console.error("Error deleting event:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
};

// POST events/:eventId/organizers
const addEventOrganizer = async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const { utorid } = req.body;

  if (!utorid || typeof utorid !== "string") {
    return res.status(400).json({ error: "utorid is required and must be a string" });
  }

  if (!req.user || !["MANAGER", "SUPERUSER"].includes(req.user.role?.toUpperCase())) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { rsvps: true, organizers: { include: { user: true } } },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const now = new Date();
    if (event.endTime < now) {
      return res.status(410).json({ error: "Event has already ended" });
    }

    const user = await prisma.user.findUnique({
      where: { utorid },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isGuest = await prisma.rSVP.findFirst({
      where: {
        userId: user.id,
        eventId: event.id,
      },
    });

    if (isGuest) {
      return res.status(400).json({ error: "User is currently a guest. Remove them as guest first." });
    }

    const alreadyOrganizer = await prisma.organizer.findFirst({
      where: {
        userId: user.id,
        eventId: event.id,
      },
    });

    if (!alreadyOrganizer) {
      await prisma.organizer.create({
        data: {
          userId: user.id,
          eventId: event.id,
        },
      });
    }

    const updatedOrganizers = await prisma.organizer.findMany({
      where: { eventId },
      include: { user: true },
    });

    const organizerInfo = updatedOrganizers.map(o => ({
      id: o.user.id,
      utorid: o.user.utorid,
      name: o.user.name,
    }));

    return res.status(201).json({
      id: event.id,
      name: event.name,
      location: event.location,
      organizers: organizerInfo,
    });
  } catch (err) {
    console.error("Error adding organizer:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const removeEventOrganizer = async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    const userId = parseInt(req.params.userId);
    
    if (isNaN(eventId) || isNaN(userId)) {
      return res.status(400).json({ error: "Invalid event ID or user ID" });
    }
  
    try {
      await prisma.organizer.delete({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
      });
  
      return res.status(204).send();
    } catch (err) {
      console.error("Failed to remove organizer:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
};

const addEventGuest = async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const { utorid } = req.body;
  const requester = req.user;

  if (!utorid) {
    return res.status(400).json({ error: "Missing utorid" });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizers: true,
        rsvps: true,
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const now = new Date();
    if (
      event.endTime <= now ||
      (event.capacity !== null && event.rsvps.length >= event.capacity)
    ) {
      return res.status(410).json({ error: "Event is full or has ended" });
    }

    const isOrganizer = await prisma.organizer.findUnique({
      where: {
        userId_eventId: {
          userId: requester.id,
          eventId,
        },
      },
    });

    const isManagerOrSuperuser = ["MANAGER", "SUPERUSER"].includes(requester.role);

    if (!isManagerOrSuperuser && !isOrganizer) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const guest = await prisma.user.findUnique({
      where: { utorid },
    });

    if (!guest) {
      return res.status(404).json({ error: "User not found" });
    }

    const isAlreadyOrganizer = await prisma.organizer.findUnique({
      where: {
        userId_eventId: {
          userId: guest.id,
          eventId,
        },
      },
    });

    if (isAlreadyOrganizer) {
      return res.status(400).json({ error: "User is an organizer" });
    }

    await prisma.rSVP.create({
      data: {
        userId: guest.id,
        eventId: event.id,
      },
    });

    const updatedGuestCount = await prisma.rSVP.count({
      where: { eventId },
    });

    return res.status(201).json({
      id: event.id,
      name: event.name,
      location: event.location,
      guestAdded: {
        id: guest.id,
        utorid: guest.utorid,
        name: guest.name,
      },
      numGuests: updatedGuestCount,
    });
  } catch (err) {
    console.error("Error adding guest:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const removeEventGuest = async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    const userId = parseInt(req.params.userId);
    const requester = req.user;
    
    if (!["MANAGER", "SUPERUSER"].includes(requester.role)) {
      return res.status(403).json({ error: "Only managers or higher can remove guests" });
    }
  
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });
  
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
  
      const rsvp = await prisma.rSVP.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
      });
  
      if (!rsvp) {
        return res.status(404).json({ error: "Guest not found for this event" });
      }
  
      await prisma.rSVP.delete({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
      });
  
      return res.status(204).send();
    } catch (err) {
      console.error("Error removing guest:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
};


const joinEventAsGuest = async (req, res) => {
    const userId = req.user?.id;
    const eventId = parseInt(req.params.eventId);
  
    if (!userId || isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid user or event ID" });
    }
  
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          rsvps: true,
          organizers: true,
        },
      });
  
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
  
      const now = new Date();
      if (event.endTime <= now || (event.capacity !== null && event.rsvps.length >= event.capacity)) {
        return res.status(410).json({ error: "Event has ended or is full" });
      }
  
      if (!event.published) {
        return res.status(404).json({ error: "Event not published" });
      }
  
      const alreadyRSVPed = event.rsvps.some(r => r.userId === userId);
      if (alreadyRSVPed) {
        return res.status(400).json({ error: "User already RSVP'd" });
      }
  
      await prisma.rSVP.create({
        data: {
          eventId,
          userId,
        },
      });
  
      const user = await prisma.user.findUnique({ where: { id: userId } });
  
      return res.status(201).json({
        id: event.id,
        name: event.name,
        location: event.location,
        guestAdded: {
          id: user.id,
          utorid: user.utorid,
          name: user.name,
        },
        numGuests: event.rsvps.length + 1,
      });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  
  const leaveEventAsGuest = async (req, res) => {
    const userId = req.user?.id;
    const role = req.user?.role?.toUpperCase();
    const eventId = parseInt(req.params.eventId);
  
    if (role !== "REGULAR") {
      return res.status(403).json({ error: "Forbidden" });
    }
  
    if (!userId || isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid user or event ID" });
    }
  
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });
  
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
  
      const now = new Date();
      if (event.endTime <= now) {
        return res.status(410).json({ error: "Event has ended" });
      }
  
      const rsvp = await prisma.rSVP.findFirst({
        where: { eventId, userId },
      });
  
      if (!rsvp) {
        return res.status(404).json({ error: "User not RSVP'd to this event" });
      }
  
      await prisma.rSVP.delete({
        where: { id: rsvp.id },
      });
  
      return res.status(204).send();
    } catch (err) {
      console.error("Error in leaveEventAsGuest:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
      
const createEventTransaction = async (req, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role?.toUpperCase();
    const eventId = parseInt(req.params.eventId);
    const { type, utorid, amount, remark } = req.body;
    
    if (!["MANAGER", "SUPERUSER", "CASHIER", "REGULAR", "ORGANIZER"].includes(userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
  
    if (!type || type !== "event") {
      return res.status(400).json({ error: "Invalid type, must be 'event'" });
    }
  
    if (!amount || typeof amount !== "number" || amount <= 0 || !Number.isInteger(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }
  
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
  
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          rsvps: { include: { user: true } },
          organizers: true,
        },
      });
  
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
  
      const isOrganizer = event.organizers.some(org => org.userId === userId);
      const isManagerOrAbove = ["MANAGER", "SUPERUSER"].includes(userRole);
      if (!isOrganizer && !isManagerOrAbove) {
        return res.status(403).json({ error: "Not authorized to award points for this event" });
      }
  
      const creator = await prisma.user.findUnique({
        where: { id: userId },
      });
  
      const createdBy = creator.utorid;
  
      if (utorid) {
        const guest = event.rsvps.find(r => r.user.utorid === utorid);
        if (!guest) {
          return res.status(400).json({ error: "User is not a guest of the event" });
        }
  
        if (event.pointsRemain < amount) {
          return res.status(400).json({ error: "Not enough remaining points" });
        }
  
        const transaction = await prisma.transaction.create({
          data: {
            type: "event",
            amount,
            remark,
            userId: guest.userId,
            createdBy,
            relatedId: eventId,
          },
        });
  
        await prisma.user.update({
          where: { id: guest.userId },
          data: { points: { increment: amount } },
        });
  
        await prisma.event.update({
          where: { id: eventId },
          data: {
            pointsRemain: { decrement: amount },
            pointsAwarded: { increment: amount },
          },
        });
  
        return res.status(201).json({
          id: transaction.id,
          recipient: guest.user.utorid,
          awarded: amount,
          type: "event",
          relatedId: eventId,
          remark,
          createdBy,
        });
      }
  
      const totalNeeded = amount * event.rsvps.length;
  
      if (event.pointsRemain < totalNeeded) {
        return res.status(400).json({ error: "Not enough remaining points for all guests" });
      }
  
      const transactions = [];
      for (const rsvp of event.rsvps) {
        const trx = await prisma.transaction.create({
          data: {
            type: "event",
            amount,
            remark,
            userId: rsvp.userId,
            createdBy,
            relatedId: eventId,
          },
        });
  
        await prisma.user.update({
          where: { id: rsvp.userId },
          data: { points: { increment: amount } },
        });
  
        transactions.push({
          id: trx.id,
          recipient: rsvp.user.utorid,
          awarded: amount,
          type: "event",
          relatedId: eventId,
          remark,
          createdBy,
        });
      }
  
      await prisma.event.update({
        where: { id: eventId },
        data: {
          pointsRemain: { decrement: totalNeeded },
          pointsAwarded: { increment: totalNeeded },
        },
      });
  
      return res.status(201).json(transactions);
    } catch (err) {
      console.error("Error creating event transaction:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
};
  
  
module.exports = {
  createEvent, 
  getEvents, 
  getEventById, 
  patchEventById, 
  deleteEventById, 
  addEventOrganizer, 
  removeEventOrganizer, 
  addEventGuest, 
  removeEventGuest,
  joinEventAsGuest,
  leaveEventAsGuest,
  createEventTransaction
};
