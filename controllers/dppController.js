const DPP = require('../models/DPP');

// @desc    Get all DPPs for a user
// @route   GET /api/dpp
const getDPPs = async (req, res) => {
  try {
    const { status, subjectId, chapterId } = req.query;

    // Ensure today's DPP exists (IST-aware)
    const now = new Date();
    const istDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const startOfToday = new Date(istDateStr);
    const endOfToday = new Date(istDateStr);
    endOfToday.setHours(23, 59, 59, 999);

    const todayDPP = await DPP.findOne({
      user: req.user._id,
      date: { $gte: startOfToday, $lte: endOfToday }
    });

    if (!todayDPP) {
      await DPP.create({
        user: req.user._id,
        date: startOfToday,
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

    const dpps = await DPP.find(filter)
      .populate('tags.subject tags.chapter tags.topic')
      .sort({ date: -1 });

    res.json(dpps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// @desc    Update or create a DPP for a date
// @route   PUT /api/dpp
const updateDPP = async (req, res) => {
  const { date, status, notes, tags, id } = req.body;
  
  try {
    let dpp;
    if (id) {
       dpp = await DPP.findById(id);
    } else if (!req.body.createNew) {
       const startOfDay = new Date(date);
       startOfDay.setHours(0, 0, 0, 0);
       const endOfDay = new Date(date);
       endOfDay.setHours(23, 59, 59, 999);
       dpp = await DPP.findOne({ user: req.user._id, date: { $gte: startOfDay, $lte: endOfDay } });
    }

    if (dpp) {
       dpp.status = status || dpp.status;
       dpp.notes = notes !== undefined ? notes : dpp.notes;
       if (tags) dpp.tags = tags;
       const saved = await dpp.save();
       return res.json(saved);
    } else {
       const newDPP = await DPP.create({
         user: req.user._id,
         date: new Date(date),
         status: status || 'PENDING',
         notes,
         tags
       });
       return res.status(201).json(newDPP);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a DPP

// @route   DELETE /api/dpp/:id
const deleteDPP = async (req, res) => {
  try {
    const dpp = await DPP.findById(req.params.id);
    if (!dpp) {
      return res.status(404).json({ message: 'DPP not found' });
    }
    if (dpp.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await dpp.deleteOne();
    res.json({ message: 'DPP removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDPPs, updateDPP, deleteDPP };

