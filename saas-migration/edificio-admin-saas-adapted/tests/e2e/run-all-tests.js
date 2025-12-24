/**
 * Master E2E Test Runner
 * Ejecuta todos los tests y genera reportes consolidados
 */

import { runAllTests as runAuthTests } from './01-auth.test.js';
import { runAllTests as runMultitenancyTests } from './02-multitenancy.test.js';
import { runAllTests as runSecurityTests } from './03-security.test.js';
import { runAllTests as runApiTests } from './04-api-endpoints.test.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

const consolidatedResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  totalPassed: 0,
  totalFailed: 0,
  coverage: 0,
  avgResponseTime: 0,
  dataLeaks: 0,
  vulnerabilities: {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  },
  suites: {}
};

async function runAllTestSuites() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 SMARTBUILDING SAAS - E2E TESTING SUITE');
  console.log('='.repeat(70));
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(70));
  
  const startTime = Date.now();
  
  // Suite 1: Authentication
  console.log('\n\n📦 SUITE 1/4: Authentication Tests');
  const authResults = await runAuthTests();
  consolidatedResults.suites.auth = authResults;
  consolidatedResults.totalTests += authResults.total;
  consolidatedResults.totalPassed += authResults.passed;
  consolidatedResults.totalFailed += authResults.failed;
  
  // Suite 2: Multitenancy
  console.log('\n\n📦 SUITE 2/4: Multitenancy & Data Isolation Tests');
  const multitenancyResults = await runMultitenancyTests();
  consolidatedResults.suites.multitenancy = multitenancyResults;
  consolidatedResults.totalTests += multitenancyResults.total;
  consolidatedResults.totalPassed += multitenancyResults.passed;
  consolidatedResults.totalFailed += multitenancyResults.failed;
  consolidatedResults.dataLeaks = multitenancyResults.dataLeaks?.length || 0;
  
  // Suite 3: Security
  console.log('\n\n📦 SUITE 3/4: Security Audit Tests');
  const securityResults = await runSecurityTests();
  consolidatedResults.suites.security = securityResults;
  consolidatedResults.totalTests += securityResults.total;
  consolidatedResults.totalPassed += securityResults.passed;
  consolidatedResults.totalFailed += securityResults.failed;
  
  if (securityResults.vulnerabilities) {
    securityResults.vulnerabilities.forEach(v => {
      if (v.severity === 'CRITICAL') consolidatedResults.vulnerabilities.critical++;
      else if (v.severity === 'HIGH') consolidatedResults.vulnerabilities.high++;
      else if (v.severity === 'MEDIUM') consolidatedResults.vulnerabilities.medium++;
      else consolidatedResults.vulnerabilities.low++;
    });
  }
  
  // Suite 4: API Endpoints
  console.log('\n\n📦 SUITE 4/4: API Endpoints Tests (44 endpoints)');
  const apiResults = await runApiTests();
  consolidatedResults.suites.api = apiResults;
  consolidatedResults.totalTests += apiResults.total;
  consolidatedResults.totalPassed += apiResults.passed;
  consolidatedResults.totalFailed += apiResults.failed;
  
  if (apiResults.responseTimes && apiResults.responseTimes.length > 0) {
    consolidatedResults.avgResponseTime = 
      apiResults.responseTimes.reduce((a, b) => a + b, 0) / apiResults.responseTimes.length;
  }
  
  if (apiResults.endpointResults) {
    consolidatedResults.coverage = 
      (Object.keys(apiResults.endpointResults).length / 44) * 100;
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Imprimir resumen final
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 CONSOLIDATED TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`\n✅ Total Tests: ${consolidatedResults.totalTests}`);
  console.log(`✅ Passed: ${consolidatedResults.totalPassed} (${((consolidatedResults.totalPassed / consolidatedResults.totalTests) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${consolidatedResults.totalFailed} (${((consolidatedResults.totalFailed / consolidatedResults.totalTests) * 100).toFixed(1)}%)`);
  console.log(`⏱️  Duration: ${duration}s`);
  
  console.log(`\n📈 Coverage & Performance:`);
  console.log(`  - API Coverage: ${consolidatedResults.coverage.toFixed(1)}%`);
  console.log(`  - Avg Response Time: ${consolidatedResults.avgResponseTime.toFixed(0)}ms`);
  
  console.log(`\n🏢 Multitenancy:`);
  if (consolidatedResults.dataLeaks === 0) {
    console.log(`  ✅ No data leaks detected`);
  } else {
    console.log(`  🚨 ${consolidatedResults.dataLeaks} data leaks detected!`);
  }
  
  console.log(`\n🔒 Security:`);
  const totalVulns = consolidatedResults.vulnerabilities.critical + 
                     consolidatedResults.vulnerabilities.high + 
                     consolidatedResults.vulnerabilities.medium + 
                     consolidatedResults.vulnerabilities.low;
  
  if (totalVulns === 0) {
    console.log(`  ✅ No vulnerabilities detected`);
  } else {
    console.log(`  🚨 ${totalVulns} vulnerabilities detected:`);
    if (consolidatedResults.vulnerabilities.critical > 0) {
      console.log(`    🔴 Critical: ${consolidatedResults.vulnerabilities.critical}`);
    }
    if (consolidatedResults.vulnerabilities.high > 0) {
      console.log(`    🟠 High: ${consolidatedResults.vulnerabilities.high}`);
    }
    if (consolidatedResults.vulnerabilities.medium > 0) {
      console.log(`    🟡 Medium: ${consolidatedResults.vulnerabilities.medium}`);
    }
    if (consolidatedResults.vulnerabilities.low > 0) {
      console.log(`    🟢 Low: ${consolidatedResults.vulnerabilities.low}`);
    }
  }
  
  // Determinar status general
  const hasFailures = consolidatedResults.totalFailed > 0;
  const hasCriticalIssues = consolidatedResults.dataLeaks > 0 || 
                            consolidatedResults.vulnerabilities.critical > 0;
  
  console.log(`\n🎯 Overall Status:`);
  if (!hasFailures && !hasCriticalIssues) {
    console.log(`  ✅ ALL TESTS PASSED - SYSTEM READY FOR PRODUCTION`);
  } else if (hasCriticalIssues) {
    console.log(`  🚨 CRITICAL ISSUES DETECTED - DO NOT DEPLOY`);
  } else {
    console.log(`  ⚠️  SOME TESTS FAILED - REVIEW REQUIRED`);
  }
  
  console.log('\n' + '='.repeat(70));
  
  // Generar reportes
  await generateReports(consolidatedResults);
  
  return consolidatedResults;
}

