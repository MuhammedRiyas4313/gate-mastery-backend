const StudySession = require('../models/StudySession');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');

// @desc    Save a completed study session
// @route   POST /api/timer/session
const saveSession = async (req, res) => {
  const { subjectId, chapterId, duration, startTime, endTime } = req.body;

  try {
    // Save the study session (subjectId and chapterId are optional)
    const session = await StudySession.create({
      user: req.user._id,
      subject: (subjectId && subjectId.trim() !== "") ? subjectId : null,
      chapter: (chapterId && chapterId.trim() !== "") ? chapterId : null,
      duration,
      startTime,
      endTime
    });

    // Update totals
    if (chapterId && chapterId.trim() !== "") {
      const chapter = await Chapter.findById(chapterId);
      if (chapter) {
        // Increment chapter total
        chapter.totalStudySeconds += duration;
        await chapter.save();

        // Bubble up to subject total
        await Subject.findByIdAndUpdate(chapter.subject, {
          $inc: { totalStudySeconds: duration }
        });
      }
    } else if (subjectId && subjectId.trim() !== "") {
      // If ONLY subject is provided, increment it
      await Subject.findByIdAndUpdate(subjectId, {
        $inc: { totalStudySeconds: duration }
      });
    }

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get total study time stats (subjects + untagged)
// @route   GET /api/timer/stats
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Fetch metadata lookups (fast maps for hydration)
    const subjects = await Subject.find({ user: userId }).select('name icon color').lean();
    const subjectIds = subjects.map(s => s._id);
    const chapters = await Chapter.find({ subject: { $in: subjectIds } }).select('name subject').lean();

    const subjectMap = {};
    const chapterMap = {};
    subjects.forEach(s => subjectMap[s._id.toString()] = s);
    chapters.forEach(c => chapterMap[c._id.toString()] = c.name);

    // 2. Perform high-performance aggregation
    const aggregationResults = await StudySession.aggregate([
      { $match: { user: userId } },
      {
        $facet: {
          // Daily grouped by date, subject, and chapter
          daily: [
            {
              $group: {
                _id: {
                  date: { $dateToString: { format: "%Y-%m-%d", date: "$startTime", timezone: "+05:30" } },
                  subject: "$subject",
                  chapter: "$chapter"
                },
                duration: { $sum: "$duration" }
              }
            },
            { $sort: { "_id.date": -1 } }
          ],
          // All sessions (not grouped) for total sums and logs
          sessions: [
            { $sort: { startTime: -1 } },
            { $limit: 100 } // Limit slightly more for safety
          ]
        }
      }
    ]);

    const { daily, sessions: rawSessions } = aggregationResults[0];

    // 3. Process Daily and AllTime stats
    const dailyMap = {};
    const allTimeSubjectsMap = {};
    let allTimeTotal = 0;
    let allTimeUntagged = 0;

    daily.forEach(item => {
      const { date, subject, chapter } = item._id;
      const duration = item.duration;

      // Group into daily structure
      if (!dailyMap[date]) {
        dailyMap[date] = { date, totalSeconds: 0, untaggedSeconds: 0, subjects: {} };
      }
      dailyMap[date].totalSeconds += duration;

      // Process All-Time totals simultaneously
      allTimeTotal += duration;

      if (!subject) {
        dailyMap[date].untaggedSeconds += duration;
        allTimeUntagged += duration;
      } else {
        const sid = subject.toString();
        
        // Helper to ensure subject exists in a map
        const ensureSubject = (map, id) => {
          if (!map[id]) {
            const meta = subjectMap[id];
            map[id] = {
              _id: id,
              name: meta?.name || 'Unknown',
              icon: meta?.icon || '📚',
              color: meta?.color || '#ec4899',
              totalStudySeconds: 0,
              untaggedChapterSeconds: 0,
              chapters: {}
            };
          }
        };

        ensureSubject(dailyMap[date].subjects, sid);
        ensureSubject(allTimeSubjectsMap, sid);

        dailyMap[date].subjects[sid].totalStudySeconds += duration;
        allTimeSubjectsMap[sid].totalStudySeconds += duration;

        if (chapter) {
          const cid = chapter.toString();
          const ensureChapter = (subObj, id) => {
            if (!subObj.chapters[id]) {
              subObj.chapters[id] = { _id: id, name: chapterMap[id] || 'Unknown', totalStudySeconds: 0 };
            }
          };

          ensureChapter(dailyMap[date].subjects[sid], cid);
          ensureChapter(allTimeSubjectsMap[sid], cid);

          dailyMap[date].subjects[sid].chapters[cid].totalStudySeconds += duration;
          allTimeSubjectsMap[sid].chapters[cid].totalStudySeconds += duration;
        } else {
          dailyMap[date].subjects[sid].untaggedChapterSeconds += duration;
          allTimeSubjectsMap[sid].untaggedChapterSeconds += duration;
        }
      }
    });

    // 4. Transform maps to final arrays for the frontend
    const resultDaily = Object.values(dailyMap).map(day => ({
      ...day,
      subjects: Object.values(day.subjects)
        .sort((a,b) => b.totalStudySeconds - a.totalStudySeconds)
        .map(s => ({
          ...s,
          chapters: Object.values(s.chapters).sort((a,b) => b.totalStudySeconds - a.totalStudySeconds)
        }))
    })).sort((a,b) => b.date.localeCompare(a.date));

    const resultAllTime = {
      totalSeconds: allTimeTotal,
      untaggedSeconds: allTimeUntagged,
      subjects: Object.values(allTimeSubjectsMap)
        .sort((a,b) => b.totalStudySeconds - a.totalStudySeconds)
        .map(s => ({
          ...s,
          chapters: Object.values(s.chapters).sort((a,b) => b.totalStudySeconds - a.totalStudySeconds)
        }))
    };

    const resultSessions = rawSessions.map(session => {
        const sid = session.subject?.toString();
        const cid = session.chapter?.toString();
        return {
            _id: session._id,
            duration: session.duration,
            startTime: session.startTime,
            endTime: session.endTime,
            subject: sid ? { _id: sid, name: subjectMap[sid]?.name || 'Unknown', icon: subjectMap[sid]?.icon || '📚' } : null,
            chapter: cid ? { _id: cid, name: chapterMap[cid] || 'Unknown' } : null
        };
    });

    res.json({
      allTime: resultAllTime,
      daily: resultDaily,
      sessions: resultSessions
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { saveSession, getStats };
