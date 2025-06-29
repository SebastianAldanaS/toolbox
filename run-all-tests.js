#!/usr/bin/env node

/**
 * Master Test Suite - ToolBox
 * Ejecuta todos los tests de producción de forma secuencial
 */

const { spawn } = require('child_process');

class MasterTestSuite {
  constructor() {
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      header: '\x1b[35m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async runScript(scriptName, description) {
    this.log(`🚀 Ejecutando: ${description}`, 'info');
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const child = spawn('node', [scriptName], { 
        stdio: 'inherit',
        shell: true 
      });
      
      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        const success = code === 0;
        
        this.results.push({
          script: scriptName,
          description,
          success,
          duration: Math.round(duration / 1000),
          code
        });
        
        if (success) {
          this.log(`✅ ${description} completado (${Math.round(duration/1000)}s)`, 'success');
        } else {
          this.log(`❌ ${description} falló (código: ${code})`, 'error');
        }
        
        resolve(success);
      });
      
      child.on('error', (error) => {
        this.log(`❌ Error ejecutando ${description}: ${error.message}`, 'error');
        this.results.push({
          script: scriptName,
          description,
          success: false,
          error: error.message
        });
        resolve(false);
      });
    });
  }

  async checkServerStatus() {
    this.log('🔍 Verificando estado del servidor...', 'info');
    
    try {
      const response = await fetch('http://localhost:3000');
      if (response.ok) {
        this.log('✅ Servidor está corriendo', 'success');
        return true;
      } else {
        this.log('⚠️ Servidor responde pero con errores', 'warning');
        return false;
      }
    } catch (error) {
      this.log('❌ Servidor no está disponible', 'error');
      this.log('💡 Ejecuta "npm start" en otra terminal antes de correr los tests', 'info');
      return false;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN MASTER TEST SUITE');
    console.log('='.repeat(80));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    console.log(`🎯 Tests ejecutados: ${totalTests}`);
    console.log(`✅ Tests exitosos: ${passedTests}`);
    console.log(`❌ Tests fallidos: ${failedTests}`);
    console.log(`⏱️ Tiempo total: ${totalDuration}s`);
    console.log(`📈 Tasa de éxito: ${Math.round((passedTests/totalTests)*100)}%`);
    
    console.log('\n📋 DETALLE POR TEST:');
    console.log('-'.repeat(80));
    
    for (const result of this.results) {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration ? `${result.duration}s` : 'N/A';
      console.log(`${status} ${result.description.padEnd(50)} ${duration.padStart(8)}`);
    }
    
    if (failedTests > 0) {
      console.log('\n❌ TESTS FALLIDOS:');
      const failed = this.results.filter(r => !r.success);
      for (const test of failed) {
        console.log(`   • ${test.description} (${test.error || `código ${test.code}`})`);
      }
    }
    
    console.log('\n🎊 MASTER TEST SUITE COMPLETADO');
    console.log('='.repeat(80));
  }

  async run() {
    console.log('\n' + '█'.repeat(80));
    console.log('█' + ' '.repeat(78) + '█');
    console.log('█' + '              🧪 MASTER TEST SUITE - TOOLBOX 🧪'.padEnd(78) + '█');
    console.log('█' + ' '.repeat(78) + '█');
    console.log('█'.repeat(80));
    
    this.log('🚀 Iniciando Master Test Suite...', 'header');
    
    // Verificar servidor antes de empezar
    const serverRunning = await this.checkServerStatus();
    
    // Lista de tests a ejecutar
    const testSuite = [
      {
        script: 'production-final-report.js',
        description: 'Análisis de estructura del proyecto',
        requiresServer: false
      },
      {
        script: 'test-production-quick.js',
        description: 'Test rápido de funcionalidad',
        requiresServer: true
      },
      {
        script: 'test-load-stress.js',
        description: 'Test de carga y estrés',
        requiresServer: true
      },
      {
        script: 'deployment-simulation.js',
        description: 'Simulación de deployment',
        requiresServer: false
      },
      {
        script: 'final-production-summary.js',
        description: 'Resumen final de producción',
        requiresServer: false
      }
    ];
    
    // Ejecutar tests
    for (const test of testSuite) {
      if (test.requiresServer && !serverRunning) {
        this.log(`⏭️ Saltando ${test.description} (requiere servidor)`, 'warning');
        this.results.push({
          script: test.script,
          description: test.description,
          success: false,
          skipped: true,
          reason: 'Servidor no disponible'
        });
        continue;
      }
      
      await this.runScript(test.script, test.description);
      
      // Pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Mostrar resumen final
    this.printSummary();
    
    // Recomendaciones finales
    if (!serverRunning) {
      console.log('\n💡 RECOMENDACIÓN:');
      console.log('   Para ejecutar todos los tests, inicia el servidor con "npm start"');
      console.log('   y luego ejecuta este script nuevamente.');
    }
  }
}

// Ejecutar la suite completa
if (require.main === module) {
  const masterSuite = new MasterTestSuite();
  masterSuite.run().catch(console.error);
}

module.exports = MasterTestSuite;
