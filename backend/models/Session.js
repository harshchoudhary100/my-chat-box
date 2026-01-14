import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    sessionId: { type: String, required: true },
    title: { type: String, default: "New Chat" }
  },
  { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);
