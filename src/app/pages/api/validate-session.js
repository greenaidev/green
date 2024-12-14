// api/validate-session.js

import { withIronSessionApiRoute } from "iron-session/next";

const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: "solana-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  const user = req.session.user;

  if (!user || Date.now() > user.expiresAt) {
    return res.status(401).json({ message: "Session expired or invalid" });
  }

  return res.status(200).json({ message: "Session valid", user });
}

export default withIronSessionApiRoute(handler, sessionOptions);
