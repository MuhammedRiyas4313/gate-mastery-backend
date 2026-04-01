const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Revision = require('../models/Revision');
const DPP = require('../models/DPP');
const PYQ = require('../models/PYQ');
const TestSeries = require('../models/TestSeries');
const QuizSession = require('../models/QuizSession');
const Exam = require('../models/Exam');
const { trackAttendance } = require('../utils/attendanceTracker');

const getDashboard = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);


    // Set up IST-aware today and endOfToday
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Update Attendance & Streak
    const streak = await trackAttendance(userId);

    // 2. Dashboard Aggregation
    const results = await User.aggregate([
      { $match: { _id: userId } },
      {
        $facet: {
          // Upcoming Exams
          upcomingExams: [
            {
              $lookup: {
                from: 'exams',
                let: { uId: userId },
                pipeline: [
                  { $match: { $expr: { $and: [{ $eq: ['$user', '$$uId'] }, { $eq: ['$active', true] }] } } },
                  { $sort: { date: 1 } }
                ],
                as: 'exams'
              }
            },
            { $unwind: '$exams' },
            { $replaceRoot: { newRoot: '$exams' } },
            {
              $addFields: {
                daysLeft: {
                  $ceil: {
                    $divide: [
                      { $subtract: ['$date', new Date()] },
                      1000 * 60 * 60 * 24
                    ]
                  }
                }
              }
            }
          ],

          // Subject Progress
          subjectProgress: [
            {
              $lookup: {
                from: 'subjects',
                let: { uId: userId },
                pipeline: [
                  { $match: { $expr: { $eq: ['$user', '$$uId'] } } }
                ],
                as: 'subs'
              }
            },
            { $unwind: '$subs' },
            {
              $lookup: {
                from: 'chapters',
                localField: 'subs._id',
                foreignField: 'subject',
                as: 'chaps'
              }
            },
            {
              $project: {
                _id: '$subs._id',
                name: '$subs.name',
                color: '$subs.color',
                icon: { $ifNull: ['$subs.icon', '📚'] },
                totalChapters: { $size: { $ifNull: ['$chaps', []] } },
                completedChapters: {
                  $size: {
                    $filter: {
                      input: { $ifNull: ['$chaps', []] },
                      as: 'chap',
                      cond: { $eq: ['$$chap.status', 'complete'] }
                    }
                  }
                }
              }
            },
            {
              $addFields: {
                percent: {
                  $cond: {
                    if: { $gt: ['$totalChapters', 0] },
                    then: { $round: [{ $multiply: [{ $divide: ['$completedChapters', '$totalChapters'] }, 100] }, 0] },
                    else: 0
                  }
                }
              }
            }
          ],

          // Pending Activities
          pendingActivities: [
            {
              $lookup: {
                from: 'revisions',
                let: { uId: userId },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$user', '$$uId'] },
                          { $in: ['$status', ['PENDING', 'ONGOING', 'SNOOZED']] }
                        ]
                      }
                    }
                  }
                ],
                as: 'revisions'
              }
            },
            {
              $lookup: {
                from: 'dpps',
                let: { uId: userId },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$user', '$$uId'] },
                          { $in: ['$status', ['PENDING', 'ONGOING']] }
                        ]
                      }
                    }
                  }
                ],
                as: 'dpps'
              }
            },
            {
              $lookup: {
                from: 'pyqs',
                let: { uId: userId },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$user', '$$uId'] },
                          { $ne: ['$status', 'COMPLETED'] }
                        ]
                      }
                    }
                  }
                ],
                as: 'pyqs'
              }
            },
            {
              $lookup: {
                from: 'testseries',
                let: { uId: userId },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$user', '$$uId'] },
                          { $in: ['$status', ['PENDING', 'ONGOING']] }
                        ]
                      }
                    }
                  }
                ],
                as: 'tests'
              }
            },
            {
              $lookup: {
                from: 'quizsessions',
                let: { uId: userId },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$user', '$$uId'] },
                          { $in: ['$status', ['PENDING', 'ONGOING']] }
                        ]
                      }
                    }
                  }
                ],
                as: 'quizSessions'
              }
            },
            {
              $project: {
                revisionsCount: {
                  $reduce: {
                    input: { $ifNull: ['$revisions', []] },
                    initialValue: 0,
                    in: {
                      $add: [
                        '$$value',
                        { $max: [1, { $size: { $ifNull: ['$$this.tags', []] } }] }
                      ]
                    }
                  }
                },
                dppsCount: { $size: { $ifNull: ['$dpps', []] } },
                pyqsCount: { $size: { $ifNull: ['$pyqs', []] } },
                testsCount: { $size: { $ifNull: ['$tests', []] } },
                quizzesCount: { $size: { $ifNull: ['$quizSessions', []] } },
                totalPending: {
                  $add: [
                    {
                      $reduce: {
                        input: { $ifNull: ['$revisions', []] },
                        initialValue: 0,
                        in: {
                          $add: [
                            '$$value',
                            { $max: [1, { $size: { $ifNull: ['$$this.tags', []] } }] }
                          ]
                        }
                      }
                    },
                    { $size: { $ifNull: ['$dpps', []] } },
                    { $size: { $ifNull: ['$pyqs', []] } },
                    { $size: { $ifNull: ['$tests', []] } },
                    { $size: { $ifNull: ['$quizSessions', []] } }
                  ]
                }
              }
            }
          ],

          // Topics completed today
          topicsCompletedToday: [
            {
              $lookup: {
                from: 'subjects',
                let: { uId: userId },
                pipeline: [
                  { $match: { $expr: { $eq: ['$user', '$$uId'] } } }
                ],
                as: 'subs'
              }
            },
            { $unwind: '$subs' },
            {
              $lookup: {
                from: 'topics',
                let: { subId: '$subs._id', start: today, end: endOfToday },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$subject', '$$subId'] },
                          { $gte: ['$updatedAt', '$$start'] },
                          { $lte: ['$updatedAt', '$$end'] },
                          { $eq: ['$status', 'complete'] }
                        ]
                      }
                    }
                  }
                ],
                as: 'todaysTopics'
              }
            },
            { $unwind: '$todaysTopics' },
            { $replaceRoot: { newRoot: '$todaysTopics' } }
          ],

          user: [{ $project: { name: 1, email: 1 } }]
        }
      }
    ]);

    const dashboardData = results[0];
    const upcomingExams = dashboardData?.upcomingExams || [];
    const primaryExam = upcomingExams[0];
    const gateCountdownDays = primaryExam ? primaryExam.daysLeft : 316;

    // 3. Activity Heatmap
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 168);

    const [revActivities, pyqActivities, testActivities, topicActivities, dppActivities] = await Promise.all([
      Revision.find({ user: userId, updatedAt: { $gte: sixMonthsAgo }, status: 'COMPLETED' }),
      PYQ.find({ user: userId, updatedAt: { $gte: sixMonthsAgo }, status: 'COMPLETED' }),
      TestSeries.find({ user: userId, updatedAt: { $gte: sixMonthsAgo }, status: 'COMPLETED' }),
      Topic.find({ subject: { $in: (dashboardData?.subjectProgress || []).map(s => s._id) }, updatedAt: { $gte: sixMonthsAgo }, status: 'complete' }),
      DPP.find({ user: userId, updatedAt: { $gte: sixMonthsAgo }, status: 'COMPLETED' })
    ]);

    const activityMap = {};
    const processItems = (items) => items.forEach(item => {
      const dateSource = item.updatedAt || item.date || item.createdAt;
      const day = new Date(dateSource).toISOString().split('T')[0];
      activityMap[day] = (activityMap[day] || 0) + 1;
    });

    [revActivities, pyqActivities, testActivities, topicActivities, dppActivities].forEach(processItems);

    const activityHeatmap = Object.keys(activityMap).map(date => ({
      date,
      count: activityMap[date],
      level: Math.min(Math.ceil(activityMap[date] / 2), 4)
    }));

    res.json({
      todayISO: today.toISOString(),
      gateCountdownDays: gateCountdownDays > 0 ? gateCountdownDays : 0,
      streak,
      upcomingExams: dashboardData?.upcomingExams || [],
      subjectProgress: dashboardData?.subjectProgress || [],
      pendingSummary: dashboardData?.pendingActivities[0] || { totalPending: 0, revisionsCount: 0, dppsCount: 0, pyqsCount: 0, testsCount: 0, quizzesCount: 0 },
      topicsCompletedToday: dashboardData?.topicsCompletedToday || [],
      user: dashboardData?.user[0] || { name: 'Commander' },
      activityHeatmap,

      revisionsToday: await Revision.find({ user: userId, date: { $lte: endOfToday }, status: { $in: ['PENDING', 'ONGOING', 'SNOOZED'] } }).limit(10).populate('tags.subject tags.chapter tags.topic'),
      dppsToday: await DPP.find({ user: userId, date: { $lte: endOfToday }, status: { $in: ['PENDING', 'ONGOING'] } }).limit(5).populate('tags.subject tags.chapter tags.topic'),
      pyqsToday: await PYQ.find({ user: userId, $or: [{ date: { $lte: endOfToday }, status: { $ne: 'COMPLETED' } }, { updatedAt: { $gte: today, $lte: endOfToday } }] }).limit(5).populate('subject chapter topic'),
      testsToday: await TestSeries.find({ user: userId, date: { $lte: endOfToday }, status: { $in: ['PENDING', 'ONGOING'] } }).limit(5).populate('subject chapter'),
      quizzesToday: await QuizSession.find({ user: userId, date: { $lte: endOfToday }, status: { $in: ['PENDING', 'ONGOING'] } }).limit(5).populate('quizzes.subject quizzes.chapter quizzes.topic')
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboard };
