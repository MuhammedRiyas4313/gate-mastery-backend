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
    const subjects = await Subject.find({ user: req.user._id })
      .select('name icon color')
      .lean();
    
    const chapters = await Chapter.find({ user: req.user._id })
      .select('name subject')
      .lean();

    const subjectMap = {};
    const chapterMap = {};

    subjects.forEach(s => {
      subjectMap[s._id.toString()] = { ...s };
    });

    chapters.forEach(c => {
      chapterMap[c._id.toString()] = c.name;
    });

    const sessions = await StudySession.find({ user: req.user._id }).lean();

    const dailyMap = {};
    sessions.forEach(session => {
        // Ensure local date formatting roughly matches user expectations
        const validTime = session.startTime || session.createdAt || new Date();
        const d = new Date(validTime);
        if (isNaN(d.getTime())) { d.setTime(Date.now()); } // Extra safety
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        const dateStr = d.toISOString().split('T')[0]; // "YYYY-MM-DD"
        if (!dailyMap[dateStr]) {
            dailyMap[dateStr] = {
                date: dateStr,
                totalSeconds: 0,
                untaggedSeconds: 0,
                subjects: {}
            };
        }
        
        dailyMap[dateStr].totalSeconds += session.duration;
        
        if (!session.subject) {
            dailyMap[dateStr].untaggedSeconds += session.duration;
        } else {
            const sid = session.subject.toString();
            if (!dailyMap[dateStr].subjects[sid]) {
                dailyMap[dateStr].subjects[sid] = {
                    _id: sid,
                    name: subjectMap[sid]?.name || 'Unknown',
                    icon: subjectMap[sid]?.icon || '📚',
                    color: subjectMap[sid]?.color || '#ec4899',
                    totalStudySeconds: 0,
                    chapters: {}
                };
            }
            dailyMap[dateStr].subjects[sid].totalStudySeconds += session.duration;

            if (session.chapter) {
                const cid = session.chapter.toString();
                if (!dailyMap[dateStr].subjects[sid].chapters[cid]) {
                     dailyMap[dateStr].subjects[sid].chapters[cid] = {
                         _id: cid,
                         name: chapterMap[cid] || 'Unknown',
                         totalStudySeconds: 0
                     };
                }
                dailyMap[dateStr].subjects[sid].chapters[cid].totalStudySeconds += session.duration;
            }
        }
    });

    const resultDaily = Object.values(dailyMap).map(day => {
        const subjectsArray = Object.values(day.subjects).map(s => {
           return { 
               ...s, 
               chapters: Object.values(s.chapters).sort((a,b) => b.totalStudySeconds - a.totalStudySeconds) 
           };
        }).sort((a,b) => b.totalStudySeconds - a.totalStudySeconds);

        return {
           date: day.date,
           totalSeconds: day.totalSeconds,
           untaggedSeconds: day.untaggedSeconds,
           subjects: subjectsArray
        };
    });

    // Sort descending by date
    resultDaily.sort((a,b) => b.date.localeCompare(a.date));

    // Calculate allTime
    let allTimeTotal = 0;
    let allTimeUntagged = 0;
    const allTimeSubjectsMap = {};

    sessions.forEach(session => {
        allTimeTotal += session.duration;
        if (!session.subject) {
            allTimeUntagged += session.duration;
        } else {
            const sid = session.subject.toString();
            if (!allTimeSubjectsMap[sid]) {
                allTimeSubjectsMap[sid] = {
                    _id: sid,
                    name: subjectMap[sid]?.name || 'Unknown',
                    icon: subjectMap[sid]?.icon || '📚',
                    color: subjectMap[sid]?.color || '#ec4899',
                    totalStudySeconds: 0,
                    chapters: {}
                };
            }
            allTimeSubjectsMap[sid].totalStudySeconds += session.duration;

            if (session.chapter) {
                const cid = session.chapter.toString();
                if (!allTimeSubjectsMap[sid].chapters[cid]) {
                     allTimeSubjectsMap[sid].chapters[cid] = {
                         _id: cid,
                         name: chapterMap[cid] || 'Unknown',
                         totalStudySeconds: 0
                     };
                }
                allTimeSubjectsMap[sid].chapters[cid].totalStudySeconds += session.duration;
            }
        }
    });

    const allTimeSubjectsArray = Object.values(allTimeSubjectsMap).map(s => {
       return { 
           ...s, 
           chapters: Object.values(s.chapters).sort((a,b) => b.totalStudySeconds - a.totalStudySeconds) 
       };
    }).sort((a,b) => b.totalStudySeconds - a.totalStudySeconds);

    res.json({
        allTime: {
            totalSeconds: allTimeTotal,
            untaggedSeconds: allTimeUntagged,
            subjects: allTimeSubjectsArray
        },
        daily: resultDaily
    });
  } catch (error) {
    require('fs').appendFileSync('timer-error.log', '\n' + new Date().toISOString() + '\n' + error.stack + '\n');
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

module.exports = { saveSession, getStats };
