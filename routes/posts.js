const express = require("express");
const posts = require("../models/posts");
const { verifyToken, decodeToken } = require("../config/jwt");
const { getPosts, addPost, addComment } = require("../config/dbops");
const uploads = require("../config/fileupload");
const { put } = require("got");

const router = express.Router();

router.get("/dashboard", verifyToken, (req, res) => {
  res.json({
    message: "authenticated successfully",
  });
});

router.post("/addpost", verifyToken, uploads.single("image"), (req, res) => {
  const username = decodeToken(req.cookies["jwt-token"]);
  const post = req.body.post;
  if (!post || !req.file) {
    res.status(403).json({ error: "Please enter post" });
  } else {
    const imgname1 = `${Date.now()}_${req.file.originalname}`;
    const addtoDB = addPost(username, post, imgname1);
    res.status(200).json({ message: "Post successful" });
  }
});

router.get("/posts", verifyToken, (req, res) => {
  posts
    .find()
    .then((posts) => {
      if (posts) {
        res.status(200).json({ posts: posts });
      } else {
        res.status(404).json({ error: "not found" });
      }
    })
    .catch((err) => res.status(403).json({ error: err }));
});

router.get("/posts/:id", verifyToken, (req, res) => {
  var id = req.params.id;
  posts
    .findById(id)
    .then((posts) => {
      if (posts) {
        res.status(200).json({ posts: posts });
      } else {
        res.status(404).json({ error: "not found" });
      }
    })
    .catch((err) => res.status(403).json({ error: err }));
});

router.post("/posts/:id", verifyToken, (req, res) => {
  const username = decodeToken(req.cookies["jwt-token"]);
  const id = req.params.id;
  const like = req.body.like;
  const comments = req.body.comment;
  if (!comments) {
    res.status(400).json({ error: "Please enter comment" });
  } else {
    posts
      .findById(id)
      .then((post) => {
        const newComment = { user: username, comment: comments };
        const oldComments = post.comment;
        oldComments.push(newComment);
        if (post) {
          const newLike = username;
          const oldLikes = post.likedby;
          oldLikes.push(newLike);
          addComment(id, like, oldComments, oldLikes);
          res.status(200).json({ comment: "Posted" });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

router.get("/myposts", verifyToken, (req, res) => {
  const username = decodeToken(req.cookies["jwt-token"]);
  posts
    .findOne({ uname: username })
    .then((post) => {
      if (post) {
        res.status(200).json({ postsbyme: post });
      } else {
        res.status(404).json({ error: "NO posts available" });
      }
    })
    .catch((err) => res.status(400).json({ error: err }));
});

router.get("/myposts/:id", verifyToken, (req, res) => {
  const id = req.params.id;
  const username = decodeToken(req.cookies["jwt-token"]);
  posts.find({ _id: id, uname: username }).then((post) => {
    if (post.length == 0) {
      res.status(400).json({ error: "This is not your post" });
    } else {
      res.status(200).json({ post });
    }
  });
});

router.put("/myposts/:id", verifyToken, uploads.single("image"), (req, res) => {
  const id = req.params.id;
  const editpost = req.body.post;
  const img = req.file;
  const username = decodeToken(req.cookies["jwt-token"]);
  if (!editpost || !img) {
    res.status(400).json({ error: "Please enter posts" });
  }
  posts.find({ _id: id, uname: username }).then((post) => {
    if (post.length == 0) {
      res.status(400).json({ error: "This is not your post" });
    } else {
      const filename = `${Date.now()}_${req.file.originalname}`.toString();
      posts
        .findByIdAndUpdate(id, { imgname: filename, post: editpost })
        .then((post) => {
          res.status(200).json({ post });
        })
        .catch((err) => res.status(400).json({ errorss: err }));
    }
  });
});

router.delete("/myposts/:id", verifyToken, (req, res) => {
  const id = req.params.id;
  const username = decodeToken(req.cookies["jwt-token"]);
  posts.find({ _id: id, uname: username }).then((post) => {
    if (post.length == 0) {
      res.status(400).json({ error: "This is not your post" });
    } else {
      posts
        .findByIdAndDelete(id)
        .then((post) => {
          res.status(200).json({ delpost: post });
        })
        .catch((err) => res.status(400).json({ error: err }));
    }
  });
});
// Invalid Routes
router.all("*", (req, res) => {
  res.status(404).json({ error: "Error 404 page not found" });
});

module.exports = router;
