# Testing Report

## 1. Introduction

This report details the results of the browser testing performed on the ChispartBuilding application. The primary goal of this testing was to capture screenshots of all user flows for documentation purposes.

## 2. Testing Environment

- **Frontend:** https://chispartbuilding.pages.dev
- **Backend:** https://edificio-admin.sebastianvernis.workers.dev
- **Testing Framework:** Playwright
- **Resolutions:**
  - Desktop: 1920x1080
  - Mobile: 375x812

## 3. Summary of Results

The testing process was partially successful. We were able to capture screenshots for the following flows:

- **Authentication:**
  - Login page (desktop and mobile)
- **Registration:**
  - Registration page (desktop and mobile)

However, we encountered significant issues that prevented us from capturing screenshots for all the user flows.

## 4. Issues Encountered

The following issues were encountered during the testing process:

1.  **Login Failures:** The `comite` and `inquilino` users were unable to log in, even with the correct credentials. This prevented us from capturing screenshots of their respective dashboards and user flows.
2.  **Incomplete Registration Flow:** The registration form is a multi-step process, and the test environment was not configured to handle the OTP verification and subsequent steps. This prevented us from capturing screenshots of the entire registration and initial setup flow.
3.  **Test Instability:** The Playwright tests were unstable and prone to timeouts, even with increased timeout values. This made it difficult to reliably capture screenshots.

## 5. Recommendations

Based on the results of this testing, we recommend the following:

1.  **Investigate Login Issues:** The login issues for the `comite` and `inquilino` users should be investigated and resolved. This will allow for complete testing of their respective user flows.
2.  **Improve Testability of Registration Flow:** The registration flow should be made more testable by providing a way to bypass the OTP verification in the testing environment.
3.  **Stabilize the Test Environment:** The test environment should be stabilized to reduce the frequency of timeouts and other issues.

## 6. Conclusion

While we were not able to capture screenshots for all the user flows, the testing process has provided valuable insights into the state of the application. The issues that were identified should be addressed to improve the quality and testability of the application.
