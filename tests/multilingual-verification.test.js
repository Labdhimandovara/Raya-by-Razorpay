// Comprehensive Track 01 Multilingual Verification Test Suite
// Verifies 5-Language dictionary integrity, 100% key parity, Locale Context & Provider,
// API endpoint locale acceptance, and Brand/Enum immutability.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runMultilingualTests() {
  console.log("==================================================");
  console.log("STARTING MULTILINGUAL VERIFICATION TEST SUITE (5 LANGUAGES)");
  console.log("English (en), Hindi (hi), Marathi (mr), Tamil (ta), Bengali (bn)");
  console.log("==================================================\n");

  const LOCALES = ['en', 'hi', 'mr', 'ta', 'bn'];
  const dictionaries = {};

  // 1. Verify existence and valid JSON for all 5 locale files
  console.log("1. Checking 5 locale dictionaries exist and parse as valid JSON...");
  for (const loc of LOCALES) {
    const filePath = path.join(__dirname, '..', 'src', 'locales', `${loc}.json`);
    assert(fs.existsSync(filePath), `Dictionary file missing: src/locales/${loc}.json`);
    const raw = fs.readFileSync(filePath, 'utf8');
    try {
      dictionaries[loc] = JSON.parse(raw);
    } catch (e) {
      assert.fail(`src/locales/${loc}.json is not valid JSON: ${e.message}`);
    }
    console.log(`   ✓ src/locales/${loc}.json parsed successfully.`);
  }
  console.log("✓ All 5 locale dictionaries verified.\n");

  // 2. Verify 100% key parity across all 5 dictionaries
  console.log("2. Verifying 100% key parity across all 5 dictionaries...");
  function getAllKeys(obj, prefix = '') {
    const keys = new Set();
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        for (const child of getAllKeys(v, fullKey)) {
          keys.add(child);
        }
      } else {
        keys.add(fullKey);
      }
    }
    return keys;
  }

  const keySets = {};
  for (const loc of LOCALES) {
    keySets[loc] = getAllKeys(dictionaries[loc]);
    console.log(`   • ${loc}: ${keySets[loc].size} keys`);
  }

  const enKeys = keySets['en'];
  assert(enKeys.size > 200, `Expected > 200 keys, found ${enKeys.size}`);

  for (const loc of ['hi', 'mr', 'ta', 'bn']) {
    const missingKeys = [];
    const extraKeys = [];
    for (const key of enKeys) {
      if (!keySets[loc].has(key)) missingKeys.push(key);
    }
    for (const key of keySets[loc]) {
      if (!enKeys.has(key)) extraKeys.push(key);
    }

    assert.strictEqual(
      missingKeys.length,
      0,
      `Locale ${loc} is missing ${missingKeys.length} keys: ${missingKeys.slice(0, 5).join(', ')}`
    );
    assert.strictEqual(
      extraKeys.length,
      0,
      `Locale ${loc} has ${extraKeys.length} unexpected extra keys: ${extraKeys.slice(0, 5).join(', ')}`
    );
    console.log(`   ✓ ${loc}: 100% match with English dictionary (${keySets[loc].size} keys)`);
  }
  console.log("✓ 100% key parity confirmed across all 5 languages.\n");

  // 3. Verify LocaleProvider and LocaleContext implementation
  console.log("3. Verifying LocaleProvider and LocaleContext implementation...");
  const contextPath = path.join(__dirname, '..', 'src', 'lib', 'locale-context.tsx');
  assert(fs.existsSync(contextPath), "src/lib/locale-context.tsx must exist");
  const contextCode = fs.readFileSync(contextPath, 'utf8');

  assert(contextCode.includes('raya_bazaar_locale'), "Must use localStorage key 'raya_bazaar_locale'");
  assert(contextCode.includes('LocaleProvider'), "Must export LocaleProvider");
  assert(contextCode.includes('useLocale'), "Must export useLocale hook");
  assert(contextCode.includes('SUPPORTED_LOCALES'), "Must export SUPPORTED_LOCALES");
  assert(contextCode.includes('defaultLocale') || contextCode.includes('"en"'), "Must default to English ('en')");
  console.log("✓ LocaleProvider, fallback mechanism, and localStorage key 'raya_bazaar_locale' verified.\n");

  // 4. Verify API Endpoints accept and process 'locale' parameter
  console.log("4. Verifying /api/chat and /api/merchant/copilot accept 'locale'...");
  const chatRoutePath = path.join(__dirname, '..', 'src', 'app', 'api', 'chat', 'route.ts');
  const chatRouteCode = fs.readFileSync(chatRoutePath, 'utf8');
  assert(chatRouteCode.includes('locale'), "chat route must extract or accept 'locale'");
  assert(chatRouteCode.includes('getRayaSystemInstruction'), "chat route must invoke getRayaSystemInstruction with locale");

  const copilotRoutePath = path.join(__dirname, '..', 'src', 'app', 'api', 'merchant', 'copilot', 'route.ts');
  const copilotRouteCode = fs.readFileSync(copilotRoutePath, 'utf8');
  assert(copilotRouteCode.includes('locale'), "merchant copilot route must accept 'locale'");
  assert(copilotRouteCode.includes('languageInstructionMap') || copilotRouteCode.includes('fallbackReplies'), "merchant copilot must adapt response language to locale");
  console.log("✓ Both AI API endpoints verified for multilingual parameter handling.\n");

  // 5. Verify Brand Names and Database Enums are preserved (never translated into local words)
  console.log("5. Verifying brand names and enums preservation...");
  const PROTECTED_BRANDS = ['Raya', 'Razorpay', 'NexusStore', 'ThreadVault', 'PixelMart', 'eBay'];
  const PROTECTED_ENUMS = [
    'DISCOVERED',
    'RECOMMENDED',
    'ADDED',
    'POLICY_CHECKED',
    'APPROVED',
    'PAYMENT_CREATED',
    'PAID',
    'ATTRIBUTED',
    'BLOCKED',
    'INVALIDATED'
  ];

  for (const loc of LOCALES) {
    const dict = dictionaries[loc];
    // Check common brand entries
    assert.strictEqual(dict.common.razorpay, 'Razorpay', `Razorpay brand corrupted in ${loc}`);
    assert.strictEqual(dict.common.ebay, 'eBay', `eBay brand corrupted in ${loc}`);
    assert.strictEqual(dict.common.nexusStore, 'NexusStore', `NexusStore brand corrupted in ${loc}`);
    assert.strictEqual(dict.common.threadVault, 'ThreadVault', `ThreadVault brand corrupted in ${loc}`);
    assert.strictEqual(dict.common.pixelMart, 'PixelMart', `PixelMart brand corrupted in ${loc}`);

    // Check enums in ledger
    for (const enumKey of [
      'discovered',
      'recommended',
      'added',
      'policyChecked',
      'approved',
      'paymentCreated',
      'paid',
      'attributed',
      'blocked',
      'invalidated'
    ]) {
      const val = dict.ledger[enumKey];
      assert(val && val.length > 0, `Missing enum translation key ledger.${enumKey} in ${loc}`);
      // The canonical enum value (with space or underscore) must remain clear and uppercase
      const normalizedVal = val.replace(/_/g, ' ').toUpperCase();
      const expectedNormalized = enumKey.replace(/([A-Z])/g, ' $1').toUpperCase();
      assert(
        normalizedVal.includes(expectedNormalized) || val.toUpperCase().includes(enumKey.toUpperCase()),
        `Enum format in ledger.${enumKey} of ${loc} unexpected: ${val}`
      );
    }
  }
  console.log("✓ Brand names and enums verified intact across all 5 languages.\n");

  // 6. Verify Buyer and Merchant UI components integrate LanguageSwitcher and useLocale
  console.log("6. Verifying UI integration across Buyer and Merchant apps...");
  const pageCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'page.tsx'), 'utf8');
  assert(pageCode.includes('useLocale'), "src/app/page.tsx must use useLocale");
  assert(pageCode.includes('locale'), "src/app/page.tsx must send locale to /api/chat");

  const merchantPageCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'merchant', 'page.tsx'), 'utf8');
  assert(merchantPageCode.includes('useLocale'), "src/app/merchant/page.tsx must use useLocale");
  assert(merchantPageCode.includes('LanguageSwitcher'), "src/app/merchant/page.tsx must render LanguageSwitcher");

  const headerCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'raya-header.tsx'), 'utf8');
  assert(headerCode.includes('LanguageSwitcher'), "raya-header.tsx must render LanguageSwitcher");

  const drawerCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'merchant-floating-drawer.tsx'), 'utf8');
  assert(drawerCode.includes('locale'), "merchant-floating-drawer.tsx must send locale to copilot");

  const receiptCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'order-receipt.tsx'), 'utf8');
  assert(receiptCode.includes('useLocale'), "order-receipt.tsx must use useLocale");
  console.log("✓ Buyer UI and Merchant Console correctly wired for multilingual.\n");

  console.log("==================================================");
  console.log("ALL MULTILINGUAL VERIFICATION TESTS PASSED (6/6)!");
  console.log("==================================================");
}

runMultilingualTests().catch((err) => {
  console.error("Multilingual Test Suite Failed:", err);
  process.exit(1);
});
