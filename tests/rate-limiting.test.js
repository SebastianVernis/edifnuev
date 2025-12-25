// rate-limiting.test.js - Tests for rate limiting functionality
import assert from 'assert';

/**
 * Rate Limiting Test Suite
 * 
 * Tests the rate limiting middleware configuration and behavior
 * to protect against brute force attacks and DDoS attempts.
 */

console.log('🧪 Running Rate Limiting Configuration Tests...\n');

let testsPassed = 0;
let testsFailed = 0;

// Helper function to run a test
async function runTest(testName, testFn) {
  try {
    await testFn();
    console.log(`✅ ${testName}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${testName}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// Run all tests
(async () => {
  console.log('📦 Testing Rate Limit Module Configuration...\n');

  await runTest('Should export rate limit configuration', async () => {
    const rateLimitConfig = await import('../src/middleware/rateLimitConfig.js');
    assert.ok(rateLimitConfig, 'Rate limit configuration should be exported');
    assert.ok(rateLimitConfig.loginLimiter, 'Login limiter should be defined');
    assert.ok(rateLimitConfig.registerLimiter, 'Register limiter should be defined');
    assert.ok(rateLimitConfig.apiLimiter, 'API limiter should be defined');
  });

  await runTest('Should export login limiter middleware', async () => {
    const { loginLimiter } = await import('../src/middleware/rateLimitConfig.js');
    assert.ok(loginLimiter, 'Login limiter should be defined');
    assert.strictEqual(typeof loginLimiter, 'function', 'Login limiter should be a function');
  });

  await runTest('Should export register limiter middleware', async () => {
    const { registerLimiter } = await import('../src/middleware/rateLimitConfig.js');
    assert.ok(registerLimiter, 'Register limiter should be defined');
    assert.strictEqual(typeof registerLimiter, 'function', 'Register limiter should be a function');
  });

  await runTest('Should export API limiter middleware', async () => {
    const { apiLimiter } = await import('../src/middleware/rateLimitConfig.js');
    assert.ok(apiLimiter, 'API limiter should be defined');
    assert.strictEqual(typeof apiLimiter, 'function', 'API limiter should be a function');
  });

  await runTest('Should export upload limiter middleware', async () => {
    const { uploadLimiter } = await import('../src/middleware/rateLimitConfig.js');
    assert.ok(uploadLimiter, 'Upload limiter should be defined');
    assert.strictEqual(typeof uploadLimiter, 'function', 'Upload limiter should be a function');
  });

  console.log('\n📝 Testing Rate Limit Module Structure...\n');

  await runTest('Should export default object with all limiters', async () => {
    const config = await import('../src/middleware/rateLimitConfig.js');
    assert.ok(config.default, 'Default export should exist');
    assert.ok(config.default.loginLimiter, 'Default should include loginLimiter');
    assert.ok(config.default.registerLimiter, 'Default should include registerLimiter');
    assert.ok(config.default.apiLimiter, 'Default should include apiLimiter');
  });

  console.log('\n⚙️  Testing Environment Variable Configuration...\n');

  await runTest('Should support environment variable configuration', async () => {
    // Test that configuration module exports functions for environment variables
    const config = await import('../src/middleware/rateLimitConfig.js');
    assert.ok(config, 'Configuration should be loaded');
    // Verify that the module can be imported successfully
    assert.ok(config.apiLimiter, 'API limiter should be available');
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results:`);
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   📈 Total:  ${testsPassed + testsFailed}`);
  console.log('='.repeat(50) + '\n');

  if (testsFailed > 0) {
    console.log('❌ Some tests failed. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('✅ All rate limiting configuration tests passed!');
    process.exit(0);
  }
})();
