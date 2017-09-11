module.exports = text => ({
  fallback: "Some error",
  color: "#F35A00",
  pretext: "Error",
  author_name: "Your Bot",
  title: "Error",
  text,
  fields: [
    {
      "title": "Priority",
      "value": "High",
      "short": false
    }
  ],
  ts: Math.round(Date.now() / 1000)
});
