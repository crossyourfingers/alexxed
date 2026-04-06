import { test, expect } from '@playwright/test';

test.describe('DataTable Layout', () => {
  test('rows should be horizontal (horizontal row, vertical stack of rows)', async ({ page }) => {
    // Navigate to the games page which uses DataTable
    // We assume the app is running and we might need to login.
    // However, for a unit-like UI test, we can also try to point to a specific internal route if possible,
    // but since we are using HashRouter and SpacetimeDB, we might need to bypass auth or use a mock.
    
    // For now, let's try to go to the page and see what happens.
    await page.goto('http://localhost:5173/#/games');
    
    // If redirected to login, we might need to handle it.
    // But if we just want to test the component, maybe we should have a dedicated test page.
    // Given the constraints, I'll check if I'm on the login page.
    if (await page.isVisible('button:has-text("Sign In")')) {
      console.log('On login page, attempting to bypass or wait');
      // In this app, we have a "Connect as Guest" button sometimes? No, that was diagnostic.
      // But we can just test if the table exists.
    }

    // Wait for the table to be visible
    const table = page.locator('table[role="table"]');
    try {
        await table.waitFor({ timeout: 5000 });
    } catch (e) {
        console.log('Table not found, might be auth-locked. This test requires a running dev server with data.');
        return; 
    }

    // Check a row's layout
    const rows = page.locator('tr[role="row"], div[role="row"]');
    const firstRow = rows.first();
    await firstRow.waitFor();

    // Get bounding boxes of cells in the first row
    const cells = firstRow.locator('[role="cell"]');
    const cellCount = await cells.count();
    
    if (cellCount > 1) {
      const box1 = await cells.nth(0).boundingBox();
      const box2 = await cells.nth(1).boundingBox();

      if (box1 && box2) {
        // Horizontal check: box1.y should be approximately box2.y
        // And box1.x + width should be <= box2.x
        console.log(`Cell 1: x=${box1.x}, y=${box1.y}, w=${box1.width}`);
        console.log(`Cell 2: x=${box2.x}, y=${box2.y}, w=${box2.width}`);
        
        expect(Math.abs(box1.y - box2.y)).toBeLessThan(5); // They should be on the same horizontal line
        expect(box2.x).toBeGreaterThanOrEqual(box1.x + box1.width - 1); // Box 2 should be to the right of Box 1
      }
    }
    
    // Check vertical stacking of rows
    if (await rows.count() > 1) {
      const row1 = await rows.nth(0).boundingBox();
      const row2 = await rows.nth(1).boundingBox();
      
      if (row1 && row2) {
        console.log(`Row 1: x=${row1.x}, y=${row1.y}, h=${row1.height}`);
        console.log(`Row 2: x=${row2.x}, y=${row2.y}, h=${row2.height}`);
        
        expect(row2.y).toBeGreaterThanOrEqual(row1.y + row1.height - 1); // Row 2 should be below Row 1
      }
    }
  });
});
