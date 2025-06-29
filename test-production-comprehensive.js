#!/usr/bin/env node

/**
 * Test de Producción Comprensivo - ToolBox
 * Simula el comportamiento de la aplicación en un entorno de producción
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProductionTester {
  constructor() {
    this.serverProcess = null;
    this.testResults = [];
    this.errors = [];
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async checkBuildExists() {
    this.log('🔍 Verificando build de producción...', 'info');
    
    const buildPath = path.join(process.cwd(), '.next');
    if (!fs.existsSync(buildPath)) {
      throw new Error('Build de producción no encontrado. Ejecuta "npm run build" primero.');
    }
    
    this.log('✅ Build de producción encontrado', 'success');
    return true;
  }

  async startProductionServer() {
    this.log('🚀 Iniciando servidor de producción...', 'info');
    
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('npm', ['start'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let output = '';
      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Ready - started server')) {
          this.log('✅ Servidor de producción iniciado', 'success');
          setTimeout(resolve, 2000); // Esperar 2 segundos adicionales
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('ExperimentalWarning')) {
          this.log(`⚠️ Error del servidor: ${error}`, 'warning');
        }
      });

      this.serverProcess.on('error', (error) => {
        this.log(`❌ Error iniciando servidor: ${error.message}`, 'error');
        reject(error);
      });

      // Timeout de 30 segundos
      setTimeout(() => {
        if (!output.includes('Ready - started server')) {
          reject(new Error('Timeout iniciando servidor'));
        }
      }, 30000);
    });
  }

  async testEndpoint(url, name, expectedStatus = 200) {
    try {
      const response = await fetch(url);
      const status = response.status;
      const isSuccess = status === expectedStatus;
      
      this.testResults.push({
        name,
        url,
        status,
        success: isSuccess,
        responseTime: Date.now()
      });

      if (isSuccess) {
        this.log(`✅ ${name}: ${status}`, 'success');
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

  async testMainPages() {
    this.log('🔍 Testeando páginas principales...', 'info');
    
    const pages = [
      { url: 'http://localhost:3000', name: 'Página Principal' },
      { url: 'http://localhost:3000/tools/mp3-downloader', name: 'MP3 Downloader' },
      { url: 'http://localhost:3000/tools/audio-converter', name: 'Audio Converter' },
      { url: 'http://localhost:3000/tools/audio-editor', name: 'Audio Editor' },
      { url: 'http://localhost:3000/tools/audio-downloader', name: 'Audio Downloader' },
      { url: 'http://localhost:3000/tools/background-remover', name: 'Background Remover' },
      { url: 'http://localhost:3000/tools/image-converter', name: 'Image Converter' },
      { url: 'http://localhost:3000/tools/image-resizer', name: 'Image Resizer' },
      { url: 'http://localhost:3000/tools/pdf-to-word', name: 'PDF to Word' },
      { url: 'http://localhost:3000/tools/word-to-pdf', name: 'Word to PDF' }
    ];

    const results = await Promise.all(
      pages.map(page => this.testEndpoint(page.url, page.name))
    );

    const successCount = results.filter(r => r).length;
    this.log(`📊 Páginas: ${successCount}/${pages.length} exitosas`, 
             successCount === pages.length ? 'success' : 'warning');
  }

  async testAPIEndpoints() {
    this.log('🔍 Testeando endpoints de API...', 'info');
    
    const apis = [
      { url: 'http://localhost:3000/api/tools/mp3-downloader/test', name: 'MP3 Downloader API Test' },
      { url: 'http://localhost:3000/api/health', name: 'Health Check', expectedStatus: 404 } // Puede no existir
    ];

    const results = await Promise.all(
      apis.map(api => this.testEndpoint(api.url, api.name, api.expectedStatus || 200))
    );

    const successCount = results.filter(r => r).length;
    this.log(`📊 APIs: ${successCount}/${apis.length} exitosas`, 
             successCount >= apis.length * 0.5 ? 'success' : 'warning');
  }

  async testThemeSystem() {
    this.log('🔍 Testeando sistema de temas...', 'info');
    
    try {
      const response = await fetch('http://localhost:3000');
      const html = await response.text();
      
      const hasThemeProvider = html.includes('theme-provider') || html.includes('next-themes');
      const hasDarkModeClasses = html.includes('dark:') || html.includes('dark ');
      const hasThemeToggle = html.includes('theme-toggle') || html.includes('Theme');
      
      this.log(`🎨 Theme Provider: ${hasThemeProvider ? '✅' : '❌'}`, 
               hasThemeProvider ? 'success' : 'error');
      this.log(`🌙 Dark Mode Classes: ${hasDarkModeClasses ? '✅' : '❌'}`, 
               hasDarkModeClasses ? 'success' : 'error');
      this.log(`🔄 Theme Toggle: ${hasThemeToggle ? '✅' : '❌'}`, 
               hasThemeToggle ? 'success' : 'error');

      return hasThemeProvider && hasDarkModeClasses && hasThemeToggle;
    } catch (error) {
      this.log(`❌ Error testeando temas: ${error.message}`, 'error');
      return false;
    }
  }

  async testPerformance() {
    this.log('🔍 Testeando rendimiento...', 'info');
    
    const startTime = Date.now();
    
    try {
      const response = await fetch('http://localhost:3000');
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const performanceGrade = responseTime < 500 ? 'Excelente' : 
                              responseTime < 1000 ? 'Bueno' : 
                              responseTime < 2000 ? 'Regular' : 'Lento';
      
      this.log(`⚡ Tiempo de respuesta: ${responseTime}ms (${performanceGrade})`, 
               responseTime < 1000 ? 'success' : 'warning');
      
      return responseTime < 2000;
    } catch (error) {
      this.log(`❌ Error testeando rendimiento: ${error.message}`, 'error');
      return false;
    }
  }

  async testFileStructure() {
    this.log('🔍 Verificando estructura de archivos...', 'info');
    
    const requiredFiles = [
      'package.json',
      'next.config.ts',
      'tailwind.config.ts',
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'src/components/theme-provider.tsx',
      'src/components/theme-toggle.tsx',
      'src/components/Footer.tsx'
    ];

    const missing = requiredFiles.filter(file => !fs.existsSync(path.join(process.cwd(), file)));
    
    if (missing.length === 0) {
      this.log('✅ Todos los archivos requeridos presentes', 'success');
      return true;
    } else {
      this.log(`❌ Archivos faltantes: ${missing.join(', ')}`, 'error');
      return false;
    }
  }

  async generateReport() {
    this.log('📋 Generando reporte final...', 'info');
    
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const successRate = Math.round((successfulTests / totalTests) * 100);
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: 'production-simulation',
      totalTests,
      successfulTests,
      successRate,
      results: this.testResults,
      errors: this.errors
    };

    // Guardar reporte
    fs.writeFileSync(
      path.join(process.cwd(), 'production-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Mostrar resumen
    console.log('\n' + '='.repeat(50));
    console.log('📊 REPORTE FINAL DE PRODUCCIÓN');
    console.log('='.repeat(50));
    console.log(`✅ Tests exitosos: ${successfulTests}/${totalTests}`);
    console.log(`📈 Tasa de éxito: ${successRate}%`);
    console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
    
    if (successRate >= 90) {
      console.log('🎉 ¡EXCELENTE! La aplicación está lista para producción.');
    } else if (successRate >= 75) {
      console.log('👍 BUENO. La aplicación está mayormente lista para producción.');
    } else if (successRate >= 50) {
      console.log('⚠️  REGULAR. Se necesitan algunas mejoras antes de producción.');
    } else {
      console.log('❌ CRÍTICO. Se requieren correcciones importantes.');
    }
    
    console.log('\n📄 Reporte detallado guardado en: production-test-report.json');
  }

  async cleanup() {
    if (this.serverProcess) {
      this.log('🛑 Cerrando servidor de producción...', 'info');
      this.serverProcess.kill('SIGTERM');
      
      // Esperar a que se cierre
      await new Promise((resolve) => {
        this.serverProcess.on('exit', resolve);
        setTimeout(resolve, 5000); // Timeout de 5 segundos
      });
    }
  }

  async run() {
    try {
      this.log('🚀 Iniciando test comprensivo de producción...', 'info');
      
      // 1. Verificar build
      await this.checkBuildExists();
      
      // 2. Verificar estructura de archivos
      await this.testFileStructure();
      
      // 3. Iniciar servidor de producción
      await this.startProductionServer();
      
      // 4. Esperar a que el servidor esté listo
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 5. Ejecutar tests
      await this.testMainPages();
      await this.testAPIEndpoints();
      await this.testThemeSystem();
      await this.testPerformance();
      
      // 6. Generar reporte
      await this.generateReport();
      
    } catch (error) {
      this.log(`❌ Error crítico: ${error.message}`, 'error');
      this.errors.push(error.message);
    } finally {
      await this.cleanup();
    }
  }
}

// Ejecutar el test
if (require.main === module) {
  const tester = new ProductionTester();
  tester.run().catch(console.error);
}

module.exports = ProductionTester;
