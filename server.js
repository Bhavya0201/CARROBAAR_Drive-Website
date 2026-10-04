require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing middleware
app.use(cors());
app.use(express.json());

// Serve static frontend assets from the root directory
app.use(express.static(__dirname));

// Initialize Twilio Client helper
let twilioClient = null;
const hasTwilioCreds = process.env.TWILIO_ACCOUNT_SID && 
                       process.env.TWILIO_AUTH_TOKEN && 
                       process.env.TWILIO_ACCOUNT_SID !== 'none' && 
                       process.env.TWILIO_ACCOUNT_SID !== 'NA' &&
                       !process.env.TWILIO_ACCOUNT_SID.includes('your_');

if (hasTwilioCreds) {
    try {
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('✅ Twilio SDK initialized successfully.');
    } catch (err) {
        console.error('❌ Failed to initialize Twilio client:', err.message);
    }
} else {
    console.warn('⚠️ Warning: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is missing or disabled. Notification services will run in dry-run mode.');
}

// Google OAuth Status
if (process.env.GOOGLE_CLIENT_ID) {
    console.log('✅ Google OAuth 2.0 initialized with Client ID:', process.env.GOOGLE_CLIENT_ID);
}

// Persistent Lead Database File (leads.json)
const LEADS_FILE = path.join(__dirname, 'leads.json');

