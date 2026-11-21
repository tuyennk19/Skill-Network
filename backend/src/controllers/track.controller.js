const trackModel = require('../models/track.model');

async function list(req, res) {
  const tracks = await trackModel.findActiveWithCriteria();
  return res.json({ items: tracks });
}

module.exports = { list };
