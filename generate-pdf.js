const { chromium } = require('@playwright/test');
const path = require('path');

/**
 * Generate PDF of the Investment Summary slide
 * Usage: node generate-pdf.js
 * 
 * Make sure your development server is running on localhost:3000 first!
 */
async function generateInvestmentSummaryPDF() {
  console.log('🚀 Starting PDF generation...');
  
  // Launch browser
  const browser = await chromium.launch({
    headless: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📄 Navigating to Investment Summary slide...');
    
    // Navigate to the investor deck first
    await page.goto('http://localhost:3000/investor/v4', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for the page to load completely
    await page.waitForTimeout(3000);
    
    // Now navigate to slide 46 (Investment Summary)
    // The Investment Summary slide should be slide #3 in the deck (order 1.7)
    // We need to click through to get to slide 3 or use navigation
    console.log('🎯 Looking for Investment Summary slide...');
    
    // Try to find and click on the "Comprehensive Investment Summary" slide in the sidebar
    try {
      await page.click('text=Comprehensive Investment Summary');
      console.log('✅ Found and clicked on Investment Summary slide');
    } catch (error) {
      console.log('ℹ️  Could not click slide directly, trying navigation...');
      // Alternative: try navigating to slide 3 (it should be the 3rd slide)
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);
      }
    }
    
    // Wait a bit more for any animations or dynamic content
    await page.waitForTimeout(3000);
    
    // Optional: Hide any navigation elements that might interfere
    await page.addStyleTag({
      content: `
        /* Hide navigation elements for cleaner PDF */
        .navigation, .nav, .header, .footer, 
        [class*="nav"], [class*="header"], [class*="footer"] {
          display: none !important;
        }
        
        /* Ensure full width usage */
        .slide-content, .slide-template {
          max-width: 100% !important;
          margin: 0 !important;
          padding: 20px !important;
        }
        
        /* Optimize for print */
        body {
          background: white !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      `
    });
    
    console.log('📊 Generating PDF...');
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      path: path.join(__dirname, 'Investment-Summary-Slide.pdf'),
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      preferCSSPageSize: false
    });
    
    console.log('✅ PDF generated successfully!');
    console.log(`📁 Saved as: ${path.join(__dirname, 'Investment-Summary-Slide.pdf')}`);
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    
    if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      console.log('\n💡 Make sure your development server is running:');
      console.log('   npm start');
      console.log('   Then run this script again.');
    }
  } finally {
    await browser.close();
  }
}

// Alternative function for different slide URL structure
async function generatePDFWithSlideId() {
  console.log('🚀 Starting PDF generation (alternative URL)...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  try {
    // Try alternative URL structures
    const alternativeUrls = [
      'http://localhost:3000/investor/v4',
      'http://localhost:3000/#/investor/v4',
      'http://localhost:3000/investor-funnel-v4',
      'http://localhost:3000/#/investor-funnel-v4'
    ];
    
    for (const url of alternativeUrls) {
      try {
        console.log(`📄 Trying URL: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
        
        // Check if we found the slide content
        const hasSlideContent = await page.locator('text=Investment Summary').isVisible({ timeout: 5000 });
        
        if (hasSlideContent) {
          console.log('✅ Found Investment Summary slide!');
          
          await page.waitForTimeout(3000);
          
          await page.addStyleTag({
            content: `
              .navigation, .nav, .header, .footer { display: none !important; }
              body { background: white !important; -webkit-print-color-adjust: exact !important; }
            `
          });
          
          await page.pdf({
            path: path.join(__dirname, 'Investment-Summary-Slide.pdf'),
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
          });
          
          console.log('✅ PDF generated successfully!');
          return;
        }
      } catch (err) {
        console.log(`❌ URL failed: ${url}`);
        continue;
      }
    }
    
    throw new Error('Could not find Investment Summary slide at any URL');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the main function
if (require.main === module) {
  generateInvestmentSummaryPDF()
    .then(() => {
      console.log('🎉 Script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      
      console.log('\n🔄 Trying alternative URL patterns...');
      generatePDFWithSlideId()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
}

module.exports = { generateInvestmentSummaryPDF, generatePDFWithSlideId };