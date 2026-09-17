const { loginViaOtp } = require('./thaura-login');

const [, , email, saveStatePath] = process.argv;

if (!email || !saveStatePath) {
    console.error('Usage: node scripts/login-as.js <email> <saveStatePath>');
    process.exit(1);
}

loginViaOtp({ email, saveStatePath })
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error.message || error);
        process.exit(1);
    });
