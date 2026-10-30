const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
let env = '';
try {
  env = fs.readFileSync(envPath, 'utf8');
} catch {
  env = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
}

const access = crypto.randomBytes(48).toString('base64url');
const refresh = crypto.randomBytes(48).toString('base64url');

const set = (src, key, value) => {
  const re = new RegExp(`^${key}=.*$`, 'm');
  return re.test(src) ? src.replace(re, `${key}=${value}`) : `${src}\n${key}=${value}`;
};

env = set(env, 'JWT_ACCESS_SECRET', access);
env = set(env, 'JWT_REFRESH_SECRET', refresh);
env = set(env, 'NODE_ENV', 'development');
env = set(env, 'FRONTEND_URL', 'http://localhost:8080,http://localhost:3000');

fs.writeFileSync(envPath, env);
console.log('Wrote strong JWT secrets to backend/.env');
