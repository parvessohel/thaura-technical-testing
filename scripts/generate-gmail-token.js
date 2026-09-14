const fs = require('fs');
const http = require('http');
const path = require('path');
const { google } = require('googleapis');

const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');
const port = 3000;
const redirectUri = `http://localhost:${port}/oauth2callback`;
const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

function readOAuthClient(filePath) {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const credentials = raw.installed || raw.web;

    if (!credentials?.client_id || !credentials?.client_secret) {
        throw new Error('The OAuth JSON does not contain an installed or web client with client_id and client_secret.');
    }

    return credentials;
}

function updateEnv(values) {
    const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const lines = current.split(/\r?\n/).filter(Boolean);

    for (const [key, value] of Object.entries(values)) {
        const index = lines.findIndex((line) => line.startsWith(`${key}=`));
        const line = `${key}=${value}`;
        if (index >= 0) {
            lines[index] = line;
        } else {
            lines.push(line);
        }
    }

    fs.writeFileSync(envPath, `${lines.join('\n')}\n`, { encoding: 'utf8', mode: 0o600 });
}

function getOAuthCode(requestUrl) {
    const url = new URL(requestUrl, redirectUri);
    return url.searchParams.get('code');
}

async function main() {
    const jsonPath = process.argv[2];
    if (!jsonPath) {
        throw new Error('Usage: node scripts/generate-gmail-token.js "C:\\path\\to\\OAuth-client.json"');
    }

    const credentials = readOAuthClient(path.resolve(jsonPath));
    const auth = new google.auth.OAuth2(
        credentials.client_id,
        credentials.client_secret,
        redirectUri
    );
    const authorizationUrl = auth.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes
    });

    const server = http.createServer(async (request, response) => {
        if (!request.url.startsWith('/oauth2callback')) {
            response.writeHead(404);
            response.end('Not found');
            return;
        }

        const error = new URL(request.url, redirectUri).searchParams.get('error');
        if (error) {
            response.writeHead(400);
            response.end(`Google authorization failed: ${error}`);
            server.close();
            throw new Error(`Google authorization failed: ${error}`);
        }

        const code = getOAuthCode(request.url);
        if (!code) {
            response.writeHead(400);
            response.end('Missing authorization code.');
            return;
        }

        try {
            const { tokens } = await auth.getToken(code);
            if (!tokens.refresh_token) {
                throw new Error('Google did not return a refresh token. Run the script again and approve the consent screen.');
            }

            updateEnv({
                GMAIL_CLIENT_ID: credentials.client_id,
                GMAIL_CLIENT_SECRET: credentials.client_secret,
                GMAIL_REDIRECT_URI: redirectUri,
                GMAIL_REFRESH_TOKEN: tokens.refresh_token
            });

            response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            response.end('Authorization complete. You can close this browser tab.');
            console.log(`Gmail OAuth values saved to ${envPath}`);
            server.close(() => process.exit(0));
        } catch (tokenError) {
            response.writeHead(500);
            response.end('Could not exchange the authorization code. Check the terminal for details.');
            server.close();
            throw tokenError;
        }
    });

    server.listen(port, '127.0.0.1', () => {
        console.log('Open this URL in your browser and authorize the dedicated Gmail account:');
        console.log(authorizationUrl);
        console.log(`Waiting for the OAuth callback on ${redirectUri}`);
    });
}

main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
});