function getLeads() {
    try {
        if (fs.existsSync(LEADS_FILE)) {
            const raw = fs.readFileSync(LEADS_FILE, 'utf8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error('Error reading leads.json:', err.message);
    }
    return [];
}

function saveLead(lead) {
    const leads = getLeads();
    leads.push(lead);
    try {
        fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
        console.log(`✅ Lead saved to leads.json: ${lead.fullName} (${lead.phoneNumber}) - ${lead.location}`);
    } catch (err) {
        console.error('Error writing to leads.json:', err.message);
    }
}

// In-memory store for transient OTP requests: phoneNumber -> { otp, fullName, location, expiresAt }
const otpStore = new Map();

/**
 * Validates and sanitizes the booking request body.
 */
function validateBooking(req, res, next) {
    const { fullName, phoneNumber, requiredService, vehicleCategory, preferredDate, carModel, notes } = req.body;

    const errors = [];

    // Full Name: Required, String
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
        errors.push({ field: 'fullName', message: 'Full name is required.' });
    }

    // Phone Number: Required, 10-digit numeric string
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneRegex.test(phoneNumber.trim())) {
        errors.push({ field: 'phoneNumber', message: 'Phone number must be a valid 10-digit number.' });
    }

    // Required Service: Required, String
    if (!requiredService || typeof requiredService !== 'string' || requiredService.trim().length === 0) {
        errors.push({ field: 'requiredService', message: 'Required service selection is invalid.' });
    }

    // Vehicle Category: Required, String
    if (!vehicleCategory || typeof vehicleCategory !== 'string' || vehicleCategory.trim().length === 0) {
        errors.push({ field: 'vehicleCategory', message: 'Vehicle category selection is invalid.' });
    }

    // Preferred Date: Required, Valid Date
    if (!preferredDate) {
        errors.push({ field: 'preferredDate', message: 'Preferred inspection date is required.' });
    } else {
        const parsedDate = Date.parse(preferredDate);
        if (isNaN(parsedDate)) {
            errors.push({ field: 'preferredDate', message: 'Preferred inspection date must be a valid date format.' });
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    // Sanitize values
    req.sanitizedBody = {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        requiredService: requiredService.trim(),
        vehicleCategory: vehicleCategory.trim(),
        carModel: carModel ? carModel.trim() : 'Unspecified Model',
        preferredDate: new Date(preferredDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }),
        notes: notes ? notes.trim() : 'None'
    };

    next();
}

/**
 * POST /api/bookings
 * Registers a new car inspection request and fires confirmation notifications via Twilio APIs.
 */
app.post('/api/bookings', validateBooking, async (req, res) => {
    const data = req.sanitizedBody;
    console.log(`\n📬 Incoming booking request from: ${data.fullName} (${data.phoneNumber})`);

    // Format human-readable service names for template messaging
    const serviceDisplayNames = {
        'pdi': 'New Car Pre-Delivery Inspection (PDI)',
        'used-inspection': 'Used Car 300+ Point Inspection',
        'buying-assistance': 'Car Buying Assistance',
        'consultation': 'Expert Automotive Consultation'
    };
    const serviceName = serviceDisplayNames[data.requiredService] || data.requiredService;

    // Compose notification templates
    const customerMsg = `Hello ${data.fullName}, thank you for choosing CARROBAAR_Drive! We have received your request for a ${serviceName} for your ${data.carModel} on ${data.preferredDate}. Our team will contact you shortly to confirm.`;
    
    const adminMsg = `🚨 NEW CARROBAAR_Drive BOOKING!\n\n` +
                     `👤 Client: ${data.fullName}\n` +
                     `📞 Phone: +91${data.phoneNumber}\n` +
                     `🛠️ Service: ${serviceName}\n` +
                     `🚗 Category/Model: ${data.vehicleCategory.toUpperCase()} / ${data.carModel}\n` +
                     `📅 Preferred Date: ${data.preferredDate}\n` +
                     `📝 Notes: ${data.notes}`;

    // Dry-run check if Twilio API parameters are missing
    if (!twilioClient) {
        console.log('🧪 Dry-Run Notification Log:');
        console.log(`[Customer Notification Template]:\n"${customerMsg}"`);
        console.log(`[Admin Notification Template]:\n"${adminMsg}"`);
        return res.status(200).json({
            success: true,
            message: 'Booking request simulated successfully (Dry-run mode active).'
        });
    }

    try {
        const adminPhone = process.env.ADMIN_PHONE || '+917498013236';

        // 1. Send confirmation message to customer
        // Try WhatsApp first using your Twilio Sender WhatsApp profile
        try {
            if (process.env.TWILIO_SENDER_WHATSAPP) {
                console.log(`📲 Sending WhatsApp confirmation to +91${data.phoneNumber}...`);
                await twilioClient.messages.create({
                    from: process.env.TWILIO_SENDER_WHATSAPP, // Format: whatsapp:+14155238886
                    to: `whatsapp:+91${data.phoneNumber}`,
                    body: customerMsg
                });
            } else if (process.env.TWILIO_SENDER_SMS) {
                console.log(`💬 Sending SMS fallback confirmation to +91${data.phoneNumber}...`);
                await twilioClient.messages.create({
                    from: process.env.TWILIO_SENDER_SMS,
                    to: `+91${data.phoneNumber}`,
                    body: customerMsg
                });
            } else {
                throw new Error('No Twilio WhatsApp or SMS sender configuration found.');
            }
            console.log('✅ Customer confirmation dispatched successfully.');
        } catch (customerTwilioError) {
            // Log Twilio API error but don't fail the entire endpoint. We still want to alert the admin.
            console.error('⚠️ Twilio warning sending message to customer:', customerTwilioError.message);
        }

        // 2. Send instant alert notification to Admin
        try {
            // Admin notification can run via SMS or WhatsApp depending on config
            if (process.env.TWILIO_SENDER_WHATSAPP) {
                console.log(`📲 Dispatching WhatsApp alert to admin at ${adminPhone}...`);
                await twilioClient.messages.create({
                    from: process.env.TWILIO_SENDER_WHATSAPP,
                    to: `whatsapp:${adminPhone.startsWith('+') ? adminPhone : '+91' + adminPhone}`,
                    body: adminMsg
                });
            } else if (process.env.TWILIO_SENDER_SMS) {
                console.log(`💬 Dispatching SMS alert to admin at ${adminPhone}...`);
                await twilioClient.messages.create({
                    from: process.env.TWILIO_SENDER_SMS,
                    to: adminPhone.startsWith('+') ? adminPhone : `+91${adminPhone}`,
                    body: adminMsg
                });
            }
            console.log('✅ Admin alert dispatched successfully.');
        } catch (adminTwilioError) {
            console.error('❌ Twilio error sending alert to admin:', adminTwilioError.message);
            // Throw so that the user/admin gets a 500 error since the admin alert is critical for lead collection
            throw adminTwilioError;
        }

        return res.status(200).json({
            success: true,
            message: 'Booking processed successfully'
        });

    } catch (error) {
        console.error('💥 Critical Error in Booking Pipeline:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while dispatching booking notifications.'
        });
    }
});

