const { Router } = require("express");
const postModel = require("../models/post.model");
const { isValidObjectId } = require("mongoose");
const { body, validationResult } = require("express-validator");

const postRouter = Router();

const validatePost = [
  body("content").notEmpty().withMessage("Content is required"),
  body("title").notEmpty().withMessage("Title is required"),
];

postRouter.get('/', async (req, res) => {
    try {
        const posts = await postModel
            .find()
            .sort({ _id: -1 })
            .populate({ path: 'author', select: 'fullName email avatar' });
        
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: "Server error while fetching posts" });
    }
});

postRouter.post('/', validatePost, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { content, title } = req.body;
        const newPost = await postModel.create({
            content, 
            title, 
            author: req.userId
        });

        res.status(201).json({
            message: "Post created successfully",
            post: newPost
        });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ message: "Server error while creating post" });
    }
});

postRouter.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid post ID" });
        }

        const post = await postModel.findById(id)
            .populate({ path: 'author', select: 'fullName email avatar' });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json(post);
    } catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).json({ message: "Server error while fetching post" });
    }
});

postRouter.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid post ID" });
        }

        const post = await postModel.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== req.userId) {
            return res.status(403).json({ 
                message: 'You do not have permission to delete this post' 
            });
        }

        await postModel.findByIdAndDelete(id);
        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Server error while deleting post" });
    }
});

postRouter.put('/:id', validatePost, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid post ID" });
        }

        const post = await postModel.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== req.userId) {
            return res.status(403).json({ 
                message: 'You do not have permission to update this post' 
            });
        }

        const { title, content } = req.body;
        const updatedPost = await postModel.findByIdAndUpdate(
            id, 
            { title, content }, 
            { new: true, runValidators: true }
        ).populate({ path: 'author', select: 'fullName email avatar' });

        res.status(200).json({
            message: "Post updated successfully",
            post: updatedPost
        });
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).json({ message: "Server error while updating post" });
    }
});

postRouter.post('/:id/reactions', async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.body;
        const supportReactionType = ['like', 'dislike'];

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid post ID" });
        }

        if (!supportReactionType.includes(type)) {
            return res.status(400).json({ message: "Invalid reaction type" });
        }

        const post = await postModel.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const alreadyLikedIndex = post.reactions.likes.findIndex(
            el => el.toString() === req.userId
        );
        const alreadyDislikedIndex = post.reactions.dislikes.findIndex(
            el => el.toString() === req.userId
        );

        if (type === 'like') {
            if (alreadyLikedIndex !== -1) {
                post.reactions.likes.splice(alreadyLikedIndex, 1);
            } else {
                post.reactions.likes.push(req.userId);
                if (alreadyDislikedIndex !== -1) {
                    post.reactions.dislikes.splice(alreadyDislikedIndex, 1);
                }
            }
        } else if (type === 'dislike') {
            if (alreadyDislikedIndex !== -1) {
                post.reactions.dislikes.splice(alreadyDislikedIndex, 1);
            } else {
                post.reactions.dislikes.push(req.userId);
                if (alreadyLikedIndex !== -1) {
                    post.reactions.likes.splice(alreadyLikedIndex, 1);
                }
            }
        }

        await post.save();
        res.status(200).json({
            message: "Reaction updated successfully",
            post: await postModel.findById(id)
                .populate({ path: 'author', select: 'fullName email avatar' })
        });
    } catch (error) {
        console.error("Error updating reaction:", error);
        res.status(500).json({ message: "Server error while updating reaction" });
    }
});

module.exports = postRouter;