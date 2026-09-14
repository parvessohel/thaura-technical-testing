const path = require('path');
const { google } = require('googleapis');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

function decodeBase64Url(value = '') {
    return Buffer.from(
        (value || '').replace(/-/g, '+').replace(/_/g, '/'),
        'base64'
    ).toString('utf8');
}

function getHeaderValue(headers, name) {
    const header = (headers || []).find((entry) => (entry.name || '').toLowerCase() === name.toLowerCase());
    return header ? header.value : '';
}

function extractOtpFromText(text = '') {
    const normalized = String(text)
        .replace(/<br\s*\/?\s*>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const patterns = [
        /(?:verification|verify|code|otp|one[- ]time[- ]code|login[- ]code)[^\d]{0,24}(\d{6})/i,
        /(?:\b|[^\d])(\d{6})(?:\b|[^\d])/g
    ];

    for (const pattern of patterns) {
        const matches = normalized.match(pattern);
        if (!matches) continue;

        for (const match of matches) {
            const digits = String(match).match(/\d{6}/);
            if (digits && digits[0]) {
                return digits[0];
            }
        }
    }

    return null;
}

async function getGmailClient() {
    const {
        GMAIL_CLIENT_ID,
        GMAIL_CLIENT_SECRET,
        GMAIL_REFRESH_TOKEN,
        GMAIL_REDIRECT_URI
    } = process.env;

    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
        throw new Error('Missing Gmail OAuth environment variables. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN in .env.');
    }

    const oauth2Client = new google.auth.OAuth2(
        GMAIL_CLIENT_ID,
        GMAIL_CLIENT_SECRET,
        GMAIL_REDIRECT_URI || 'http://localhost'
    );

    oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
    return google.gmail({ version: 'v1', auth: oauth2Client });
}

async function getLatestGmailMessage({ account, searchTerms = 'Thaura', maxResults = 5, maxAgeDays = 7, after } = {}) {
    const gmail = await getGmailClient();
    const search = [
        account ? `to:${account}` : '',
        searchTerms ? `"${searchTerms}"` : '',
        'in:inbox',
        `newer_than:${maxAgeDays}d`,
        after ? `after:${Math.floor(new Date(after).getTime() / 1000)}` : ''
    ]
        .filter(Boolean)
        .join(' ');

    const listResponse = await gmail.users.messages.list({
        userId: 'me',
        q: search,
        maxResults
    });

    const message = (listResponse.data.messages || [])[0];
    if (!message) {
        return null;
    }

    const messageResponse = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full'
    });

    return messageResponse.data;
}

async function fetchLatestOtpCode({
    account = process.env.GMAIL_ACCOUNT || process.env.THAURA_EMAIL,
    searchTerms = 'Thaura',
    maxAgeDays = 7,
    after
} = {}) {
    const message = await getLatestGmailMessage({ account, searchTerms, maxAgeDays, after });
    if (!message) {
        throw new Error(`No inbox message found for ${account || 'the configured Gmail account'} matching "${searchTerms}" within ${maxAgeDays} days.`);
    }

    const headers = message.payload?.headers || [];
    const subject = getHeaderValue(headers, 'Subject') || '';
    const from = getHeaderValue(headers, 'From') || '';

    let bodyText = '';
    const parts = message.payload?.parts || [message.payload];

    for (const part of parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
            const body = part.body?.data;
            if (body) {
                bodyText += decodeBase64Url(body) + '\n';
            }
        }

        if (part.parts) {
            for (const nestedPart of part.parts) {
                if ((nestedPart.mimeType === 'text/plain' || nestedPart.mimeType === 'text/html') && nestedPart.body?.data) {
                    bodyText += decodeBase64Url(nestedPart.body.data) + '\n';
                }
            }
        }
    }

    const otp = extractOtpFromText(`${subject}\n${from}\n${bodyText}`);
    if (!otp) {
        throw new Error(`No 6-digit code found in the latest Thaura email. Subject="${subject}" From="${from}"`);
    }

    return otp;
}

if (require.main === module) {
    fetchLatestOtpCode()
        .then((code) => {
            console.log(code);
        })
        .catch((error) => {
            console.error(error.message || error);
            process.exit(1);
        });
}

module.exports = {
    fetchLatestOtpCode,
    extractOtpFromText,
    getGmailClient,
    getLatestGmailMessage
};
