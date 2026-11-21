import { spawn } from 'node:child_process';
import { db } from '../src/db/database.js';

function runClientSession(inputs) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['client.js'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let fullOutput = '';
    child.stdout.on('data', (data) => {
      fullOutput += data.toString();
    });
    child.stderr.on('data', (data) => {
      fullOutput += data.toString();
    });

    // Feed inputs sequentially with slight delay
    let i = 0;
    const interval = setInterval(() => {
      if (i < inputs.length) {
        child.stdin.write(inputs[i] + '\n');
        i++;
      } else {
        clearInterval(interval);
      }
    }, 400);

    const timer = setTimeout(() => {
      child.kill();
      resolve({ code: -1, output: fullOutput });
    }, 8000);

    child.on('close', (code) => {
      clearTimeout(timer);
      clearInterval(interval);
      resolve({ code, output: fullOutput });
    });
  });
}

async function runTests() {
  console.log('=== TEST 1: Wrong Password Loops Back to Username Prompt ===');
  // 1: Login, 'yusfi', 'wrongpassword', 'batal', '3' (exit)
  const res1 = await runClientSession(['1', 'yusfi', 'wrongpassword123', 'batal', '3']);
  console.log('Test 1 Output summary:');
  const hasWrongPwMsg = res1.output.includes('Login gagal: Username atau password salah');
  const hasPromptAgain = res1.output.includes('Silakan masukkan kembali username dan kata sandi yang benar');
  console.log('- Login failure detected:', hasWrongPwMsg);
  console.log('- Prompted user to re-enter credentials:', hasPromptAgain);

  // Check database that no fake user was created
  const fakeUserCheck = db.prepare("SELECT * FROM users WHERE username = 'wrongpassword123'").all();
  console.log('- Fake user created? (should be 0):', fakeUserCheck.length);

  if (!hasWrongPwMsg || !hasPromptAgain || fakeUserCheck.length > 0) {
    throw new Error('Test 1 failed!');
  }
  console.log('>>> TEST 1 PASSED! ✓\n');

  console.log('=== TEST 2: Register New User & Immediate Auto-Login ===');
  const testUser = `test_${Date.now()}`;
  const testPass = 'rahasia123';
  // 2: Register, testUser, testPass, 6 (exit main menu)
  const res2 = await runClientSession(['2', testUser, testPass, '6']);
  const hasRegSuccess = res2.output.includes(`Akun "${testUser}" berhasil didaftarkan`);
  const hasAutoLogin = res2.output.includes('Melakukan login otomatis');
  const hasWelcome = res2.output.includes(`Selamat datang di Watchlist Tracker, ${testUser}!`);
  const hasMainMenu = res2.output.includes('MENU UTAMA WATCHLIST TRACKER');

  console.log('- Register success msg:', hasRegSuccess);
  console.log('- Auto-login message:', hasAutoLogin);
  console.log('- Welcome banner:', hasWelcome);
  console.log('- Main menu shown:', hasMainMenu);

  if (!hasRegSuccess || !hasAutoLogin || !hasWelcome || !hasMainMenu) {
    console.log('Full Output:\n', res2.output);
    throw new Error('Test 2 failed!');
  }
  console.log('>>> TEST 2 PASSED! ✓\n');

  // Clean up test user
  db.prepare("DELETE FROM users WHERE username = ?").run(testUser);
  console.log(`Cleaned up temporary user: ${testUser}`);

  console.log('\n=============================================');
  console.log('ALL AUTH FLOW TESTS COMPLETED SUCCESSFULLY! ✓');
  console.log('=============================================');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
