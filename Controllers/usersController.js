const User = require('../Models/users');

async function handleAddUser(req, res) {
  try {
    const newUserData = req.body;
    const result = await User.addUser(newUserData);
    res.status(201).json({
      message: 'You create account successfully! login now',
      userId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error ', error: error });
  }
}

// user login handller
async function handleLogin(req, res) {
  try {
    const { email, pass } = req.body;
    const user = await User.findUserByEmailAndPass(email, pass);

    if (user) {
      res.status(200).json({ 
        success: true, 
        message: "Login successful!", 
        name: user.name,
        userId: user._id.toString()
        });
    } else {
      res.status(401).json({ success: false, message: "You don't have an account!" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
}

module.exports = {
    handleAddUser,
    handleLogin
};