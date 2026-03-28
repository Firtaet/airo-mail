import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const address = query.address;

  if (!address) {
    throw createError({ statusCode: 400, message: 'Missing address' });
  }

  const db = useDb();
  
  // Also clean up emails older than 24h per Temp Mail standards?
  // db.prepare("DELETE FROM emails WHERE received_at < ?").run(Date.now() - 24 * 60 * 60 * 1000);

  const emails = db.prepare(`
    SELECT * FROM emails 
    WHERE to_address = ? 
    ORDER BY received_at DESC
  `).all(address.toString().toLowerCase());

  return emails;
});
