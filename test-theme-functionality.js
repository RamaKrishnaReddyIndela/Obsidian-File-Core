// Test Theme Functionality
// This script tests the theme implementation in Obsidian File Core

console.log('🎨 Testing Obsidian File Core Theme Functionality\n');

const testResults = [];

// Test 1: Check if dark mode classes are enabled in Tailwind config
console.log('1. Testing Tailwind Dark Mode Configuration...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const configPath = path.join(__dirname, 'forticrypt-frontend', 'tailwind.config.js');
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  if (configContent.includes("darkMode: 'class'")) {
    console.log('   ✅ Tailwind dark mode is enabled with class strategy');
    testResults.push({ test: 'Tailwind Config', status: 'PASS' });
  } else {
    console.log('   ❌ Tailwind dark mode not properly configured');
    testResults.push({ test: 'Tailwind Config', status: 'FAIL' });
  }
} catch (error) {
  console.log('   ❌ Could not read Tailwind config:', error.message);
  testResults.push({ test: 'Tailwind Config', status: 'ERROR' });
}

console.log();

// Test 2: Check if ThemeContext exists
console.log('2. Testing Theme Context Implementation...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const contextPath = path.join(__dirname, 'forticrypt-frontend', 'src', 'contexts', 'ThemeContext.js');
  const contextExists = fs.existsSync(contextPath);
  
  if (contextExists) {
    const contextContent = fs.readFileSync(contextPath, 'utf8');
    
    const hasUseTheme = contextContent.includes('export const useTheme');
    const hasThemeProvider = contextContent.includes('export const ThemeProvider');
    const hasLocalStorage = contextContent.includes('localStorage');
    const hasSystemDetection = contextContent.includes('matchMedia');
    
    if (hasUseTheme && hasThemeProvider && hasLocalStorage && hasSystemDetection) {
      console.log('   ✅ Theme context properly implemented with all features');
      testResults.push({ test: 'Theme Context', status: 'PASS' });
    } else {
      console.log('   ⚠️  Theme context exists but missing some features');
      testResults.push({ test: 'Theme Context', status: 'PARTIAL' });
    }
  } else {
    console.log('   ❌ Theme context file not found');
    testResults.push({ test: 'Theme Context', status: 'FAIL' });
  }
} catch (error) {
  console.log('   ❌ Error checking theme context:', error.message);
  testResults.push({ test: 'Theme Context', status: 'ERROR' });
}

console.log();

// Test 3: Check if main components have dark mode classes
console.log('3. Testing Component Dark Mode Support...');
const componentsToTest = [
  'forticrypt-frontend/src/App.js',
  'forticrypt-frontend/src/components/Dashboard/Dashboard.jsx',
  'forticrypt-frontend/src/components/Tools/EncryptionPage.jsx',
  'forticrypt-frontend/src/components/Files/FileList.jsx'
];

let componentTests = 0;
let componentPassed = 0;

componentsToTest.forEach(componentPath => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const fullPath = path.join(__dirname, componentPath);
    const componentName = path.basename(componentPath);
    
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      const hasDarkClasses = content.includes('dark:');
      const hasThemeProvider = content.includes('ThemeProvider') || content.includes('useTheme');
      
      componentTests++;
      
      if (hasDarkClasses || hasThemeProvider) {
        console.log(`   ✅ ${componentName} has dark mode support`);
        componentPassed++;
      } else {
        console.log(`   ❌ ${componentName} missing dark mode classes`);
      }
    } else {
      console.log(`   ⚠️  ${componentName} not found`);
    }
  } catch (error) {
    console.log(`   ❌ Error checking ${componentPath}:`, error.message);
  }
});

if (componentPassed === componentTests && componentTests > 0) {
  testResults.push({ test: 'Component Dark Mode', status: 'PASS' });
} else if (componentPassed > 0) {
  testResults.push({ test: 'Component Dark Mode', status: 'PARTIAL' });
} else {
  testResults.push({ test: 'Component Dark Mode', status: 'FAIL' });
}

console.log();

// Test 4: Check if CSS has dark mode styles
console.log('4. Testing CSS Dark Mode Styles...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const cssPath = path.join(__dirname, 'forticrypt-frontend', 'src', 'index.css');
  
  if (fs.existsSync(cssPath)) {
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    const hasDarkStyles = cssContent.includes('.dark');
    const hasColorScheme = cssContent.includes('color-scheme');
    
    if (hasDarkStyles && hasColorScheme) {
      console.log('   ✅ CSS has proper dark mode styles');
      testResults.push({ test: 'CSS Dark Mode', status: 'PASS' });
    } else if (hasDarkStyles) {
      console.log('   ⚠️  CSS has some dark mode styles but could be improved');
      testResults.push({ test: 'CSS Dark Mode', status: 'PARTIAL' });
    } else {
      console.log('   ❌ CSS missing dark mode styles');
      testResults.push({ test: 'CSS Dark Mode', status: 'FAIL' });
    }
  } else {
    console.log('   ❌ index.css not found');
    testResults.push({ test: 'CSS Dark Mode', status: 'FAIL' });
  }
} catch (error) {
  console.log('   ❌ Error checking CSS:', error.message);
  testResults.push({ test: 'CSS Dark Mode', status: 'ERROR' });
}

console.log();

// Summary
console.log('📊 Theme Functionality Test Summary:');
console.log('=====================================');

testResults.forEach(result => {
  const icon = result.status === 'PASS' ? '✅' : 
                result.status === 'PARTIAL' ? '⚠️ ' : 
                result.status === 'ERROR' ? '🔴' : '❌';
  console.log(`${icon} ${result.test}: ${result.status}`);
});

const passCount = testResults.filter(r => r.status === 'PASS').length;
const totalTests = testResults.length;

console.log();
console.log(`Overall Score: ${passCount}/${totalTests} tests passed`);

if (passCount === totalTests) {
  console.log('🎉 Theme functionality is fully implemented!');
} else if (passCount >= totalTests / 2) {
  console.log('⚠️  Theme functionality is mostly working but needs improvements');
} else {
  console.log('❌ Theme functionality needs significant work');
}

console.log();
console.log('💡 Next Steps:');
console.log('1. Test theme switching in the browser');
console.log('2. Verify background changes when toggling themes');  
console.log('3. Check that file details sections use dark mode');
console.log('4. Ensure theme persists after page refresh');