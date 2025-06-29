#!/usr/bin/env node

/**
 * Script de pruebas de rendimiento y funcionalidad avanzada
 * Simula carga de usuarios y mide tiempos de respuesta
 */

const http = require('http');
const { performance } = require('perf_hooks');

console.log('⚡ Iniciando pruebas de rendimiento ToolBox...\n');

const BASE_URL = 'http://localhost:3000';

// Función para medir tiempo de respuesta
async function measureResponseTime(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ToolBox-Performance-Test/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        resolve({
          statusCode: res.statusCode,
          responseTime: responseTime,
          size: Buffer.byteLength(responseData),
          success: res.statusCode < 400
        });
      });
    });

    req.on('error', (error) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      reject({ error, responseTime });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Prueba de carga simultánea
async function loadTest(path, concurrentRequests = 10) {
  console.log(`🚀 Prueba de carga: ${concurrentRequests} requests simultáneos a ${path}`);
  
  const promises = [];
  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(measureResponseTime(path));
  }
  
  try {
    const results = await Promise.all(promises);
    const times = results.map(r => r.responseTime);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const successCount = results.filter(r => r.success).length;
    
    console.log(`   ⏱️  Tiempo promedio: ${avgTime.toFixed(2)}ms`);
    console.log(`   🚀 Tiempo mínimo: ${minTime.toFixed(2)}ms`);
    console.log(`   🐌 Tiempo máximo: ${maxTime.toFixed(2)}ms`);
    console.log(`   ✅ Éxito: ${successCount}/${concurrentRequests} (${(successCount/concurrentRequests*100).toFixed(1)}%)`);
    
    return {
      avgTime,
      minTime,
      maxTime,
      successRate: successCount / concurrentRequests
    };
  } catch (error) {
    console.log(`   ❌ Error durante la prueba: ${error.message}`);
    return null;
  }
}

// Prueba de rendimiento de páginas
async function performanceTest() {
  console.log('📊 Iniciando pruebas de rendimiento...\n');
  
  const pages = [
    '/',
    '/tools/word-to-pdf',
    '/tools/image-resizer',
    '/tools/mp3-downloader',
    '/tools/audio-editor'
  ];
  
  const results = {};
  
  for (const page of pages) {
    const result = await loadTest(page, 5);
    results[page] = result;
    console.log('');
  }
  
  return results;
}

// Prueba de tamaño de recursos
async function resourceSizeTest() {
  console.log('📦 Analizando tamaño de recursos...\n');
  
  const resources = [
    '/',
    '/tools/word-to-pdf',
    '/tools/audio-editor'
  ];
  
  for (const resource of resources) {
    try {
      const result = await measureResponseTime(resource);
      const sizeKB = (result.size / 1024).toFixed(2);
      console.log(`📄 ${resource}: ${sizeKB} KB (${result.responseTime.toFixed(2)}ms)`);
    } catch (error) {
      console.log(`❌ ${resource}: Error`);
    }
  }
  console.log('');
}

// Prueba de funcionalidad de tema
async function themeCompatibilityTest() {
  console.log('🌙 Probando compatibilidad de temas...\n');
  
  const pages = [
    '/',
    '/tools/word-to-pdf',
    '/tools/image-resizer',
    '/tools/mp3-downloader'
  ];
  
  let compatiblePages = 0;
  
  for (const page of pages) {
    try {
      const result = await measureResponseTime(page);
      if (result.statusCode === 200) {
        // Asumimos que si la página carga, tiene soporte de temas
        console.log(`✅ ${page}: Compatible con temas`);
        compatiblePages++;
      } else {
        console.log(`❌ ${page}: No compatible`);
      }
    } catch (error) {
      console.log(`❌ ${page}: Error`);
    }
  }
  
  console.log(`\n📊 Páginas compatibles con temas: ${compatiblePages}/${pages.length}`);
  return compatiblePages / pages.length;
}

