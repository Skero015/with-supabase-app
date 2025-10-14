/**
 * Test script to verify the complete sign-up and redirect flow
 * Run with: npx tsx test-signup-flow.ts
 */

import { chromium } from '@playwright/test';

async function testSignUpFlow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Starting sign-up flow test...\n');

    // Navigate to sign-up page
    console.log('1️⃣  Navigating to sign-up page...');
    await page.goto('http://localhost:3005/auth/sign-up');
    await page.waitForLoadState('networkidle');

    // Generate unique email
    const timestamp = Date.now();
    const email = `test-agent-${timestamp}@example.com`;
    const password = 'TestPass123';

    console.log(`2️⃣  Filling form with email: ${email}`);
    
    // Fill form
    await page.fill('input[type="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.fill('input[id="repeat-password"]', password);
    await page.selectOption('select[id="role"]', 'agent');

    // Submit form
    console.log('3️⃣  Submitting sign-up form...');
    await page.click('button[type="submit"]');

    // Wait for redirect to success page
    console.log('4️⃣  Waiting for redirect to success page...');
    await page.waitForURL('**/auth/sign-up-success**', { timeout: 15000 });
    console.log('✅ Redirected to success page');

    // Wait 8 seconds on success page
    console.log('5️⃣  Waiting 8 seconds on success page...');
    await page.waitForTimeout(8000);

    // Check current URL
    const currentUrl = page.url();
    console.log(`6️⃣  Current URL after 8 seconds: ${currentUrl}`);

    // Wait for final redirect
    console.log('7️⃣  Waiting for redirect to dashboard...');
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    console.log(`8️⃣  Final URL: ${finalUrl}`);

    // Verify we're on the agent dashboard
    if (finalUrl.includes('/dashboard/agent')) {
      console.log('✅ SUCCESS: Reached agent dashboard without redirect loop!');
    } else if (finalUrl.includes('/auth/login')) {
      console.log('❌ FAILURE: Redirected back to login page (redirect loop detected)');
    } else {
      console.log(`⚠️  WARNING: Unexpected URL: ${finalUrl}`);
    }

    // Check for any error messages
    const errorElement = await page.$('text=/error|failed|wrong/i');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log(`⚠️  Error message found: ${errorText}`);
    }

    // Take screenshot
    await page.screenshot({ path: 'test-signup-final.png', fullPage: true });
    console.log('📸 Screenshot saved to test-signup-final.png');

    // Wait a bit to observe
    console.log('\n⏳ Waiting 5 seconds for observation...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: 'test-signup-error.png', fullPage: true });
    console.log('📸 Error screenshot saved to test-signup-error.png');
  } finally {
    await browser.close();
    console.log('\n✅ Test completed');
  }
}

testSignUpFlow();

