import { test, expect } from '@playwright/test';

const COLUMN_COUNT = 6; // cover, title, genre, votes, actions, played

test.describe('DataTable Layout', () => {
  test('rows should be horizontal with correct cell count', async ({ page }) => {
    await page.goto('http://localhost:5173/#/games');

    // If auth-locked, skip gracefully
    if (await page.isVisible('button:has-text("Sign In")')) {
      console.log('Auth-locked: skipping DataTable layout test');
      return;
    }

    // Wait for the table
    const table = page.locator('table[role="table"]');
    await table.waitFor({ timeout: 10000 });

    // Wait for at least one data row (not the header row)
    const dataRows = page.locator('tbody tr[role="row"]');
    await dataRows.first().waitFor({ timeout: 10000 });

    const firstRow = dataRows.first();

    // (a) Cell count per row must match column count
    const cells = firstRow.locator('td[role="cell"]');
    const cellCount = await cells.count();
    expect(cellCount).toBe(COLUMN_COUNT);

    // (b) All cells in the first row share the same y coordinate (horizontal alignment)
    const boxes = await Promise.all(
      Array.from({ length: cellCount }, (_, i) => cells.nth(i).boundingBox())
    );
    const validBoxes = boxes.filter((b): b is NonNullable<typeof b> => b !== null);
    expect(validBoxes.length).toBe(COLUMN_COUNT);

    const firstY = validBoxes[0].y;
    for (const box of validBoxes) {
      expect(Math.abs(box.y - firstY)).toBeLessThan(5);
    }

    // (c) Cells are positioned left-to-right (no column stacking)
    for (let i = 1; i < validBoxes.length; i++) {
      expect(validBoxes[i].x).toBeGreaterThan(validBoxes[i - 1].x);
    }

    // (d) Rows stack vertically
    const rowCount = await dataRows.count();
    if (rowCount > 1) {
      const row1Box = await dataRows.nth(0).boundingBox();
      const row2Box = await dataRows.nth(1).boundingBox();
      if (row1Box && row2Box) {
        expect(row2Box.y).toBeGreaterThanOrEqual(row1Box.y + row1Box.height - 1);
      }
    }
  });
});