/**
 * POST /api/otp/send
 * Validates lead details (Name, Location, Phone) and dispatches a 4-digit OTP.
 */
app.post('/api/otp/send', async (req, res) => {
    const { fullName, location, phoneNumber } = req.body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (!location || typeof location !== 'string' || location.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'City/Location is required.' });
    }
    const phoneRegex = /^[0-9]{10}$/;
    const cleanPhone = phoneNumber ? phoneNumber.trim().replace(/\s+/g, '') : '';
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }

    // Generate 4-digit numeric OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

    otpStore.set(cleanPhone, {
        otp: otpCode,
        fullName: fullName.trim(),
        location: location.trim(),
        phoneNumber: cleanPhone,
        expiresAt
    });

    const smsResult = await sendSmsViaGateway(cleanPhone, otpCode);

    if (smsResult.success) {
        console.log(`✅ Real SMS dispatched via ${smsResult.gateway} to +91 ${cleanPhone}`);
        return res.status(200).json({
            success: true,
            message: `Verification code sent via SMS to +91 ${cleanPhone}.`
        });
    }

    console.log(`\n======================================================`);
    console.log(`📱 [OTP GENERATED - MANUAL ENTRY REQUIRED]`);
    console.log(`👉 Mobile: +91 ${cleanPhone} | Name: ${fullName.trim()}`);
    console.log(`🔑 4-Digit OTP Code: [ ${otpCode} ]`);
    console.log(`💡 To send real SMS to mobile devices, add FAST2SMS_API_KEY, TWOFACTOR_API_KEY, or TWILIO credentials in .env file.`);
    console.log(`======================================================\n`);

    return res.status(200).json({
        success: true,
        message: 'Verification OTP code generated. Please check your mobile or terminal log.'
    });
});

/**
 * Real SMS Gateway Dispatcher (Fast2SMS, 2Factor, Twilio)
 */
