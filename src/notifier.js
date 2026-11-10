// Listens for won deals and emails the sales team. Needs NOTIFY_API_TOKEN,
// a secret that stackfork takes from the keychain and never prints.
const { createClient } = require('redis');
const nodemailer = require('nodemailer');
const { readSecret, fingerprint } = require('./secrets');

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT || 1025),
  secure: false,
});

async function main() {
  const token = readSecret('NOTIFY_API_TOKEN');
  if (!token) throw new Error('NOTIFY_API_TOKEN is not set');
  const sub = createClient({ url: process.env.REDIS_URL });
  await sub.connect();
  console.log(`notifier: ready, token ${fingerprint(token)}`);
  await sub.subscribe('deal-won', async (raw) => {
    const deal = JSON.parse(raw);
    await mailer.sendMail({
      from: 'Acme CRM <crm@acme.test>',
      to: 'sales@acme.test',
      subject: `🎉 Deal won: ${deal.title} (${deal.company})`,
      text: `${deal.company} signed "${deal.title}" for $${(deal.value_cents / 100).toLocaleString()}.`,
    });
    console.log(`notifier: emailed sales about deal #${deal.id}`);
  });
}

main().catch((e) => {
  console.error('notifier crashed:', e.message);
  process.exit(1);
});
