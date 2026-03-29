const Schedule = require('../models/Schedule');
const fs = require('fs');
const path = require('path');

exports.uploadSchedule = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { title, startDate, endDate } = req.body;
        
        if (!title || !startDate || !endDate) {
            // cleanup uploaded file if missing details
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Please provide title, start date and end date' });
        }

        const newSchedule = new Schedule({
            user: req.user.id,
            title,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            originalFileName: req.file.originalname,
            fileUrl: req.file.path // Cloudinary URL
        });

        await newSchedule.save();
        res.status(201).json(newSchedule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error saving schedule' });
    }
};

exports.getSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.find({ user: req.user.id })
            .sort({ createdAt: -1 }); 
            
        res.json(schedules);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching schedules' });
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findOne({ _id: req.params.id, user: req.user.id });
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        const { cloudinary } = require('../config/cloudinary');
        
        // Extract public_id from Cloudinary URL (e.g. https://res.cloudinary.com/.../gate-mastery/schedules/filename.ext)
        if (schedule.fileUrl && schedule.fileUrl.includes('cloudinary.com')) {
             const urlParts = schedule.fileUrl.split('/');
             const filenameParts = urlParts[urlParts.length - 1].split('.');
             const publicId = `gate-mastery/schedules/${filenameParts[0]}`;
             try {
                await cloudinary.uploader.destroy(publicId);
             } catch (cloudinaryErr) {
                console.error('Cloudinary deletion error:', cloudinaryErr);
             }
        }

        await Schedule.deleteOne({ _id: schedule._id });
        
        res.json({ message: 'Schedule removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error removing schedule' });
    }
};
