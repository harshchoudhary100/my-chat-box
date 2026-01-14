import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import Chat from "./models/Chat.js";
import User from "./models/User.js";
import Session from "./models/Session.js";
import { auth, blacklistToken } from "./middleware/auth.js";

// LangChain
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

dotenv.config();
const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());


/* ============================================
            MONGODB CONNECT
============================================ */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✔"))
  .catch((err) => console.log("MongoDB Error ❌", err));



/* ============================================
                AUTH ROUTES
============================================ */

// Signup
app.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed });

    res.json({ message: "Signup successful" });
 } catch (err) {
  console.log("SIGNUP ERROR =>", err);
  res.status(500).json({ error: err.message });
}
});

// Login
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Wrong password" });

    const jti = crypto.randomUUID();
    const token = jwt.sign({ userId: user._id, jti }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, userId: user._id });
  } catch (err) {
  console.log("LOGIN ERROR =>", err);
  res.status(500).json({ error: err.message });
}

});

app.post("/auth/logout", async (req, res) => {
  try {
    const headerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined;
    if (headerToken) {
      try {
        const decoded = jwt.verify(headerToken, process.env.JWT_SECRET);
        if (decoded?.jti && decoded?.exp) blacklistToken(decoded.jti, decoded.exp);
      } catch {}
    }
    res.status(200).json({ message: "Logged out" });
  } catch {
    res.status(500).json({ error: "Logout failed" });
  }
});



/* ============================================
           LANGCHAIN SETUP
============================================ */
const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o-mini",
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant."],
  ["placeholder", "{history}"],
  ["human", "{input}"],
]);



/* ============================================
            CREATE NEW SESSION
============================================ */
app.post("/session/create", auth, async (req, res) => {
  try {
    const userId = req.userId;

    const sessionId = crypto.randomUUID();

    await Session.create({
      userId,
      sessionId,
      title: "New Chat",
    });

    res.json({ sessionId });
  } catch (err) {
    console.error("CREATE SESSION ERROR:", err);
    res.status(500).json({ error: "Failed to create session" });
  }
});



/* ============================================
               RENAME SESSION
============================================ */
app.put("/session/rename/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { newTitle } = req.body;
    const userId = req.userId;

    await Session.findOneAndUpdate({ sessionId, userId }, { title: newTitle });

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Rename failed" });
  }
});



/* ============================================
                  CHAT
============================================ */
app.post("/chat/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.userId;

    const pastMessages = await Chat.find({ userId, sessionId }).sort({
      createdAt: 1,
    });

    const history = pastMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const chain = RunnableSequence.from([
      () => ({ input: message, history }),
      prompt,
      model,
      new StringOutputParser(),
    ]);

    const reply = await chain.invoke({ input: message });

    await Chat.create({ userId, sessionId, role: "human", content: message });
    await Chat.create({ userId, sessionId, role: "assistant", content: reply });

    res.json({ reply });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Chat error" });
  }
});



/* ============================================
            FETCH ALL SESSIONS
============================================ */
app.get("/sessions", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const sessions = await Session.find({ userId }).sort({ updatedAt: -1 });
    res.json(sessions);
  } catch {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});



/* ============================================
          FETCH CHAT HISTORY
============================================ */
app.get("/history/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    const messages = await Chat.find({ userId, sessionId }).sort({
      createdAt: 1,
    });

    res.json(messages);
  } catch {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});



/* ============================================
            DELETE SESSION
============================================ */
app.delete("/session/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    await Chat.deleteMany({ userId, sessionId });
    await Session.deleteOne({ userId, sessionId });

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});



/* ============================================
                SERVER START
============================================ */
app.listen(5000, () => console.log("Backend running on port 5000 ✔"));
