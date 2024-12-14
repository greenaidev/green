// api/set-session.js

import { withIronSessionApiRoute } from "iron-session/next";

const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: "solana-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60,
  },
};

async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method === "POST") {
    const { walletAddress, signatureVerified } = req.body;

    if (signatureVerified) {
      req.session.user = { walletAddress, verified: true, expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
      await req.session.save();
      return res.status(200).json({ message: "Session set successfully" });
    }

    return res.status(403).json({ message: "Unauthorized" });
  }

  return res.status(405).json({ message: "Method not allowed" });
}

export default withIronSessionApiRoute(handler, sessionOptions);
