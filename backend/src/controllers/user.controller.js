const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, role, dealer_id } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if username exists
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: 'username already exists' });
    }

    // Check if email exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: 'email already exists' });
    }

    // Check if dealer_id exists (if registering as dealer)
    if (role === 'dealer' && dealer_id) {
      const existingDealerId = await User.findByDealerId(dealer_id);
      if (existingDealerId) {
        return res.status(400).json({ message: 'dealer ID already exists' });
      }
    }

    // Create user
    const userId = await User.create({
      username,
      email,
      password,
      role: role || 'client',
      dealer_id: role === 'dealer' ? dealer_id : null
    });

    res.status(201).json({
      message: 'User registered successfully',
      userId,
      dealer_id: dealer_id || null
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user with complete data
    const user = await User.findByEmail(email);
    console.log('Found user:', user);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get fresh user data with all fields
    const userData = await User.findById(user.id);
    if (!userData) {
      return res.status(404).json({ message: 'User data not found' });
    }

    // Generate token
    const token = jwt.sign(
      { id: userData.id, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Sending complete user data:', userData);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        dealer_id: userData.dealer_id,
        dealership_name: userData.dealership_name,
        full_name: userData.full_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Error during login',
      error: error.message
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    console.log('Update Profile Request Received');
    console.log('Request User:', req.user);
    console.log('Request Body:', req.body);

    const { 
      username, 
      email, 
      dealershipName, 
      phone, 
      full_name 
    } = req.body;
    const userId = req.user.id;

    console.log('Extracted User ID:', userId);

    // Validate input
    if (!username || username.length < 3) {
      console.log('Username validation failed');
      return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }

    // Prepare update data
    const updateData = {
      username,
      ...(email && { email }),
      ...(dealershipName && { dealership_name: dealershipName }),
      ...(phone && { phone }),
      ...(full_name && { full_name })
    };

    console.log('Update Data:', updateData);

    // Perform update
    const updated = await User.update(userId, updateData);
    console.log('Update Result:', updated);

    if (!updated) {
      console.log('User not found or update failed');
      return res.status(404).json({ message: 'User not found or update failed' });
    }

    // Fetch and return updated user profile
    const updatedUser = await User.findById(userId);
    console.log('Updated User:', updatedUser);
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        dealershipName: updatedUser.dealership_name,
        phone: updatedUser.phone,
        fullName: updatedUser.full_name
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      message: 'Error updating profile',
      error: error.message,
      stack: error.stack
    });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ users });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching users',
      error: error.message
    });
  }
};