async function generateReports(results) {
  console.log('\n📝 Generating reports...');
  
  // Reporte JSON
  const jsonReport = JSON.stringify(results, null, 2);
  writeFileSync(
    join(process.cwd(), 'tests/e2e/test-results.json'),
    jsonReport
  );
  console.log('  ✅ JSON report: tests/e2e/test-results.json');
  
  // Reporte Markdown
  const mdReport = generateMarkdownReport(results);
  writeFileSync(
    join(process.cwd(), 'tests/e2e/TEST_RESULTS.md'),
    mdReport
  );
  console.log('  ✅ Markdown report: tests/e2e/TEST_RESULTS.md');
  
  // Reporte de seguridad
  if (results.suites.security?.vulnerabilities) {
    const securityReport = generateSecurityReport(results.suites.security);
    writeFileSync(
      join(process.cwd(), 'tests/e2e/SECURITY_AUDIT_REPORT.md'),
      securityReport
    );
    console.log('  ✅ Security report: tests/e2e/SECURITY_AUDIT_REPORT.md');
  }
  
  // Reporte de multitenancy
  if (results.suites.multitenancy) {
    const multitenancyReport = generateMultitenancyReport(results.suites.multitenancy);
    writeFileSync(
      join(process.cwd(), 'tests/e2e/MULTITENANCY_VALIDATION_REPORT.md'),
      multitenancyReport
    );
    console.log('  ✅ Multitenancy report: tests/e2e/MULTITENANCY_VALIDATION_REPORT.md');
  }
}

