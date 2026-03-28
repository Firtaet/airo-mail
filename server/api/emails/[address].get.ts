import { getEmailsDB } from '../../utils/email';

export default defineEventHandler((event) => {
    const address = String(getRouterParam(event, 'address')).toLowerCase();
    const emails = getEmailsDB();
    return emails[address] || [];
});
