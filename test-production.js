#!/usr/bin/env node

/**
 * Script de pruebas para simular el comportamiento en producción
 * Prueba las funcionalidades principales del ToolBox
 */

const https = require('https');
const http = require('http');

console.log('🚀 Iniciando pruebas de producción de ToolBox...\n');

// Configuración de pruebas
const BASE_URL = 'http://localhost:3000';

// Función helper para hacer requests
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ToolBox-Test/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = responseData.startsWith('{') || responseData.startsWith('[') 
            ? JSON.parse(responseData) 
            : responseData;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Pruebas de funcionalidad
async function testHomePage() {
  console.log('📱 Probando página principal...');
  try {
    const response = await makeRequest('/');
    if (response.statusCode === 200) {
      console.log('✅ Página principal: OK');
      return true;
    } else {
      console.log(`❌ Página principal: Error ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Página principal: ${error.message}`);
    return false;
  }
}

async function testToolPages() {
  console.log('🛠️  Probando páginas de herramientas...');
  const tools = [
    '/tools/word-to-pdf',
    '/tools/pdf-to-word', 
    '/tools/image-resizer',
    '/tools/image-converter',
    '/tools/background-remover',
    '/tools/mp3-downloader',
    '/tools/audio-converter',
    '/tools/audio-downloader',
    '/tools/audio-editor'
  ];

  let successCount = 0;
  for (const tool of tools) {
    try {
      const response = await makeRequest(tool);
      if (response.statusCode === 200) {
        console.log(`✅ ${tool}: OK`);
        successCount++;
      } else {
        console.log(`❌ ${tool}: Error ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ ${tool}: ${error.message}`);
    }
  }
  
  console.log(`📊 Herramientas funcionando: ${successCount}/${tools.length}`);
  return successCount === tools.length;
}

async function testYouTubeAPI() {
  console.log('🎵 Probando API de YouTube...');
  try {
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Roll - video público
    const response = await makeRequest('/api/tools/mp3-downloader/test', 'POST', {
      url: testUrl
    });
    
    if (response.statusCode === 200 && response.data.valid) {
      console.log('✅ API de YouTube: OK');
      console.log(`   📹 Video: ${response.data.title}`);
      console.log(`   ⏱️  Duración: ${response.data.duration}s`);
      return true;
    } else {
      console.log(`❌ API de YouTube: ${response.data.error || 'Error desconocido'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ API de YouTube: ${error.message}`);
    return false;
  }
}

async function testThemeSystem() {
  console.log('🌙 Probando sistema de temas...');
  try {
    // El sistema de temas es del lado del cliente, así que verificamos que las clases CSS existan
    const response = await makeRequest('/');
    if (response.statusCode === 200) {
      const hasThemeClasses = response.data.includes('dark:') || response.data.includes('ThemeProvider');
      if (hasThemeClasses) {
        console.log('✅ Sistema de temas: OK');
        return true;
      } else {
        console.log('❌ Sistema de temas: No se detectaron clases de tema');
        return false;
      }
    }
  } catch (error) {
    console.log(`❌ Sistema de temas: ${error.message}`);
    return false;
  }
}

async function testAPIHealthCheck() {
  console.log('🔍 Verificando APIs disponibles...');
  const apis = [
    '/api/tools/word-to-pdf',
    '/api/tools/pdf-to-word',
    '/api/tools/image-resizer',
    '/api/tools/image-converter',
    '/api/tools/background-remover',
    '/api/tools/mp3-downloader',
    '/api/tools/audio-converter'
  ];

  let successCount = 0;
  for (const api of apis) {
    try {
      // Hacer un request sin datos para verificar que el endpoint existe
      const response = await makeRequest(api, 'POST', {});
      // API endpoints deben responder, aunque sea con error de validación
      if (response.statusCode < 500) {
        console.log(`✅ ${api}: Disponible`);
        successCount++;
      } else {
        console.log(`❌ ${api}: Error ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ ${api}: ${error.message}`);
    }
  }
  
  console.log(`📊 APIs disponibles: ${successCount}/${apis.length}`);
  return successCount >= apis.length * 0.8; // 80% de las APIs deben funcionar
}

// Función principal
async function runTests() {
  console.log('🔧 ToolBox - Suite de Pruebas de Producción');
  console.log('==========================================\n');
  
  const results = {
    homePage: false,
    toolPages: false,
    youtubeAPI: false,
    themeSystem: false,
    apiHealthCheck: false
  };

  try {
    results.homePage = await testHomePage();
    console.log('');
    
    results.toolPages = await testToolPages();
    console.log('');
    
    results.youtubeAPI = await testYouTubeAPI();
    console.log('');
    
    results.themeSystem = await testThemeSystem();
    console.log('');
    
    results.apiHealthCheck = await testAPIHealthCheck();
    console.log('');

  } catch (error) {
    console.error('💥 Error durante las pruebas:', error);
  }

  // Resumen final
  console.log('📋 RESUMEN DE PRUEBAS');
  console.log('=====================');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(result => result).length;
  const successRate = (passedTests / totalTests * 100).toFixed(1);
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`${status} - ${testName}`);
  });
  
  console.log('');
  console.log(`📊 Tasa de éxito: ${successRate}% (${passedTests}/${totalTests})`);
  
  if (successRate >= 80) {
    console.log('🎉 ¡ToolBox está listo para producción!');
  } else if (successRate >= 60) {
    console.log('⚠️  ToolBox necesita algunas correcciones antes de producción');
  } else {
    console.log('🚨 ToolBox requiere revisión significativa antes de producción');
  }
  
  process.exit(successRate >= 80 ? 0 : 1);
}

// Verificar si el servidor está ejecutándose
function checkServer() {
  return makeRequest('/')
    .then(() => {
      console.log('✅ Servidor detectado en http://localhost:3000\n');
      return true;
    })
    .catch(() => {
      console.log('❌ Servidor no encontrado en http://localhost:3000');
      console.log('💡 Ejecuta: npm run dev\n');
      return false;
    });
}

// Ejecutar
checkServer().then(serverRunning => {
  if (serverRunning) {
    runTests();
  } else {
    process.exit(1);
  }
});
