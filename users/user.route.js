const { Router } = require("express");
const userModel = require("../models/user.model");
const { upload, deleteFromCloudinary } = require("../config/cloudinary.config");

const userRouter = Router();

userRouter.get('/', async (req, res) => {
    try {
        const users = await userModel.find().sort({ _id: -1 }).select('-password');
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error while fetching users" });
    }
});

userRouter.put('/',
    upload.single('avatar'),
    async (req, res) => {
        const id = req.userId;
        const { email, fullName } = req.body;

   if (email !== undefined && !email.includes('@')) {
    return res.status(400).json({ message: "A valid email is required" });
}


        if (fullName !== undefined && fullName.trim() === '') {
            return res.status(400).json({ message: "Full name cannot be empty" });
        }

        const updateData = { email, fullName };

        try {
            if (req.file) {
                const user = await userModel.findById(id);

                if (user.avatar) {
                    const publicId = user.avatar.split('/').pop().split('.')[0];
                    await deleteFromCloudinary(`uploads/${publicId}`);
                }

                updateData.avatar = req.file.path;
            }

            const updatedUser = await userModel.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).select('-password');

            res.status(200).json({
                message: "User updated successfully",
                user: updatedUser
            });
        } catch (error) {
            console.error("Error updating user:", error);
            res.status(500).json({ message: "Server error while updating user" });
        }
    }
);

module.exports = userRouter;
