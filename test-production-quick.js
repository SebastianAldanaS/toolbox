#!/usr/bin/env node

/**
 * Test Rápido de Producción - ToolBox
 * Prueba la aplicación que ya está corriendo en producción
 */

class QuickProductionTest {
  constructor() {
    this.testResults = [];
    this.baseUrl = 'http://localhost:3000';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async testEndpoint(url, name, expectedStatus = 200) {
    const startTime = Date.now();
    try {
      const response = await fetch(url);
      const responseTime = Date.now() - startTime;
      const status = response.status;
      const isSuccess = status === expectedStatus;
      
      this.testResults.push({
        name,
        url,
        status,
        success: isSuccess,
        responseTime
      });

      const performanceEmoji = responseTime < 200 ? '⚡' : responseTime < 500 ? '🟢' : responseTime < 1000 ? '🟡' : '🔴';
      
      if (isSuccess) {
        this.log(`✅ ${name}: ${status} ${performanceEmoji}${responseTime}ms`, 'success');
      } else {
        this.log(`❌ ${name}: ${status} (esperado: ${expectedStatus})`, 'error');
      }

      return isSuccess;
    } catch (error) {
      this.log(`❌ ${name}: Error - ${error.message}`, 'error');
      this.testResults.push({
        name,
        url,
        status: 'ERROR',
        success: false,
        error: error.message
      });
      return false;
    }
  }

  async testWithJsonBody(url, name, body) {
    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      
      const responseTime = Date.now() - startTime;
      const status = response.status;
      const data = await response.json();
      
      const performanceEmoji = responseTime < 200 ? '⚡' : responseTime < 500 ? '🟢' : responseTime < 1000 ? '🟡' : '🔴';
      
      this.testResults.push({
        name,
        url,
        status,
        success: status === 200,
        responseTime,
        data
      });

      if (status === 200) {
        this.log(`✅ ${name}: ${status} ${performanceEmoji}${responseTime}ms`, 'success');
      } else {
        this.log(`❌ ${name}: ${status} ${performanceEmoji}${responseTime}ms`, 'error');
      }

      return status === 200;
    } catch (error) {
      this.log(`❌ ${name}: Error - ${error.message}`, 'error');
      return false;
    }
  }

  async run() {
    this.log('🚀 Iniciando test rápido de producción...', 'info');
    
    // Test de conectividad básica
    this.log('🔍 Testeando conectividad del servidor...', 'info');
    const serverUp = await this.testEndpoint(this.baseUrl, 'Servidor Principal');
    
    if (!serverUp) {
      this.log('❌ El servidor no está disponible. Asegúrate de ejecutar "npm start" primero.', 'error');
      return;
    }

    // Test de páginas principales
    this.log('🔍 Testeando páginas de herramientas...', 'info');
    const tools = [
      'mp3-downloader',
      'audio-converter', 
      'audio-editor',
      'audio-downloader',
      'background-remover',
      'image-converter',
      'image-resizer',
      'pdf-to-word',
      'word-to-pdf'
    ];

    const pageTests = await Promise.all(
      tools.map(tool => 
        this.testEndpoint(`${this.baseUrl}/tools/${tool}`, `Tool: ${tool}`)
      )
    );

    // Test de APIs específicas
    this.log('🔍 Testeando APIs funcionales...', 'info');
    
    // Test MP3 Downloader API
    await this.testWithJsonBody(
      `${this.baseUrl}/api/tools/mp3-downloader/test`,
      'MP3 Downloader API Test',
      { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
    );

    // Test de tema y UI
    this.log('🔍 Testeando sistema de temas...', 'info');
    try {
      const response = await fetch(this.baseUrl);
      const html = await response.text();
      
      const checks = {
        'ThemeProvider': html.includes('theme-provider') || html.includes('next-themes'),
        'Dark Mode Classes': html.includes('dark:') || html.includes('dark '),
        'Theme Toggle': html.includes('theme-toggle') || html.includes('Theme'),
        'Footer': html.includes('Footer') || html.includes('footer'),
        'ToolCard': html.includes('ToolCard') || html.includes('tool-card')
      };

      for (const [check, passed] of Object.entries(checks)) {
        this.log(`🎨 ${check}: ${passed ? '✅' : '❌'}`, passed ? 'success' : 'warning');
      }
    } catch (error) {
      this.log(`❌ Error verificando UI: ${error.message}`, 'error');
    }

    // Resumen final
    this.generateSummary();
  }

  generateSummary() {
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const successRate = totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0;
    const avgResponseTime = totalTests > 0 ? 
      Math.round(this.testResults.reduce((sum, r) => sum + (r.responseTime || 0), 0) / totalTests) : 0;

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DEL TEST DE PRODUCCIÓN');
    console.log('='.repeat(60));
    console.log(`🎯 Tests exitosos: ${successfulTests}/${totalTests} (${successRate}%)`);
    console.log(`⚡ Tiempo promedio de respuesta: ${avgResponseTime}ms`);
    console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
    
    if (successRate >= 90) {
      console.log('🎉 ¡EXCELENTE! La aplicación está funcionando perfectamente en producción.');
    } else if (successRate >= 80) {
      console.log('✅ MUY BIEN. La aplicación está funcionando correctamente en producción.');
    } else if (successRate >= 70) {
      console.log('👍 BIEN. La aplicación está mayormente funcional con algunos issues menores.');
    } else if (successRate >= 50) {
      console.log('⚠️ REGULAR. Hay algunos problemas que necesitan atención.');
    } else {
      console.log('❌ CRÍTICO. Se requieren correcciones importantes.');
    }

    // Mostrar tests fallidos
    const failedTests = this.testResults.filter(r => !r.success);
    if (failedTests.length > 0) {
      console.log('\n❌ Tests fallidos:');
      failedTests.forEach(test => {
        console.log(`   • ${test.name}: ${test.status} ${test.error ? `(${test.error})` : ''}`);
      });
    }

    // Rendimiento
    const fastTests = this.testResults.filter(r => r.responseTime && r.responseTime < 300).length;
    const performanceScore = totalTests > 0 ? Math.round((fastTests / totalTests) * 100) : 0;
    console.log(`\n⚡ Rendimiento: ${performanceScore}% de respuestas rápidas (<300ms)`);

    console.log('\n🚀 ¡Test de producción completado!');
    console.log('='.repeat(60));
  }
}

// Ejecutar el test
if (require.main === module) {
  const tester = new QuickProductionTest();
  tester.run().catch(console.error);
}

module.exports = QuickProductionTest;
