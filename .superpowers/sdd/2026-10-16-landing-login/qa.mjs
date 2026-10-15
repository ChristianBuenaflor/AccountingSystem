export default async function run(page, ui) {
  const out = {}
  // 1. Landing renders hero
  await page.goto('http://localhost:4175/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: /modern accounting/i }).waitFor({ timeout: 10000 })
  out.landing = true
  // 2. Get Started -> login form
  await page.getByRole('link', { name: /get started/i }).first().click()
  await page.waitForURL('**/login', { timeout: 5000 })
  await page.getByRole('heading', { name: /sign in/i }).waitFor({ timeout: 5000 })
  out.loginForm = true
  // 3. Bad creds -> inline error, stays
  await page.locator('input[placeholder="you@company.com"]').fill('not-an-email')
  await page.locator('input[type="password"]').fill('12')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.getByText(/valid email/i).waitFor({ timeout: 5000 })
  out.badCredsBlocked = page.url().endsWith('/login')
  // 3b. Empty submit -> inline error (no native bubble)
  await page.locator('input[placeholder="you@company.com"]').fill('')
  await page.locator('input[type="password"]').fill('')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.getByText(/valid email/i).waitFor({ timeout: 5000 })
  out.emptyBlocked = page.url().endsWith('/login')
  // 4. Demo login -> dashboard
  await page.locator('input[placeholder="you@company.com"]').fill('juan@test.ph')
  await page.locator('input[type="password"]').fill('demo1234')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 5000 })
  await page.getByRole('heading', { name: /^dashboard$/i }).waitFor({ timeout: 5000 })
  out.loginRoundTrip = true
  // 4b. Logged-in visit to /login -> dashboard
  await page.goto('http://localhost:4175/login', { waitUntil: 'domcontentloaded' })
  await page.waitForURL('**/dashboard', { timeout: 5000 })
  out.loginRedirectsWhenAuthed = true
  // 5. Gated page while logged in
  await page.goto('http://localhost:4175/journals', { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: /^journals$/i }).waitFor({ timeout: 5000 })
  out.gatedPageLoads = true
  // 6. Logout -> back to login
  await page.getByTitle('Log out').click()
  await page.waitForURL('**/login', { timeout: 5000 })
  out.logout = true
  // 7. Logged-out deep link redirects
  await page.goto('http://localhost:4175/journals', { waitUntil: 'domcontentloaded' })
  await page.waitForURL('**/login', { timeout: 5000 })
  out.gateRedirects = true
  return out
}
