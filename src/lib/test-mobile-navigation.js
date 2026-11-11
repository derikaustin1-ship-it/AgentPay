// src/lib/test-mobile-navigation.js
// Automated verification script for AgentPay mobile sidebar navigation and responsiveness
// Tests viewports: 320px, 375px, 390px, 430px, and 1280px desktop

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const APP_URL = 'http://localhost:3000';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Simple CDP client using Node native WebSocket if available, or fetch / CDP HTTP
function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🤖 Starting AgentPay Mobile Navigation & Responsiveness Test');
  console.log('====================================================\n');

  // Verify server is up
  try {
    const res = await getJson(`${APP_URL}/api/budget`);
    console.log('✅ Local AgentPay server is responding (Status:', res.success ? 'OK' : 'Error', ')');
  } catch (err) {
    console.error('❌ AgentPay server is not responding on', APP_URL);
    process.exit(1);
  }

  // Launch headless Chrome with remote debugging
  console.log('🚀 Launching Headless Chrome for DOM & responsive viewport testing...');
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      '--disable-gpu',
      '--no-sandbox',
      '--disable-extensions',
      '--window-size=1280,800',
      APP_URL,
    ],
    { stdio: 'ignore' }
  );

  // Wait for Chrome to initialize
  await wait(2500);

  let passedAll = true;

  try {
    const targets = await getJson(`http://localhost:${PORT}/json`);
    const pageTarget = targets.find((t) => t.type === 'page' && t.url.includes('3000')) || targets[0];

    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('Could not find Chrome page debugging target.');
    }

    console.log('🔗 Connected to Chrome target:', pageTarget.title || pageTarget.url);

    // Use WebSocket (Node 22+ has native WebSocket, or fallback)
    const WebSocketClient = global.WebSocket || require('ws');
    const ws = new WebSocketClient(pageTarget.webSocketDebuggerUrl);

    let idCounter = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await new Promise((resolve) => ws.onopen = resolve);

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.text || 'Evaluation exception');
      }
      return res.result ? res.result.value : undefined;
    }

    async function setViewport(width, height) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: width < 1024,
      });
      await wait(300);
    }

    // Enable Runtime and DOM
    await send('Runtime.enable');
    await send('DOM.enable');

    // Wait for React hydration and #app-sidebar to mount
    for (let i = 0; i < 25; i++) {
      const hasSidebar = await evaluate(`!!document.getElementById('app-sidebar')`);
      if (hasSidebar) break;
      await wait(500);
    }

    console.log('\n--- 1. Testing Mobile Viewport Dimensions & Overflow ---');
    const testWidths = [320, 375, 390, 430];

    for (const w of testWidths) {
      await setViewport(w, 800);
      const metrics = await evaluate(`({
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      })`);

      if (!metrics.hasHorizontalOverflow && metrics.scrollWidth <= w) {
        console.log(`✅ Viewport ${w}px: OK (scrollWidth: ${metrics.scrollWidth}px, no horizontal overflow)`);
      } else {
        console.error(`❌ Viewport ${w}px: FAILED horizontal overflow check! (scrollWidth: ${metrics.scrollWidth}px > innerWidth: ${w}px)`);
        passedAll = false;
      }
    }

    console.log('\n--- 2. Testing Mobile Sidebar Drawer Initial State ---');
    await setViewport(375, 812); // iPhone width
    
    // Initial state: sidebar should be closed
    const initialSidebarState = await evaluate(`(() => {
      const sidebar = document.getElementById('app-sidebar');
      const menuBtn = document.querySelector('button[aria-label="Open navigation menu"]');
      const closeBtn = document.querySelector('button[aria-label="Close sidebar"]');
      const overlay = document.querySelector('div[aria-label="Close navigation sidebar overlay"]');
      
      const rect = sidebar ? sidebar.getBoundingClientRect() : null;
      const isVisibleOnScreen = rect ? (rect.right > 0 && rect.left < window.innerWidth) : false;
      
      return {
        hasSidebar: !!sidebar,
        hasMenuBtn: !!menuBtn,
        hasCloseBtn: !!closeBtn,
        hasOverlay: !!overlay,
        rect,
        isVisibleOnScreen,
        bodyOverflow: document.body.style.overflow
      };
    })()`);

    console.log('Sidebar initial state on mobile:');
    console.log('  - Sidebar present in DOM:', initialSidebarState.hasSidebar ? 'YES' : 'NO');
    console.log('  - Hamburger menu button present:', initialSidebarState.hasMenuBtn ? 'YES' : 'NO');
    console.log('  - Sidebar visible on screen initially:', initialSidebarState.isVisibleOnScreen ? 'YES (Open)' : 'NO (Closed/Off-screen)');
    
    if (!initialSidebarState.isVisibleOnScreen) {
      console.log('✅ Mobile drawer starts in closed position as expected');
    } else {
      console.warn('⚠️ Mobile drawer started in open position');
    }

    console.log('\n--- 3. Testing Opening Mobile Sidebar via Hamburger Button ---');
    await evaluate(`(() => {
      const menuBtn = document.querySelector('button[aria-label="Open navigation menu"]');
      if (menuBtn) menuBtn.click();
    })()`);
    await wait(400); // wait for 300ms transition

    const openedState = await evaluate(`(() => {
      const sidebar = document.getElementById('app-sidebar');
      const overlay = document.querySelector('div[aria-label="Close navigation sidebar overlay"]');
      const rect = sidebar.getBoundingClientRect();
      const overlayComputed = window.getComputedStyle(overlay);
      
      return {
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right },
        sidebarWidth: rect.width,
        viewportWidth: window.innerWidth,
        widthRatio: rect.width / window.innerWidth,
        bodyOverflow: document.body.style.overflow,
        overlayOpacity: overlayComputed.opacity,
        overlayPointerEvents: overlayComputed.pointerEvents
      };
    })()`);

    console.log('Opened drawer state:');
    console.log(`  - Drawer width: ${openedState.sidebarWidth}px (${(openedState.widthRatio * 100).toFixed(1)}% of viewport)`);
    console.log(`  - Max width cap <= 320px: ${openedState.sidebarWidth <= 320 ? 'PASSED' : 'FAILED'}`);
    console.log(`  - Body overflow locked: '${openedState.bodyOverflow}' (${openedState.bodyOverflow === 'hidden' ? 'PASSED' : 'FAILED'})`);
    console.log(`  - Backdrop overlay active: opacity=${openedState.overlayOpacity}, pointerEvents=${openedState.overlayPointerEvents}`);

    if (openedState.rect.x === 0 && openedState.sidebarWidth <= 320 && openedState.bodyOverflow === 'hidden') {
      console.log('✅ Sidebar opened smoothly from left, locked scroll, respects max-width <= 320px');
    } else {
      console.error('❌ Failed drawer open requirements');
      passedAll = false;
    }

    console.log('\n--- 4. Testing Closing Sidebar via Close (X) Button ---');
    await evaluate(`(() => {
      const closeBtn = document.querySelector('button[aria-label="Close sidebar"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await wait(400);

    const closedByX = await evaluate(`(() => {
      const sidebar = document.getElementById('app-sidebar');
      const rect = sidebar.getBoundingClientRect();
      return {
        rect,
        isOffscreen: rect.right <= 0,
        bodyOverflow: document.body.style.overflow
      };
    })()`);

    console.log('Closed by X button state:');
    console.log(`  - Offscreen: ${closedByX.isOffscreen ? 'YES' : 'NO'}`);
    console.log(`  - Body overflow restored: '${closedByX.bodyOverflow}' (${closedByX.bodyOverflow === '' ? 'PASSED' : 'FAILED'})`);

    if (closedByX.isOffscreen && closedByX.bodyOverflow === '') {
      console.log('✅ Close (X) button successfully closed drawer and restored scrolling');
    } else {
      console.error('❌ Close (X) button failed');
      passedAll = false;
    }

    console.log('\n--- 5. Testing Closing Sidebar via Backdrop Overlay Click ---');
    // Open again
    await evaluate(`document.querySelector('button[aria-label="Open navigation menu"]').click()`);
    await wait(400);

    // Click backdrop
    await evaluate(`document.querySelector('div[aria-label="Close navigation sidebar overlay"]').click()`);
    await wait(400);

    const closedByBackdrop = await evaluate(`(() => {
      const sidebar = document.getElementById('app-sidebar');
      const rect = sidebar.getBoundingClientRect();
      return {
        isOffscreen: rect.right <= 0,
        bodyOverflow: document.body.style.overflow
      };
    })()`);

    if (closedByBackdrop.isOffscreen && closedByBackdrop.bodyOverflow === '') {
      console.log('✅ Tapping backdrop overlay successfully closed drawer and restored scrolling');
    } else {
      console.error('❌ Backdrop overlay click failed');
      passedAll = false;
    }

    console.log('\n--- 6. Testing Closing Sidebar via Escape Key ---');
    // Open again
    await evaluate(`document.querySelector('button[aria-label="Open navigation menu"]').click()`);
    await wait(400);

    // Dispatch Escape key
    await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
    await wait(400);

    const closedByEscape = await evaluate(`(() => {
      const sidebar = document.getElementById('app-sidebar');
      const rect = sidebar.getBoundingClientRect();
      return {
        isOffscreen: rect.right <= 0,
        bodyOverflow: document.body.style.overflow
      };
    })()`);

    if (closedByEscape.isOffscreen && closedByEscape.bodyOverflow === '') {
      console.log('✅ Pressing Escape key successfully closed drawer and restored scrolling');
    } else {
      console.error('❌ Escape key handler failed');
      passedAll = false;
    }

    console.log('\n--- 7. Testing Navigation Items Switch Page and Close Drawer ---');
    const navTestItems = [
      { name: 'Spending Dashboard', expectedText: 'Spending & Budget Dashboard' },
      { name: 'Order History', expectedText: 'Order History' },
      { name: 'Budget Settings', expectedText: 'Budget Settings' },
      { name: 'Product Comparison', expectedText: 'Product Comparison' },
      { name: 'AI Shopping Assistant', expectedText: 'AgentPay Assistant' },
    ];

    for (const item of navTestItems) {
      // Open drawer
      await evaluate(`document.querySelector('button[aria-label="Open navigation menu"]').click()`);
      await wait(350);

      // Click nav item by label text
      const clickSuccess = await evaluate(`((targetName) => {
        const buttons = Array.from(document.querySelectorAll('#app-sidebar nav button'));
        const match = buttons.find(b => b.textContent.includes(targetName));
        if (match) {
          match.click();
          return true;
        }
        return false;
      })('${item.name}')`);

      await wait(400);

      const navState = await evaluate(`(() => {
        const sidebar = document.getElementById('app-sidebar');
        const rect = sidebar.getBoundingClientRect();
        return {
          isOffscreen: rect.right <= 0,
          pageTextFound: document.body.innerText.includes('${item.expectedText}')
        };
      })()`);

      if (clickSuccess && navState.isOffscreen && navState.pageTextFound) {
        console.log(`✅ Navigated to "${item.name}": page loaded and drawer automatically closed`);
      } else {
        console.error(`❌ Navigation test failed for "${item.name}"`);
        passedAll = false;
      }
    }

    console.log('\n--- 8. Testing Desktop Viewport (1280px) Layout Preservation ---');
    await setViewport(1280, 800);
    await wait(400);

    const desktopState = await evaluate(`(() => {
      const sidebar = document.getElementById('app-sidebar');
      const menuBtn = document.querySelector('button[aria-label="Open navigation menu"]');
      const overlay = document.querySelector('div[aria-label="Close navigation sidebar overlay"]');
      const rect = sidebar.getBoundingClientRect();
      const menuComputed = menuBtn ? window.getComputedStyle(menuBtn) : null;
      const overlayComputed = overlay ? window.getComputedStyle(overlay) : null;

      return {
        sidebarVisible: rect.x === 0 && rect.width === 256, // w-64 is 256px
        sidebarWidth: rect.width,
        menuBtnHidden: menuComputed ? menuComputed.display === 'none' : true,
        overlayHidden: overlayComputed ? (overlayComputed.display === 'none' || overlayComputed.opacity === '0') : true
      };
    })()`);

    console.log('Desktop Layout Check:');
    console.log(`  - Static sidebar visible: ${desktopState.sidebarVisible ? 'YES (w=256px)' : 'NO'}`);
    console.log(`  - Hamburger button hidden on desktop: ${desktopState.menuBtnHidden ? 'YES' : 'NO'}`);
    console.log(`  - Backdrop overlay hidden on desktop: ${desktopState.overlayHidden ? 'YES' : 'NO'}`);

    if (desktopState.sidebarVisible && desktopState.menuBtnHidden && desktopState.overlayHidden) {
      console.log('✅ Desktop layout perfectly preserved');
    } else {
      console.error('❌ Desktop layout check failed');
      passedAll = false;
    }

    ws.close();
  } catch (err) {
    console.error('❌ Test execution error:', err);
    passedAll = false;
  } finally {
    try {
      chromeProcess.kill();
    } catch {}
  }

  console.log('\n====================================================');
  if (passedAll) {
    console.log('🎉 ALL MOBILE SIDEBAR NAVIGATION TESTS PASSED SUCCESSFULLY! (8/8)');
  } else {
    console.log('⚠️ SOME TESTS FAILED - REVIEW OUTPUT ABOVE');
  }
  console.log('====================================================');

  process.exit(passedAll ? 0 : 1);
}

runTests();

