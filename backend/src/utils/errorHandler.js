exports.handleError = (res, error) => {
  if (error.name === "ZodError") {
    return res
      .status(400)
      .json({ error: error.errors.map((e) => e.message).join(", ") });
  }
  console.error(error);
  res.status(500).json({ error: "Server error" });
};
