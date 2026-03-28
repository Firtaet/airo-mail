import { useDb } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const address = body.address;

  if (!address) {
    throw createError({ statusCode: 400, message: 'Missing address' });
  }

  const db = useDb();
  db.prepare("DELETE FROM emails WHERE to_address = ?").run(address.toString().toLowerCase());

  return { status: 'success' };
});
