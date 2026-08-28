const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 হেলথ চেক রুট
app.get('/', (req, res) => {
  res.status(200).send("🚀 Elite Arena Dedicated Email Microservice Active & Live!");
});

// ১. ফায়ারবেস সার্ভিস ইনিশিয়ালাইজেশন
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://lonewolfbd-6450b-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
    console.log("✅ Firebase Admin Connected to Email Service");
  }
} catch (e) {
  console.error("❌ Firebase Init Error:", e.message);
}

const db = admin.database();

// ==========================================
// 📧 জিমেইল ট্রান্সপোর্টার ও মাল্টি-অ্যাকাউন্ট রোটেশন পুল
// ==========================================

// 🎉 ১. ওয়েলকাম মেইলার (Dedicated Welcome Sender - Fast SSL)
const welcomeTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.WELCOME_GMAIL || 'welcome.elitearenabd@gmail.com',
    pass: (process.env.WELCOME_PASS || 'nyxq mxef ikin xupj').replace(/\s+/g, '')
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
});

// 🚀 ২. অফার ও ৩,০০০+ কামব্যাক ব্রডকাস্ট রোটেশন পুল
const offerAccountsPool = [
  { user: 'offer.elitearenabd@gmail.com', pass: process.env.OFFER_PASS || '' },
  { user: 'fridayoffer.elitearenabd@gmail.com', pass: process.env.FRIDAY_OFFER_PASS || '' },
  { user: 'todayoffer.elitearenabd@gmail.com', pass: process.env.TODAY_OFFER_PASS || '' },
  { user: 'youroffer.elitearenabd@gmail.com', pass: process.env.YOUR_OFFER_PASS || '' },
  { user: 'user.elitearenabd@gmail.com', pass: process.env.USER_OFFER_PASS || '' }
];

// স্মার্ট রোটেশন ফাংশন (Load Balancer)
async function sendRotatedMail(mailOptions, accountIndex = 0) {
  const activeOfferAccounts = offerAccountsPool.filter(acc => acc.pass && acc.pass.trim() !== '');

  if (activeOfferAccounts.length > 0) {
    const selectedAcc = activeOfferAccounts[accountIndex % activeOfferAccounts.length];
    const poolTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: selectedAcc.user.trim(), pass: selectedAcc.pass.replace(/\s+/g, '') },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      socketTimeout: 15000
    });
    return poolTransporter.sendMail({
      from: `"ELITE ARENA BD" <${selectedAcc.user}>`,
      ...mailOptions
    });
  } else {
    // ফলব্যাক হিসেবে ওয়েলকাম অ্যাকাউন্ট দিয়ে পাঠানো
    return welcomeTransporter.sendMail({
      from: `"ELITE ARENA BD" <welcome.elitearenabd@gmail.com>`,
      ...mailOptions
    });
  }
}

