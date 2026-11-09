import html from '../index.html?raw'

it('uses the app name as the page title', () => {
  expect(html).toContain('<title>Workout Tracker</title>')
})