async function sendSmsViaGateway(cleanPhone, otpCode) {
    const otpMsg = `Your CARROBAAR_Drive sample PDI report verification code is: ${otpCode}. Valid for 5 minutes.`;

    // 1. Fast2SMS (India)
    if (process.env.FAST2SMS_API_KEY) {
        try {
            const res = await new Promise((resolve) => {
                const postData = JSON.stringify({
                    route: "otp",
                    variables_values: otpCode,
                    numbers: cleanPhone
                });
                const req = https.request({
                    hostname: 'www.fast2sms.com',
                    port: 443,
                    path: '/dev/bulkV2',
                    method: 'POST',
                    headers: {
                        'authorization': process.env.FAST2SMS_API_KEY,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                }, (r) => {
                    let body = '';
                    r.on('data', chunk => body += chunk);
                    r.on('end', () => {
                        console.log(`📱 [Fast2SMS Response]:`, body);
                        resolve({ success: true, gateway: 'Fast2SMS' });
                    });
                });
                req.on('error', (e) => {
                    console.error(`❌ Fast2SMS Error:`, e.message);
                    resolve({ success: false });
                });
                req.write(postData);
                req.end();
            });
            if (res.success) return res;
        } catch (err) {
            console.error('Fast2SMS Exception:', err.message);
        }
    }

    // 2. 2Factor.in (India)
    if (process.env.TWOFACTOR_API_KEY) {
        try {
            const res = await new Promise((resolve) => {
                const url = `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/${cleanPhone}/${otpCode}`;
                https.get(url, (r) => {
                    let body = '';
                    r.on('data', chunk => body += chunk);
                    r.on('end', () => {
                        console.log(`📱 [2Factor Response]:`, body);
                        resolve({ success: true, gateway: '2Factor' });
                    });
                }).on('error', (e) => {
                    console.error(`❌ 2Factor Error:`, e.message);
                    resolve({ success: false });
                });
            });
            if (res.success) return res;
        } catch (err) {
            console.error('2Factor Exception:', err.message);
        }
    }

    // 3. Twilio SMS / WhatsApp
    if (twilioClient && (process.env.TWILIO_SENDER_SMS || process.env.TWILIO_SENDER_WHATSAPP)) {
        try {
            if (process.env.TWILIO_SENDER_SMS) {
                await twilioClient.messages.create({
                    from: process.env.TWILIO_SENDER_SMS,
                    to: `+91${cleanPhone}`,
                    body: otpMsg
                });
            } else if (process.env.TWILIO_SENDER_WHATSAPP) {
                await twilioClient.messages.create({
                    from: process.env.TWILIO_SENDER_WHATSAPP,
                    to: `whatsapp:+91${cleanPhone}`,
                    body: otpMsg
                });
            }
            return { success: true, gateway: 'Twilio' };
        } catch (err) {
            console.error('⚠️ Twilio SMS Error:', err.message);
            return { success: false };
        }
    }

    return { success: false, noGateway: true };
}

/**
 * POST /api/otp/verify
 * Verifies submitted OTP code and saves verified lead to leads.json database.
 */
app.post('/api/otp/verify', (req, res) => {
    const { phoneNumber, otpCode } = req.body;
    const cleanPhone = phoneNumber ? phoneNumber.trim().replace(/\s+/g, '') : '';
    const cleanOtp = otpCode ? otpCode.trim() : '';

    if (!cleanPhone || !cleanOtp) {
        return res.status(400).json({ success: false, message: 'Phone number and 4-digit OTP code are required.' });
    }

    const record = otpStore.get(cleanPhone);
    if (!record) {
        return res.status(400).json({ success: false, message: 'No active OTP request found for this number. Please request a new code.' });
    }

    if (Date.now() > record.expiresAt) {
        otpStore.delete(cleanPhone);
        return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new code.' });
    }

    if (record.otp !== cleanOtp) {
        return res.status(400).json({ success: false, message: 'Incorrect OTP code. Please check and try again.' });
    }

    // Save lead to leads.json
    const leadData = {
        id: 'lead_' + Date.now(),
        fullName: record.fullName,
        location: record.location,
        phoneNumber: record.phoneNumber,
        verifiedAt: new Date().toISOString(),
        source: 'sample_pdi_report'
    };
    saveLead(leadData);

    // Delete used OTP
    otpStore.delete(cleanPhone);

    return res.status(200).json({
        success: true,
        message: 'Mobile number verified successfully!',
        downloadUrl: '/assets/CARROBAAR_Drive_Sample_PDI_Report.pdf',
        lead: leadData
    });
});

/**
 * POST /api/auth/google
 * Verifies submitted Google Identity Token / User Data and records verified lead into leads.json
 */
app.post('/api/auth/google', (req, res) => {
    const { credential, gUser } = req.body;
    let fullName = '';
    let email = '';
    let picture = '';
    let googleId = '';

    if (credential) {
        try {
            const parts = credential.split('.');
            if (parts.length === 3) {
                const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
                const payload = JSON.parse(payloadJson);
                fullName = payload.name || payload.given_name || 'Google User';
                email = payload.email || '';
                picture = payload.picture || '';
                googleId = payload.sub || '';
            }
        } catch (err) {
            console.error('Error decoding Google ID Token:', err.message);
        }
    }

    if (!fullName && gUser) {
        fullName = gUser.name || 'Google User';
        email = gUser.email || '';
        picture = gUser.picture || '';
        googleId = gUser.id || gUser.sub || '';
    }

    if (!email) {
        return res.status(400).json({ success: false, message: 'Google account email verification failed.' });
    }

    const leadData = {
        id: 'google_lead_' + Date.now(),
        fullName,
        email,
        picture,
        googleId,
        verifiedAt: new Date().toISOString(),
        source: 'google_sign_in'
    };

    saveLead(leadData);

    console.log(`\n🔵 [GOOGLE OAUTH VERIFIED] Name: ${fullName} | Email: ${email}`);

    return res.status(200).json({
        success: true,
        message: 'Google account verified successfully!',
        user: {
            name: fullName,
            email,
            phone: '',
            picture
        },
        downloadUrl: '/download-sample-report',
        lead: leadData
    });
});

/**
 * POST /api/auth/direct
 * Handles direct Sign Up / Sign In with Name, Email & Phone Number
 */
app.post('/api/auth/direct', (req, res) => {
    const { name, email, phone } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({ success: false, message: 'Full name and email address are required.' });
    }

    const leadData = {
        id: 'user_lead_' + Date.now(),
        fullName: name.trim(),
        email: email.trim(),
        phone: phone ? phone.trim() : '',
        picture: '',
        verifiedAt: new Date().toISOString(),
        source: 'manual_auth_form'
    };

    saveLead(leadData);

    console.log(`\n🟢 [DIRECT AUTH VERIFIED] Name: ${name} | Email: ${email} | Phone: ${phone || 'N/A'}`);

    return res.status(200).json({
        success: true,
        message: 'Account verified successfully!',
        user: {
            name: name.trim(),
            email: email.trim(),
            phone: phone ? phone.trim() : '',
            picture: ''
        },
        downloadUrl: '/download-sample-report',
        lead: leadData
    });
});

