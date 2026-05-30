// Increase timeout for async tests (voice state updates can be slow in CI)
jest.setTimeout(30000);

// Suppress console logs during tests (optional – keeps test output clean)
// jest.spyOn(console, 'log').mockImplementation(() => {});
// jest.spyOn(console, 'error').mockImplementation(() => {});