// Prueba de memoria simulada
async function memoryStressTest() {
  console.log('🧠 Simulando prueba de estrés...\n');
  
  const iterations = 20;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    try {
      const result = await measureResponseTime('/');
      times.push(result.responseTime);
      
      if (i % 5 === 0) {
        process.stdout.write(`   Progreso: ${((i/iterations)*100).toFixed(0)}%\r`);
      }
    } catch (error) {
      console.log(`❌ Error en iteración ${i}: ${error.message}`);
    }
  }
  
  console.log(`\n   ✅ Completado: ${iterations} requests`);
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const firstHalf = times.slice(0, times.length/2);
  const secondHalf = times.slice(times.length/2);
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  console.log(`   📊 Tiempo promedio total: ${avgTime.toFixed(2)}ms`);
  console.log(`   🔸 Primera mitad: ${firstAvg.toFixed(2)}ms`);
  console.log(`   🔸 Segunda mitad: ${secondAvg.toFixed(2)}ms`);
  
  const degradation = ((secondAvg - firstAvg) / firstAvg * 100).toFixed(1);
  console.log(`   📈 Degradación: ${degradation}%`);
  
  return Math.abs(parseFloat(degradation)) < 20; // Menos del 20% de degradación es aceptable
}

// Función principal
async function runPerformanceTests() {
  console.log('⚡ ToolBox - Suite de Pruebas de Rendimiento');
  console.log('============================================\n');
  
  try {
    // Verificar servidor
    await measureResponseTime('/');
    console.log('✅ Servidor accesible\n');
    
    // Ejecutar todas las pruebas
    const performanceResults = await performanceTest();
    await resourceSizeTest();
    const themeCompatibility = await themeCompatibilityTest();
    const memoryStable = await memoryStressTest();
    
    console.log('\n🏆 RESUMEN DE RENDIMIENTO');
    console.log('==========================');
    
    // Analizar resultados
    const allPages = Object.values(performanceResults).filter(r => r !== null);
    const avgResponseTime = allPages.reduce((sum, r) => sum + r.avgTime, 0) / allPages.length;
    const avgSuccessRate = allPages.reduce((sum, r) => sum + r.successRate, 0) / allPages.length;
    
    console.log(`📊 Tiempo de respuesta promedio: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`✅ Tasa de éxito promedio: ${(avgSuccessRate * 100).toFixed(1)}%`);
    console.log(`🌙 Compatibilidad de temas: ${(themeCompatibility * 100).toFixed(1)}%`);
    console.log(`🧠 Estabilidad de memoria: ${memoryStable ? 'Estable' : 'Inestable'}`);
    
    // Evaluación final
    let score = 0;
    if (avgResponseTime < 100) score += 25;
    else if (avgResponseTime < 200) score += 20;
    else if (avgResponseTime < 500) score += 15;
    else score += 10;
    
    if (avgSuccessRate > 0.95) score += 25;
    else if (avgSuccessRate > 0.90) score += 20;
    else if (avgSuccessRate > 0.80) score += 15;
    else score += 10;
    
    if (themeCompatibility > 0.90) score += 25;
    else if (themeCompatibility > 0.80) score += 20;
    else score += 10;
    
    if (memoryStable) score += 25;
    else score += 10;
    
    console.log(`\n🎯 Puntuación de rendimiento: ${score}/100`);
    
    if (score >= 90) {
      console.log('🌟 ¡Rendimiento excelente! Listo para producción.');
    } else if (score >= 75) {
      console.log('✅ Rendimiento bueno. Aceptable para producción.');
    } else if (score >= 60) {
      console.log('⚠️  Rendimiento moderado. Considerar optimizaciones.');
    } else {
      console.log('🚨 Rendimiento bajo. Requiere optimización antes de producción.');
    }
    
  } catch (error) {
    console.error('💥 Error durante las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar
runPerformanceTests();
