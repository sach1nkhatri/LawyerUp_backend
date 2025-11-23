const express = require('express');
const router = express.Router();
const Lawyer = require('../models/Lawyer');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const upload = require('../middleware/uploadMiddleware'); 



// 🔍 GET: Fetch a lawyer by email or phone
router.get('/by-user', async (req, res) => {
  try {
    const { email, contactNumber } = req.query;
    if (!email && !contactNumber) {
      return res.status(400).json({ message: 'Email or contactNumber is required' });
    }

    const lawyer = await Lawyer.findOne({
      $or: [
        email ? { email } : {},
        contactNumber ? { phone: contactNumber } : {},
      ],
    });

    if (!lawyer) {
      return res.status(404).json({ message: 'No lawyer application found.' });
    }

    res.status(200).json(lawyer);
  } catch (err) {
    console.error('Error in GET /by-user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✍️ POST: Create new lawyer application
router.post('/', auth, upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'licenseFile', maxCount: 1 },
]), async (req, res) => {
  try {
    const data = req.body;

    const newLawyer = new Lawyer({
      ...data,
      user: req.user._id,
      status: 'pending',
      profilePhoto: `/uploads/lawyers/photo/${req.files.profilePhoto?.[0]?.filename}`.replace(/\\/g, '/'),
      licenseFile: `/uploads/lawyers/license/${req.files.licenseFile?.[0]?.filename}`,
      schedule: typeof data.schedule === 'string' ? JSON.parse(data.schedule) : data.schedule,
      education: JSON.parse(data.education || '[]'),
      workExperience: JSON.parse(data.workExperience || '[]'),
    });

    await newLawyer.save();
    res.status(201).json(newLawyer);
  } catch (err) {
    console.error('Error creating lawyer with files:', err);
    res.status(500).json({ message: 'Failed to create lawyer profile' });
  }
});


// 🛠 PUT: Update lawyer by ID
router.put('/:id', auth, upload.single('profilePhoto'), async (req, res) => {
  try {
    const updates = {
      ...req.body,
      education: JSON.parse(req.body.education || '[]'),
      workExperience: JSON.parse(req.body.workExperience || '[]'),
      schedule: JSON.parse(req.body.schedule || '{}'),
    };

    if (req.file) {
      updates.profilePhoto = `/uploads/lawyers/photo/${req.file.filename}`.replace(/\\/g, '/');
    }
    

    const updated = await Lawyer.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!updated) return res.status(404).json({ message: 'Lawyer not found' });

    res.json(updated);
  } catch (err) {
    console.error('Error saving lawyer profile:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});


// ❌ DELETE: Remove lawyer by ID
router.delete('/:id', async (req, res) => {
  try {
    const removed = await Lawyer.findByIdAndDelete(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }
    res.json({ message: 'Lawyer deleted successfully' });
  } catch (err) {
    console.error('Error deleting lawyer:', err);
    res.status(500).json({ message: 'Failed to delete lawyer' });
  }
});

// ✅ GET: All lawyers (for admin)
router.get('/', async (req, res) => {
  try {
    const lawyers = await Lawyer.find();
    res.status(200).json(lawyers);
  } catch (err) {
    console.error('Error fetching all lawyers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ PATCH: Update lawyer status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedLawyer = await Lawyer.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedLawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    res.json({ message: `Status updated to ${status}`, data: updatedLawyer });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔐 GET: Current user's lawyer profile
router.get('/me', auth, async (req, res) => {
  try {
    const lawyer = await Lawyer.findOne({ user: req.user._id })
      .populate('user', 'fullName email contactNumber');

    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    res.status(200).json(lawyer);
  } catch (err) {
    console.error('Error fetching current lawyer:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