// ==========================================
// 🎨 ১. নতুন ইউজার ওয়েলকাম ইমেইল টেমপ্লেট
// ==========================================
function getWelcomeEmailTemplate(data) {
  const name = data.name || 'Player';
  const supportPin = data.supportPin || 'N/A';
  const email = data.email || '';

  return `
<!DOCTYPE html>
<html lang="bn"><head><meta charset="UTF-8"><title>Welcome</title></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: sans-serif;">
  <table width="100%" style="padding: 35px 12px;"><tr><td align="center">
    <table width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 24px; box-shadow: 0 15px 40px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; overflow: hidden;">
      <tr><td style="background: linear-gradient(90deg, #ff003c 0%, #ff3366 100%); height: 5px;"></td></tr>
      <tr><td align="center" style="padding: 35px 25px 12px 25px;">
        <img src="https://elitearena.live/favicon.png" width="62" height="62" style="border-radius: 15px; box-shadow: 0 6px 20px rgba(255,0,60,0.2);">
        <div style="margin-top: 12px; color: #0f172a; font-size: 16px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">ELITE ARENA BD</div>
        <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-top: 2px;">Official Esports Platform</div>
      </td></tr>
      <tr><td style="padding: 10px 28px 30px 28px; text-align: left;">
        <div style="background-color: #fff1f2; border: 1px solid #ffe4e6; border-radius: 50px; padding: 4px 14px; display: inline-block; margin-bottom: 12px;">
          <span style="color: #ff003c; font-size: 11px; font-weight: 800; text-transform: uppercase;">✦ Welcome to the Arena</span>
        </div>
        <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 10px 0;">স্বাগতম আমাদের অ্যারেনায়,<br><span style="color: #ff003c;">${name}</span>!</h1>
        <p style="color: #475569; font-size: 14px; line-height: 1.65; margin: 0 0 20px 0;">বাংলাদেশের বিশ্বস্ত এস্পোর্টস প্ল্যাটফর্ম <strong>ELITE ARENA BD</strong>-তে আপনার অ্যাকাউন্ট সফলভাবে সক্রিয় করা হয়েছে।</p>
        <table width="100%" style="background-color: #f8fafc; border: 1.5px solid #edf2f7; border-radius: 14px; margin-bottom: 22px;">
          <tr><td style="padding: 12px 16px; border-bottom: 1px solid #edf2f7; font-size: 13px; color: #64748b;">রেজিস্টার্ড ইমেইল <strong style="color: #0f172a; float: right;">${email}</strong></td></tr>
          <tr><td style="padding: 12px 16px; font-size: 13px; color: #64748b;">সিকিউর সাপোর্ট পিন <strong style="color: #ff003c; float: right; font-size: 15px; font-weight: 800;">#${supportPin}</strong></td></tr>
        </table>
        <div style="font-size: 12.5px; font-weight: 800; color: #0f172a; margin-bottom: 12px; text-transform: uppercase;">যেভাবে খেলা শুরু করবেন:</div>
        <table width="100%" style="margin-bottom: 15px; font-size: 13px; color: #475569; line-height: 1.5;">
          <tr><td style="padding: 6px 0;"><strong>০১. ম্যাচ সিলেক্ট:</strong> Solo, Duo বা Squad ম্যাচ বুক করুন।</td></tr>
          <tr><td style="padding: 6px 0;"><strong>০২. রুম ডিটেইলস:</strong> ম্যাচ শুরুর ৫-১০ মিনিট আগে অ্যাপে রুম আইডি-পাসওয়ার্ড পাবেন।</td></tr>
          <tr><td style="padding: 6px 0;"><strong>০৩. ইনস্ট্যান্ট উইথড্র:</strong> বিকাশ/নগদে যেকোনো সময় টাকা ক্যাশআউট করুন।</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding: 18px 25px; background-color: #fafbfc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11.5px; color: #94a3b8;">
        © 2026 ELITE ARENA BD • <a href="https://elitearena.live" target="_blank" style="color: #ff003c; text-decoration: none; font-weight: 600;">elitearena.live</a>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

// ==========================================
// 🎨 ২. শুক্রবারের স্পেশাল ডিপোজিট বোনাস অফার টেমপ্লেট
// ==========================================
function getFridayOfferEmailTemplate(userName) {
  const name = userName || 'Player';
  return `
<!DOCTYPE html>
<html lang="bn"><head><meta charset="UTF-8"><title>Friday Special Offer</title></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: sans-serif;">
  <table width="100%" style="padding: 35px 12px;"><tr><td align="center">
    <table width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 24px; box-shadow: 0 15px 40px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; overflow: hidden;">
      <tr><td style="background: linear-gradient(90deg, #ff003c 0%, #ff3366 100%); height: 5px;"></td></tr>
      <tr><td align="center" style="padding: 32px 25px 12px 25px;">
        <img src="https://elitearena.live/favicon.png" width="60" height="60" style="border-radius: 14px; box-shadow: 0 6px 20px rgba(255,0,60,0.22);">
        <div style="margin-top: 12px; color: #0f172a; font-size: 16px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">ELITE ARENA BD</div>
      </td></tr>
      <tr><td style="padding: 10px 26px 30px 26px; text-align: center;">
        <div style="background-color: #fff1f2; border: 1px solid #ffe4e6; border-radius: 50px; padding: 4px 16px; display: inline-block; margin-bottom: 12px;">
          <span style="color: #ff003c; font-size: 11.5px; font-weight: 800;">✨ পবিত্র শুক্রবারের ধামাকা অফার ✨</span>
        </div>
        <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 8px 0;">স্পেশাল ডিপোজিট বোনাস,<br><span style="color: #ff003c;">${name}</span></h1>
        <p style="color: #475569; font-size: 13.5px; line-height: 1.5; margin: 0 0 20px 0;">🤲 শুধুমাত্র আজকের জন্য থাকছে আকর্ষণীয় Bonus Offer! নিচে দেওয়া যেকোনো অ্যামাউন্ট ডিপোজিট করলেই বোনাস যোগ হবে:</p>
        <table width="100%" style="background-color: #f8fafc; border: 1.5px solid #edf2f7; border-radius: 16px; margin-bottom: 20px; font-size: 13.5px; text-align: left;">
          <tr style="background: #0f172a; color: #fff;"><td style="padding: 10px 14px; font-weight: 700;">ডিপোজিট</td><td style="padding: 10px 14px; font-weight: 700; text-align: right;">টোটাল ব্যালেন্স পাবেন</td></tr>
          <tr><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7;">💸 ৳99</td><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7; text-align: right; color: #ff003c; font-weight: 800;">🎁 ৳110</td></tr>
          <tr><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7;">💸 ৳149</td><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7; text-align: right; color: #ff003c; font-weight: 800;">🎁 ৳165</td></tr>
          <tr><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7;">💸 ৳249</td><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7; text-align: right; color: #ff003c; font-weight: 800;">🎁 ৳280</td></tr>
          <tr><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7;">💸 ৳349</td><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7; text-align: right; color: #ff003c; font-weight: 800;">🎁 ৳390</td></tr>
          <tr><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7;">💸 ৳499</td><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7; text-align: right; color: #ff003c; font-weight: 800;">🎁 ৳560</td></tr>
          <tr><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7;">💸 ৳999</td><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7; text-align: right; color: #ff003c; font-weight: 800;">🎁 ৳1,120</td></tr>
          <tr style="background: #fff5f5;"><td style="padding: 10px 14px;">🔥 ৳1,999</td><td style="padding: 10px 14px; text-align: right; color: #ff003c; font-weight: 900;">🎁 ৳2,250</td></tr>
        </table>
        <div style="background: #fff9f9; border: 1px dashed #ffccd5; border-radius: 10px; padding: 10px; color: #b91c1c; font-size: 12.5px; font-weight: 700; margin-bottom: 20px;">
          ⏰ অফারটি শুধুমাত্র আজ (পবিত্র শুক্রবার) রাত ১১:৫৯ মিনিট পর্যন্ত সক্রিয়।
        </div>
        <a href="https://elitearena.live" target="_blank" style="display: block; width: 100%; max-width: 280px; margin: 0 auto; background: #ff003c; color: #ffffff; text-decoration: none; padding: 13px 0; font-size: 15px; font-weight: 800; border-radius: 10px;">💸 এখনই ডিপোজিট করুন</a>
      </td></tr>
      <tr><td style="padding: 16px 20px; background-color: #fafbfc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">© 2026 ELITE ARENA BD • Official Offers</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

// ==========================================
// 🎨 ৩. রিব্র্যান্ডিং / কামব্যাক মেইল টেমপ্লেট
// ==========================================
function getRebrandEmailTemplate(userName) {
  const name = userName || 'Player';
  return `
<!DOCTYPE html>
<html lang="bn"><head><meta charset="UTF-8"><title>LONE WOLF BD এখন ELITE ARENA BD</title></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: sans-serif;">
  <table width="100%" style="padding: 30px 12px;"><tr><td align="center">
    <table width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 18px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow: hidden; padding: 25px;">
      <div style="height: 4px; background-color: #ff003c; margin: -25px -25px 20px -25px;"></div>
      <h3 style="color: #0f172a; margin-bottom: 5px;">প্রিয় <span style="color: #ff003c;">${name}</span>,</h3>
      <p style="color: #64748b; font-size: 13.5px;">আপনার <strong>LONE WOLF BD</strong> অ্যাকাউন্ট সংক্রান্ত একটি জরুরী নোটিশ:</p>
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 15px; margin: 15px 0; border: 1px solid #edf2f7; text-align: left; font-size: 13px;">
        <p style="margin: 6px 0; color: #334155;"><strong>১. নাম পরিবর্তন:</strong> সার্ভার আপগ্রেডের জন্য অ্যাপের নাম পরিবর্তন করে <strong>ELITE ARENA BD</strong> করা হয়েছে।</p>
        <p style="margin: 6px 0; color: #334155;"><strong>২. ব্যালেন্স ১০০% নিরাপদ:</strong> আগের জিমেইল দিয়ে লগইন করলেই আপনার সমস্ত ব্যালেন্স ও ডাটা অক্ষত পাবেন।</p>
        <p style="margin: 6px 0; color: #334155;"><strong>৩. নতুন APK:</strong> নিচের বাটনে ক্লিক করে নতুন ভার্সন ইনস্টল করুন।</p>
      </div>
      <a href="https://elitearena.live" target="_blank" style="display: block; background: #ff003c; color: #ffffff; text-decoration: none; padding: 13px 0; font-size: 15px; font-weight: bold; border-radius: 10px; text-align: center; margin-top: 15px;">নতুন অ্যাপ ডাউনলোড করুন</a>
      <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 15px;">© 2026 ELITE ARENA BD • All rights reserved.</p>
    </table>
  </td></tr></table>
</body></html>`;
}

// ==========================================
// 🔍 ১-ক্লিক টেস্ট রাউট (Direct 1-Click Test API)
// ==========================================
app.get('/api/test-email', async (req, res) => {
  const targetEmail = req.query.email || 'alaminarif770@gmail.com';
  const emailType = req.query.type || 'welcome'; // welcome, offer, comeback

  try {
    let subject = '🎉 [TEST] স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে';
    let htmlContent = getWelcomeEmailTemplate({
      name: 'Alamin Arif (Test Player)',
      supportPin: '7842',
      email: targetEmail
    });

    if (emailType === 'offer') {
      subject = '✨ [TEST] পবিত্র শুক্রবার স্পেশাল ডিপোজিট বোনাস! - ELITE ARENA BD';
      htmlContent = getFridayOfferEmailTemplate('Alamin Arif (Test Player)');
    } else if (emailType === 'comeback') {
      subject = '📢 [TEST] জরুরী নোটিশ: LONE WOLF BD এখন ELITE ARENA BD!';
      htmlContent = getRebrandEmailTemplate('Alamin Arif (Test Player)');
    }

    const info = await welcomeTransporter.sendMail({
      from: '"ELITE ARENA BD - Official" <welcome.elitearenabd@gmail.com>',
      to: targetEmail.trim(),
      subject: subject,
      html: htmlContent
    });

    return res.json({ 
      success: true, 
      message: `টেস্ট ${emailType.toUpperCase()} ইমেইল সফলভাবে পাঠানো হয়েছে ${targetEmail} ঠিকানায়!`,
      messageId: info.messageId 
    });
  } catch (err) {
    console.error("Test Email Error:", err);
    return res.status(500).json({ success: false, message: 'ইমেইল পাঠাতে ব্যর্থ!', error: err.message });
  }
});

// ==========================================
// 🤖 ১. স্বয়ংক্রিয় রিয়েলটাইম ওয়েলকাম ইমেইল লিসেনার
// ==========================================
db.ref('users').on('child_added', async (snapshot) => {
  try {
    const uid = snapshot.key;
    const user = snapshot.val();

    if (!user || !user.email || !user.email.includes('@')) return;

    const welcomeLogSnap = await db.ref(`welcome_email_logs/${uid}`).once('value');
    if (!welcomeLogSnap.exists()) {
      const now = Date.now();
      const joinedTime = user.joinedAt ? new Date(user.joinedAt).getTime() : now;

      if ((now - joinedTime) < 2 * 60 * 60 * 1000) {
        await welcomeTransporter.sendMail({
          from: '"ELITE ARENA BD - Official" <welcome.elitearenabd@gmail.com>',
          to: user.email,
          subject: '🎉 স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে',
          html: getWelcomeEmailTemplate({
            name: user.name || 'Player',
            supportPin: user.supportPin || 'N/A',
            email: user.email
          })
        });

        await db.ref(`welcome_email_logs/${uid}`).set({ sentAt: now });
        console.log(`✅ [Auto-Welcome] Sent to new user: ${user.email}`);
      }
    }
  } catch (err) {
    console.error("Auto Welcome Listener Error:", err.message);
  }
});

// ==========================================
// 🚀 ২. সবার জন্য অফার ব্রডকাস্ট API
// ==========================================
app.post('/api/broadcast-offer', async (req, res) => {
  try {
    const usersSnap = await db.ref('users').once('value');
    if (!usersSnap.exists()) {
      return res.status(400).json({ success: false, message: 'কোনো ইউজার পাওয়া যায়নি।' });
    }

    const users = usersSnap.val();
    const queue = [];

    for (const uid in users) {
      const u = users[uid];
      if (u.email && u.email.includes('@') && u.isBanned !== true) {
        queue.push({ uid, email: u.email.trim(), name: u.name || 'Player' });
      }
    }

    startCampaignBroadcast(queue, 'Friday Offer', getFridayOfferEmailTemplate, '✨ পবিত্র শুক্রবার স্পেশাল ডিপোজিট বোনাস! - ELITE ARENA BD');

    return res.json({
      success: true,
      message: `অফার ব্রডকাস্ট শুরু হয়েছে (মোট ${queue.length} জন ইউজার)।`,
      total: queue.length
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 🎯 ৩. পুরনো ও ড্রপ-আউট ইউজারদের কামব্যাক ব্রডকাস্ট API
// ==========================================
app.post('/api/broadcast-comeback', async (req, res) => {
  try {
    const usersSnap = await db.ref('users').once('value');
    if (!usersSnap.exists()) {
      return res.status(400).json({ success: false, message: 'কোনো ইউজার পাওয়া যায়নি।' });
    }

    const users = usersSnap.val();
    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const queue = [];

    for (const uid in users) {
      const u = users[uid];
      if (!u.email || !u.email.includes('@') || u.isBanned === true) continue;

      const lastActive = u.last_active;

      // 🛑 স্মার্ট ফিল্টারিং: যারা নতুন অ্যাপ খোলেনি বা ৩০ দিন ধরে নেই
      if (!lastActive || (now - lastActive) > THIRTY_DAYS_MS) {
        queue.push({ uid, email: u.email.trim(), name: u.name || 'Player' });
      }
    }

    if (queue.length === 0) {
      return res.json({ success: false, message: 'কোনো ড্রপ-আউট বা পুরনো ইউজার পাওয়া যায়নি।' });
    }

    startCampaignBroadcast(queue, 'Old User Comeback', getRebrandEmailTemplate, '📢 জরুরী নোটিশ: LONE WOLF BD এখন ELITE ARENA BD!');

    return res.json({
      success: true,
      message: `কামব্যাক ব্রডকাস্ট শুরু হয়েছে (মোট ${queue.length} জন ড্রপ-আউট ইউজার)।`,
      totalOldUsers: queue.length
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ⚙️ ব্যাকগ্রাউন্ড মাল্টি-জিমেইল রোটেশন ইঞ্জিন
// ==========================================
async function startCampaignBroadcast(queue, campaignName, templateFunc, subject) {
  const total = queue.length;
  let successCount = 0;
  let failCount = 0;
  const statusRef = db.ref('email_campaign_status');
  const logsRef = db.ref('campaign_live_logs');

  await logsRef.remove();
  await statusRef.set({
    isRunning: true,
    campaignName: campaignName,
    total: total,
    processed: 0,
    success: 0,
    failed: 0,
    percentage: 0,
    statusText: `${campaignName} শুরু হচ্ছে...`,
    startTime: Date.now(),
    lastUpdated: Date.now()
  });

  for (let i = 0; i < total; i++) {
    const item = queue[i];
    let isSuccess = false;
    let failReason = null;

    try {
      await sendRotatedMail({
        to: item.email,
        subject: subject,
        html: templateFunc(item.name)
      }, i);

      isSuccess = true;
      successCount++;
    } catch (err) {
      isSuccess = false;
      failReason = err.message || 'SMTP Error';
      failCount++;
    }

    const processed = i + 1;
    const percentage = Math.round((processed / total) * 100);
    const logTime = new Date().toLocaleTimeString('en-US', { hour12: true });

    await logsRef.push({
      message: isSuccess ? `✅ [${logTime}] (${processed}/${total}) Sent: ${item.email}` : `❌ [${logTime}] (${processed}/${total}) Failed: ${item.email} (${failReason})`,
      timestamp: Date.now()
    });

    await statusRef.update({
      processed: processed,
      success: successCount,
      failed: failCount,
      percentage: percentage,
      statusText: `[${processed}/${total}] ${isSuccess ? 'Sent' : 'Failed'}: ${item.email}`,
      lastUpdated: Date.now()
    });

    await new Promise(res => setTimeout(res, 350));
  }

  await statusRef.update({ isRunning: false, statusText: 'Completed', endTime: Date.now() });
}

// 🟢 Railway ক্লাউড হোস্ট বাইন্ডিং (0.0.0.0)
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Elite Arena Dedicated Email Service Running on Port ${PORT}`));
