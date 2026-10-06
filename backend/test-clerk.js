const express = require('express');
const { clerkMiddleware, requireAuth, getAuth } = require('@clerk/express');
const app = express();
app.use(clerkMiddleware());
app.get('/', requireAuth(), (req, res) => {
  res.json({ reqAuth: req.auth, getAuth: getAuth(req) });
});
