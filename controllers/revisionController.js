const Revision = require('../models/Revision');

// @desc    Get all Revisions for a user
// @route   GET /api/revisions
const getRevisions = async (req, res) => {
  try {
    const { status, subjectId, chapterId, sortBy } = req.query;

    // Ensure today's DAILY revision exists (IST-aware)
    const now = new Date();
    const istDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const startOfToday = new Date(istDateStr);
    const endOfToday = new Date(istDateStr);
    endOfToday.setHours(23, 59, 59, 999);

    const todayRevision = await Revision.findOne({
      user: req.user._id,
      date: { $gte: startOfToday, $lte: endOfToday },
      type: 'DAILY'
    });

    if (!todayRevision) {
      await Revision.create({
        user: req.user._id,
        date: startOfToday,
        type: 'DAILY',
        status: 'PENDING'
      });
    }

    // Build dynamic filter
    const filter = { user: req.user._id };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (subjectId && subjectId !== 'all') {
      const tagMatch = { subject: subjectId };
      if (chapterId && chapterId !== 'all') {
        tagMatch.chapter = chapterId;
      }
      filter.tags = { $elemMatch: tagMatch };
    }

    let sortObj = { createdAt: -1 };
    if (sortBy === 'date') {
      sortObj = { date: -1 };
    }

    const revisions = await Revision.find(filter)
      .populate('tags.subject tags.chapter tags.topic')
      .sort(sortObj);

    res.json(revisions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// @desc    Update or create a Revision for a date
// @route   PUT /api/revisions
const updateRevision = async (req, res) => {
  const { date, status, notes, tags, id, createNew } = req.body;
  
  try {
    let rev;
    if (id) {
       rev = await Revision.findById(id);
    } else if (!createNew) {
       const startOfDay = new Date(date);
       startOfDay.setHours(0, 0, 0, 0);
       const endOfDay = new Date(date);
       endOfDay.setHours(23, 59, 59, 999);
       rev = await Revision.findOne({ user: req.user._id, date: { $gte: startOfDay, $lte: endOfDay } });
    }

    if (rev) {
       rev.status = status || rev.status;
       rev.notes = notes !== undefined ? notes : rev.notes;
       if (tags) rev.tags = tags;
       const saved = await rev.save();

       // Provide recursive logic for chapter_auto if needed, but since it's daily, 
       // let's just save and return. Chapter completion now creates specific revision records.
       return res.json(saved);
    } else {
       const newRev = await Revision.create({
         user: req.user._id,
         date: new Date(date),
         status: status || 'PENDING',
         notes,
         tags
       });
       return res.status(201).json(newRev);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Delete a Revision
// @route   DELETE /api/revisions/:id
const deleteRevision = async (req, res) => {
  try {
    const rev = await Revision.findById(req.params.id);
    if (!rev) {
      return res.status(404).json({ message: 'Revision not found' });
    }
    if (rev.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await rev.deleteOne();
    res.json({ message: 'Revision removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRevisions, updateRevision, deleteRevision };