function generateMarkdownReport(results) {
  const passRate = ((results.totalPassed / results.totalTests) * 100).toFixed(1);
  const status = results.totalFailed === 0 && results.dataLeaks === 0 && 
                 results.vulnerabilities.critical === 0 ? '✅ PASSED' : '❌ FAILED';
  
  return `# 🧪 E2E Test Results - SmartBuilding SaaS

**Date:** ${new Date(results.timestamp).toLocaleString()}  
**Status:** ${status}  
**Pass Rate:** ${passRate}%

---

## 📊 Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${results.totalTests} |
| Passed | ${results.totalPassed} |
| Failed | ${results.totalFailed} |
| API Coverage | ${results.coverage.toFixed(1)}% |
| Avg Response Time | ${results.avgResponseTime.toFixed(0)}ms |
| Data Leaks | ${results.dataLeaks} |
| Critical Vulnerabilities | ${results.vulnerabilities.critical} |

---

## 🧪 Test Suites

### 1. Authentication Tests
- **Total:** ${results.suites.auth.total}
- **Passed:** ${results.suites.auth.passed}
- **Failed:** ${results.suites.auth.failed}

### 2. Multitenancy Tests
- **Total:** ${results.suites.multitenancy.total}
- **Passed:** ${results.suites.multitenancy.passed}
- **Failed:** ${results.suites.multitenancy.failed}
- **Data Leaks:** ${results.dataLeaks}

### 3. Security Tests
- **Total:** ${results.suites.security.total}
- **Passed:** ${results.suites.security.passed}
- **Failed:** ${results.suites.security.failed}
- **Vulnerabilities:** ${results.vulnerabilities.critical + results.vulnerabilities.high + results.vulnerabilities.medium + results.vulnerabilities.low}

### 4. API Endpoints Tests
- **Total:** ${results.suites.api.total}
- **Passed:** ${results.suites.api.passed}
- **Failed:** ${results.suites.api.failed}
- **Coverage:** ${results.coverage.toFixed(1)}%

---

## 🎯 Recommendations

${results.totalFailed === 0 ? '✅ All tests passed! System is ready for production.' : '⚠️ Some tests failed. Review the errors before deploying.'}

${results.dataLeaks > 0 ? '🚨 **CRITICAL:** Data leaks detected in multitenancy. Fix immediately!' : '✅ No data leaks detected.'}

${results.vulnerabilities.critical > 0 ? '🚨 **CRITICAL:** Security vulnerabilities detected. Fix before deploying!' : '✅ No critical security issues.'}

${results.avgResponseTime > 200 ? '⚠️ Average response time exceeds 200ms target. Consider optimization.' : '✅ Response times are within acceptable range.'}

---

**Generated by:** SmartBuilding E2E Test Suite  
**Version:** 1.0.0
`;
}

function generateSecurityReport(securityResults) {
  const vulns = securityResults.vulnerabilities || [];
  const critical = vulns.filter(v => v.severity === 'CRITICAL');
  const high = vulns.filter(v => v.severity === 'HIGH');
  const medium = vulns.filter(v => v.severity === 'MEDIUM');
  
  let report = `# 🔒 Security Audit Report

**Date:** ${new Date().toLocaleString()}  
**Total Vulnerabilities:** ${vulns.length}

---

## 📊 Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | ${critical.length} |
| 🟠 High | ${high.length} |
| 🟡 Medium | ${medium.length} |

---
`;

  if (critical.length > 0) {
    report += `\n## 🔴 Critical Vulnerabilities\n\n`;
    critical.forEach((v, i) => {
      report += `### ${i + 1}. ${v.type}\n`;
      report += `**Issue:** ${v.issue}\n\n`;
    });
  }
  
  if (high.length > 0) {
    report += `\n## 🟠 High Severity Vulnerabilities\n\n`;
    high.forEach((v, i) => {
      report += `### ${i + 1}. ${v.type}\n`;
      report += `**Issue:** ${v.issue}\n\n`;
    });
  }
  
  if (medium.length > 0) {
    report += `\n## 🟡 Medium Severity Vulnerabilities\n\n`;
    medium.forEach((v, i) => {
      report += `### ${i + 1}. ${v.type}\n`;
      report += `**Issue:** ${v.issue}\n\n`;
    });
  }
  
  if (vulns.length === 0) {
    report += `\n## ✅ No Vulnerabilities Detected\n\nAll security tests passed successfully!\n`;
  }
  
  return report;
}

function generateMultitenancyReport(multitenancyResults) {
  const leaks = multitenancyResults.dataLeaks || [];
  
  let report = `# 🏢 Multitenancy Validation Report

**Date:** ${new Date().toLocaleString()}  
**Data Leaks Detected:** ${leaks.length}  
**Status:** ${leaks.length === 0 ? '✅ SECURE' : '🚨 INSECURE'}

---

## 📊 Test Results

| Test | Status |
|------|--------|
| Total Tests | ${multitenancyResults.total} |
| Passed | ${multitenancyResults.passed} |
| Failed | ${multitenancyResults.failed} |

---
`;

  if (leaks.length > 0) {
    report += `\n## 🚨 Data Leaks Detected\n\n`;
    leaks.forEach((leak, i) => {
      report += `### ${i + 1}. ${leak.type}\n`;
      report += `\`\`\`json\n${JSON.stringify(leak, null, 2)}\n\`\`\`\n\n`;
    });
    report += `\n⚠️ **ACTION REQUIRED:** Fix data isolation issues before deploying to production!\n`;
  } else {
    report += `\n## ✅ No Data Leaks Detected\n\nAll multitenancy tests passed successfully. Data is properly isolated between buildings.\n`;
  }
  
  return report;
}

// Ejecutar
runAllTestSuites()
  .then(results => {
    const exitCode = results.totalFailed > 0 || 
                     results.dataLeaks > 0 || 
                     results.vulnerabilities.critical > 0 ? 1 : 0;
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('\n💥 Fatal error running tests:', error);
    process.exit(1);
  });
