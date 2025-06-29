#!/usr/bin/env node

/**
 * Test de Carga y Estrés - ToolBox
 * Simula múltiples usuarios concurrentes y mide el rendimiento bajo carga
 */

class LoadStressTest {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      loadTest: [],
      stressTest: [],
      concurrencyTest: [],
      memoryTest: []
    };
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

  async makeRequest(url, method = 'GET', body = null) {
    const startTime = process.hrtime.bigint();
    try {
      const options = { method };
      if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000; // Convert to ms

      return {
        success: response.ok,
        status: response.status,
        responseTime: Math.round(responseTime * 100) / 100,
        url
      };
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000;
      
      return {
        success: false,
        status: 'ERROR',
        responseTime: Math.round(responseTime * 100) / 100,
        error: error.message,
        url
      };
    }
  }

  async loadTest() {
    this.log('🔥 Iniciando test de carga (100 requests)...', 'info');
    
    const urls = [
      this.baseUrl,
      `${this.baseUrl}/tools/mp3-downloader`,
      `${this.baseUrl}/tools/audio-converter`,
      `${this.baseUrl}/tools/image-converter`,
      `${this.baseUrl}/tools/pdf-to-word`
    ];

    const promises = [];
    for (let i = 0; i < 100; i++) {
      const url = urls[i % urls.length];
      promises.push(this.makeRequest(url));
    }

    const results = await Promise.all(promises);
    this.results.loadTest = results;

    const successCount = results.filter(r => r.success).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const maxResponseTime = Math.max(...results.map(r => r.responseTime));
    const minResponseTime = Math.min(...results.map(r => r.responseTime));

    this.log(`📊 Carga - Éxito: ${successCount}/100 (${successCount}%)`, 
             successCount >= 95 ? 'success' : 'warning');
    this.log(`⚡ Tiempo promedio: ${avgResponseTime.toFixed(2)}ms`, 
             avgResponseTime < 500 ? 'success' : 'warning');
    this.log(`📈 Max: ${maxResponseTime.toFixed(2)}ms | Min: ${minResponseTime.toFixed(2)}ms`, 'info');
  }

  async concurrencyTest() {
    this.log('🚀 Iniciando test de concurrencia (50 usuarios simultáneos)...', 'info');
    
    const concurrentUsers = 50;
    const requestsPerUser = 5;
    
    const userPromises = [];
    for (let user = 0; user < concurrentUsers; user++) {
      const userRequests = [];
      for (let req = 0; req < requestsPerUser; req++) {
        userRequests.push(this.makeRequest(`${this.baseUrl}/tools/mp3-downloader`));
      }
      userPromises.push(Promise.all(userRequests));
    }

    const startTime = Date.now();
    const allResults = await Promise.all(userPromises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    const flatResults = allResults.flat();
    this.results.concurrencyTest = flatResults;

    const successCount = flatResults.filter(r => r.success).length;
    const totalRequests = concurrentUsers * requestsPerUser;
    const requestsPerSecond = Math.round((totalRequests / totalTime) * 1000);

    this.log(`🎯 Concurrencia - Éxito: ${successCount}/${totalRequests} (${Math.round(successCount/totalRequests*100)}%)`, 
             successCount >= totalRequests * 0.9 ? 'success' : 'warning');
    this.log(`🚀 Requests/segundo: ${requestsPerSecond}`, 
             requestsPerSecond >= 10 ? 'success' : 'warning');
    this.log(`⏱️ Tiempo total: ${totalTime}ms`, 'info');
  }

  async stressTest() {
    this.log('💪 Iniciando test de estrés (requests rápidos)...', 'info');
    
    const stressResults = [];
    const iterations = 20;
    
    for (let i = 0; i < iterations; i++) {
      const batchPromises = [];
      for (let j = 0; j < 10; j++) {
        batchPromises.push(this.makeRequest(this.baseUrl));
      }
      
      const batchResults = await Promise.all(batchPromises);
      stressResults.push(...batchResults);
      
      // Pequeña pausa entre batches
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.results.stressTest = stressResults;

    const successCount = stressResults.filter(r => r.success).length;
    const avgResponseTime = stressResults.reduce((sum, r) => sum + r.responseTime, 0) / stressResults.length;
    const p95ResponseTime = stressResults
      .map(r => r.responseTime)
      .sort((a, b) => a - b)[Math.floor(stressResults.length * 0.95)];

    this.log(`💥 Estrés - Éxito: ${successCount}/${stressResults.length} (${Math.round(successCount/stressResults.length*100)}%)`, 
             successCount >= stressResults.length * 0.85 ? 'success' : 'warning');
    this.log(`⚡ Tiempo promedio: ${avgResponseTime.toFixed(2)}ms`, 
             avgResponseTime < 800 ? 'success' : 'warning');
    this.log(`📊 P95: ${p95ResponseTime.toFixed(2)}ms`, 
             p95ResponseTime < 1500 ? 'success' : 'warning');
  }

  async memoryStabilityTest() {
    this.log('🧠 Iniciando test de estabilidad de memoria...', 'info');
    
    const iterations = 50;
    const memoryResults = [];
    
    for (let i = 0; i < iterations; i++) {
      const before = process.memoryUsage();
      
      // Hacer varias requests
      const promises = [];
      for (let j = 0; j < 5; j++) {
        promises.push(this.makeRequest(`${this.baseUrl}/tools/audio-converter`));
      }
      await Promise.all(promises);
      
      const after = process.memoryUsage();
      memoryResults.push({
        iteration: i,
        heapUsed: after.heapUsed - before.heapUsed,
        heapTotal: after.heapTotal - before.heapTotal,
        external: after.external - before.external
      });
      
      // Forzar garbage collection si está disponible
      if (global.gc) {
        global.gc();
      }
      
      if (i % 10 === 0) {
        this.log(`🔄 Iteración ${i}/${iterations}`, 'info');
      }
    }

    this.results.memoryTest = memoryResults;

    const avgHeapIncrease = memoryResults.reduce((sum, r) => sum + r.heapUsed, 0) / memoryResults.length;
    const maxHeapIncrease = Math.max(...memoryResults.map(r => r.heapUsed));
    
    this.log(`🧠 Incremento promedio de heap: ${(avgHeapIncrease / 1024 / 1024).toFixed(2)}MB`, 
             avgHeapIncrease < 10 * 1024 * 1024 ? 'success' : 'warning'); // < 10MB
    this.log(`📈 Incremento máximo de heap: ${(maxHeapIncrease / 1024 / 1024).toFixed(2)}MB`, 
             maxHeapIncrease < 50 * 1024 * 1024 ? 'success' : 'warning'); // < 50MB
  }

  async apiLoadTest() {
    this.log('🔧 Iniciando test de carga en APIs...', 'info');
    
    const apiTests = [];
    
    // Test YouTube API
    for (let i = 0; i < 10; i++) {
      apiTests.push(
        this.makeRequest(
          `${this.baseUrl}/api/tools/mp3-downloader/test`,
          'POST',
          { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
        )
      );
    }

    const apiResults = await Promise.all(apiTests);
    const successCount = apiResults.filter(r => r.success).length;
    const avgResponseTime = apiResults.reduce((sum, r) => sum + r.responseTime, 0) / apiResults.length;

    this.log(`🔌 APIs - Éxito: ${successCount}/${apiResults.length} (${Math.round(successCount/apiResults.length*100)}%)`, 
             successCount >= apiResults.length * 0.8 ? 'success' : 'warning');
    this.log(`⚡ Tiempo promedio API: ${avgResponseTime.toFixed(2)}ms`, 
             avgResponseTime < 2000 ? 'success' : 'warning');
  }

  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 REPORTE COMPLETO DE RENDIMIENTO Y CARGA');
    console.log('='.repeat(70));

    // Calcular métricas generales
    const allTests = [
      ...this.results.loadTest,
      ...this.results.stressTest,
      ...this.results.concurrencyTest
    ];

    const totalRequests = allTests.length;
    const successfulRequests = allTests.filter(r => r.success).length;
    const overallSuccessRate = Math.round((successfulRequests / totalRequests) * 100);
    const overallAvgResponseTime = allTests.reduce((sum, r) => sum + r.responseTime, 0) / allTests.length;

    console.log(`🎯 Requests totales: ${totalRequests}`);
    console.log(`✅ Tasa de éxito general: ${overallSuccessRate}%`);
    console.log(`⚡ Tiempo promedio general: ${overallAvgResponseTime.toFixed(2)}ms`);

    // Evaluación final
    let score = 0;
    let maxScore = 100;

    // Tasa de éxito (40 puntos)
    score += Math.min(40, (overallSuccessRate / 100) * 40);

    // Rendimiento (30 puntos)
    const performanceScore = overallAvgResponseTime < 200 ? 30 : 
                            overallAvgResponseTime < 500 ? 25 : 
                            overallAvgResponseTime < 1000 ? 20 : 
                            overallAvgResponseTime < 2000 ? 15 : 10;
    score += performanceScore;

    // Estabilidad (30 puntos)
    const stabilityScore = this.results.memoryTest.length > 0 ? 30 : 20;
    score += stabilityScore;

    const finalScore = Math.round(score);

    console.log(`\n📈 PUNTUACIÓN FINAL: ${finalScore}/${maxScore}`);
    
    if (finalScore >= 90) {
      console.log('🏆 ¡EXCELENTE! Rendimiento excepcional, listo para alta carga.');
    } else if (finalScore >= 80) {
      console.log('🥇 MUY BUENO. Rendimiento sólido para producción.');
    } else if (finalScore >= 70) {
      console.log('🥈 BUENO. Rendimiento aceptable con margen de mejora.');
    } else if (finalScore >= 60) {
      console.log('🥉 REGULAR. Necesita optimización antes de alta carga.');
    } else {
      console.log('❌ CRÍTICO. Requiere mejoras significativas de rendimiento.');
    }

    console.log('\n📅 Fecha del test:', new Date().toLocaleString());
    console.log('='.repeat(70));
  }

  async run() {
    try {
      this.log('🚀 Iniciando suite completa de tests de rendimiento...', 'info');
      
      // Verificar que el servidor esté corriendo
      const serverCheck = await this.makeRequest(this.baseUrl);
      if (!serverCheck.success) {
        this.log('❌ El servidor no está disponible. Ejecuta "npm start" primero.', 'error');
        return;
      }

      this.log('✅ Servidor detectado, iniciando tests...', 'success');

      // Ejecutar todos los tests
      await this.loadTest();
      await this.concurrencyTest();
      await this.stressTest();
      await this.memoryStabilityTest();
      await this.apiLoadTest();

      // Generar reporte final
      this.generateReport();

    } catch (error) {
      this.log(`❌ Error durante los tests: ${error.message}`, 'error');
    }
  }
}

// Ejecutar el test
if (require.main === module) {
  const tester = new LoadStressTest();
  tester.run().catch(console.error);
}

module.exports = LoadStressTest;
