import { getEmailsDB, saveEmailsDB } from '../../utils/email';

export default defineEventHandler((event) => {
    const address = String(getRouterParam(event, 'address')).toLowerCase();
    const emails = getEmailsDB();
    emails[address] = [];
    saveEmailsDB(emails);
    return { status: 'cleared' };
});
