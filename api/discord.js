import fs from 'fs/promises';

export default async function handler(req, res) {
  // Serve /.well-known/discord from environment variable to avoid committing token to repo
  const key = process.env.DISCORD_KEY;

  if (key) {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(`dh=${key}`);
  }

  return res.status(404).send('Not found');
}