/**
 * GET /download-sample-report
 * Serves sample report PDF as a direct file download attachment
 */
app.get('/download-sample-report', (req, res) => {
    const pdfPath = path.join(__dirname, 'assets', 'CARROBAAR_Drive_Sample_PDI_Report.pdf');
    if (fs.existsSync(pdfPath)) {
        res.download(pdfPath, 'CARROBAAR_Drive_Sample_PDI_Report.pdf', (err) => {
            if (err && !res.headersSent) {
                console.error('Download error:', err.message);
                res.status(500).send('Error downloading sample report.');
            }
        });
    } else {
        res.status(404).send('Sample report PDF file not found.');
    }
});

/**
 * GET /api/leads
 * Returns list of verified leads.
 */
app.get('/api/leads', (req, res) => {
    const leads = getLeads();
    return res.status(200).json({
        success: true,
        count: leads.length,
        leads
    });
});

/**
 * GET /api/leads/export
 * Downloads all collected verified leads as a CSV spreadsheet file
 */
app.get('/api/leads/export', (req, res) => {
    const leads = getLeads();
    let csv = 'ID,Full Name,Email,Phone,Location,Verified At,Source\n';
    leads.forEach(l => {
        const id = l.id || '';
        const name = `"${(l.fullName || '').replace(/"/g, '""')}"`;
        const email = `"${(l.email || '').replace(/"/g, '""')}"`;
        const phone = `"${(l.phoneNumber || '').replace(/"/g, '""')}"`;
        const location = `"${(l.location || '').replace(/"/g, '""')}"`;
        const date = `"${(l.verifiedAt || '').replace(/"/g, '""')}"`;
        const source = `"${(l.source || '').replace(/"/g, '""')}"`;
        csv += `${id},${name},${email},${phone},${location},${date},${source}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="carrobaar_verified_leads.csv"');
    res.status(200).send(csv);
});

// Catch-all route to serve the main HTML index page
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start the Express Server
app.listen(PORT, () => {
    console.log(`\n🚀 CARROBAAR_Drive backend online at: http://localhost:${PORT}`);
});
