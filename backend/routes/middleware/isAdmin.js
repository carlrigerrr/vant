const isAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.isAuthenticated()) {
      return res.status(401).json({ msg: 'Unauthorized: Not authenticated' });
    }

    // Check if user exists and has admin privileges
    if (!req.user || !req.user.admin) {
      return res.status(403).json({ msg: 'Forbidden: Admin access required' });
    }

    // User is authenticated and is admin, proceed
    next();
  } catch (error) {
    console.error('isAdmin middleware error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

module.exports = isAdmin;
