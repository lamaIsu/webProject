const CalendarNote = require("../Models/CalendarNote");

exports.handleGetNotes = async (req, res) => {
  try {
    const { userId, month } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const filter = { userId };
    if (month) filter.month = month;

    const notes = await CalendarNote.find(filter).sort({ date: 1 });
    res.json({ notes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.handleCreateNote = async (req, res) => {
  try {
    const { userId, date, title, type, note } = req.body;
    if (!userId || !date || !title)
      return res.status(400).json({ message: "userId, date, title required" });

    const month = String(date).slice(0, 7);

    const created = await CalendarNote.create({
      userId,
      date,
      month,
      title,
      type: type || "note",
      note: note || ""
    });

    res.status(201).json({ note: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.handleDeleteNote = async (req, res) => {
  try {
    await CalendarNote.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.handleClearAllNotes = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required" });

    await CalendarNote.deleteMany({ userId });
    res.json({ message: "Cleared" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};
