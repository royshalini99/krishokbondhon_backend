require('dotenv').config();
const jwt = require('jsonwebtoken');

/**
 * Prints a JWT you can paste into Postman/curl as a Bearer token, so you
 * can test the community/Q&A endpoints before the real Postgres-backed
 * auth service exists. Run: node scripts/generateTestToken.js
 *
 * Pass --role=expert to get a token that lets addAnswer() mark the
 * answer as a verified expert reply.
 */
const role = process.argv.includes('--role=expert') ? 'expert' : 'farmer';

const token = jwt.sign(
  {
    id: 'u_test_1',
    name: role === 'expert' ? 'Dr. Test Expert' : 'Test Farmer',
    village: 'Katigorah, Cachar',
    role,
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

console.log(`\nRole: ${role}\nToken:\n${token}\n`);
console.log('Use it as: Authorization: Bearer <token>\n');
