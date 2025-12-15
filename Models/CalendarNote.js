const mongoose = require("mongoose");

const CalendarNoteSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    title: { type: String, required: true },
    note: { type: String, default: "" },
    type: { type: String, default: "note" }, // task/exam/project/note
  },
  { timestamps: true }
);

module.exports = mongoose.model("CalendarNote", CalendarNoteSchema);
