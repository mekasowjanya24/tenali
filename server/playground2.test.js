// The code playground must never run submitted code directly on the host. These
// tests prove it with programs that try to write a file: if one ever ran, the
// file would exist.
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

const compiler = require('./compiler');

const marker = path.join(os.tmpdir(), `playground2-must-not-exist-${process.pid}`);
const evil = {
  python: `import os\nopen(${JSON.stringify(marker)}, 'w').write('ran')\nos.system('id')`,
  javascript: `require('fs').writeFileSync(${JSON.stringify(marker)}, 'ran')`,
  c: `#include <stdio.h>\nint main(){FILE*f=fopen(${JSON.stringify(marker)},"w");fputs("ran",f);return 0;}`,
};

afterAll(() => { try { fs.unlinkSync(marker); } catch { /* never created */ } });

describe('compiler.executeCode', () => {
  it('is not sandboxed, so nothing may run', () => {
    expect(compiler.isSandboxed()).toBe(false);
  });

  for (const [language, code] of Object.entries(evil)) {
    it(`refuses ${language} code and does not run it`, async () => {
      const result = await compiler.executeCode(language, code, '', 5000);
      expect(result.status).toBe('DISABLED');
      expect(result.stdout).toBe('');
      expect(fs.existsSync(marker)).toBe(false);
    });
  }

  it('refuses even with a huge timeout and the language spelled differently', async () => {
    const result = await compiler.executeCode(' PY ', evil.python, '', 9999999);
    expect(result.status).toBe('DISABLED');
    expect(fs.existsSync(marker)).toBe(false);
  });
});

describe('POST /api/playground2/run', () => {
  let app;
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-not-the-default-0123456789abcdef';
    process.env.MONGO_URI = 'mongodb://127.0.0.1:1/none';
    app = require('./index');
  });

  it('needs a signed-in user: no token is 401 and nothing runs', async () => {
    const res = await request(app).post('/api/playground2/run').send({ language: 'python', code: evil.python });
    expect(res.status).toBe(401);
    expect(fs.existsSync(marker)).toBe(false);
  });

  it('a forged token with the public default secret is still refused', async () => {
    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ username: 'sudarshan' }, 'tenali-dev-secret-change-me');
    const res = await request(app).post('/api/playground2/run').set('Authorization', `Bearer ${forged}`)
      .send({ language: 'python', code: evil.python });
    expect(res.status).toBe(401);
    expect(fs.existsSync(marker)).toBe(false);
  });

  it('the languages list says the playground is off', async () => {
    const res = await request(app).get('/api/playground2/languages');
    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(false);
  });
});
