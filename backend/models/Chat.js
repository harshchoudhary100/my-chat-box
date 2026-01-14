import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },        // 🔥 NEW
    sessionId: { type: String, required: true },
    role: { type: String, enum: ["human", "assistant"], required: true },
    content: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
