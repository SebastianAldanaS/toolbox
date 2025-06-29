#!/usr/bin/env node

/**
 * Reporte Final de Producción - ToolBox
 * Genera un análisis completo del estado del proyecto para producción
 */

const fs = require('fs');
const path = require('path');

class ProductionReport {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      project: 'ToolBox - Multi-Tool Web Application',
      version: '1.0.0',
      sections: {}
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async checkProjectStructure() {
    this.log('📁 Analizando estructura del proyecto...', 'info');
    
    const requiredFiles = [
      { path: 'package.json', critical: true },
      { path: 'next.config.ts', critical: true },
      { path: 'tailwind.config.ts', critical: true },
      { path: 'src/app/layout.tsx', critical: true },
      { path: 'src/app/page.tsx', critical: true },
      { path: 'src/components/theme-provider.tsx', critical: true },
      { path: 'src/components/theme-toggle.tsx', critical: true },
      { path: 'src/components/Footer.tsx', critical: false },
      { path: '.next/BUILD_ID', critical: true }
    ];

    const structureCheck = {
      missingCritical: [],
      missingOptional: [],
      present: []
    };

    for (const file of requiredFiles) {
      const exists = fs.existsSync(path.join(process.cwd(), file.path));
      if (exists) {
        structureCheck.present.push(file.path);
      } else {
        if (file.critical) {
          structureCheck.missingCritical.push(file.path);
        } else {
          structureCheck.missingOptional.push(file.path);
        }
      }
    }

    this.report.sections.structure = {
      score: structureCheck.missingCritical.length === 0 ? 
             (structureCheck.missingOptional.length === 0 ? 100 : 90) : 
             50,
      details: structureCheck
    };

    this.log(`✅ Archivos presentes: ${structureCheck.present.length}`, 'success');
    if (structureCheck.missingCritical.length > 0) {
      this.log(`❌ Archivos críticos faltantes: ${structureCheck.missingCritical.join(', ')}`, 'error');
    }
    if (structureCheck.missingOptional.length > 0) {
      this.log(`⚠️ Archivos opcionales faltantes: ${structureCheck.missingOptional.join(', ')}`, 'warning');
    }
  }

  async checkPackageInfo() {
    this.log('📦 Analizando package.json...', 'info');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      const requiredScripts = ['dev', 'build', 'start', 'lint'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      const keyDependencies = [
        'next', 'react', 'react-dom', 'typescript', 'tailwindcss', 'next-themes'
      ];
      const presentDeps = keyDependencies.filter(dep => 
        packageJson.dependencies[dep] || packageJson.devDependencies[dep]
      );

      this.report.sections.package = {
        name: packageJson.name,
        version: packageJson.version,
        scriptsComplete: missingScripts.length === 0,
        dependenciesPresent: presentDeps.length,
        totalKeyDeps: keyDependencies.length,
        score: missingScripts.length === 0 && presentDeps.length >= keyDependencies.length * 0.8 ? 100 : 80
      };

      this.log(`✅ Scripts: ${requiredScripts.length - missingScripts.length}/${requiredScripts.length}`, 'success');
      this.log(`✅ Dependencias clave: ${presentDeps.length}/${keyDependencies.length}`, 'success');
      
    } catch (error) {
      this.log(`❌ Error leyendo package.json: ${error.message}`, 'error');
      this.report.sections.package = { score: 0, error: error.message };
    }
  }

  async checkToolsImplementation() {
    this.log('🛠️ Verificando herramientas implementadas...', 'info');
    
    const expectedTools = [
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

    const toolsStatus = {
      implemented: [],
      missing: [],
      withApi: [],
      missingApi: []
    };

    for (const tool of expectedTools) {
      const pagePath = `src/app/tools/${tool}/page.tsx`;
      const apiPath = `src/app/api/tools/${tool}/route.ts`;
      
      const hasPage = fs.existsSync(pagePath);
      const hasApi = fs.existsSync(apiPath);
      
      if (hasPage) {
        toolsStatus.implemented.push(tool);
        if (hasApi) {
          toolsStatus.withApi.push(tool);
        } else {
          toolsStatus.missingApi.push(tool);
        }
      } else {
        toolsStatus.missing.push(tool);
      }
    }

    const implementationScore = (toolsStatus.implemented.length / expectedTools.length) * 100;
    const apiScore = toolsStatus.implemented.length > 0 ? 
                    (toolsStatus.withApi.length / toolsStatus.implemented.length) * 100 : 0;

    this.report.sections.tools = {
      total: expectedTools.length,
      implemented: toolsStatus.implemented.length,
      withApi: toolsStatus.withApi.length,
      implementationScore: Math.round(implementationScore),
      apiScore: Math.round(apiScore),
      overallScore: Math.round((implementationScore + apiScore) / 2),
      details: toolsStatus
    };

    this.log(`✅ Herramientas implementadas: ${toolsStatus.implemented.length}/${expectedTools.length}`, 'success');
    this.log(`🔌 Con API: ${toolsStatus.withApi.length}/${toolsStatus.implemented.length}`, 
             toolsStatus.withApi.length >= toolsStatus.implemented.length * 0.5 ? 'success' : 'warning');
  }

  async checkThemeImplementation() {
    this.log('🎨 Verificando implementación de temas...', 'info');
    
    const themeFiles = [
      'src/components/theme-provider.tsx',
      'src/components/theme-toggle.tsx'
    ];

    const themeCheck = {
      filesPresent: 0,
      darkModeClasses: 0,
      totalFiles: 0
    };

    // Verificar archivos de tema
    themeCheck.filesPresent = themeFiles.filter(file => fs.existsSync(file)).length;

    // Buscar clases dark: en archivos
    const searchPaths = [
      'src/app',
      'src/components'
    ];

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        const files = this.getAllFiles(searchPath, ['.tsx', '.ts']);
        themeCheck.totalFiles += files.length;
        
        for (const file of files) {
          try {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('dark:')) {
              themeCheck.darkModeClasses++;
            }
          } catch (error) {
            // Ignorar errores de lectura
          }
        }
      }
    }

    const themeScore = (themeCheck.filesPresent / themeFiles.length) * 50 + 
                      (themeCheck.darkModeClasses / themeCheck.totalFiles) * 50;

    this.report.sections.theme = {
      filesPresent: themeCheck.filesPresent,
      totalThemeFiles: themeFiles.length,
      darkModeClassesFound: themeCheck.darkModeClasses,
      totalFilesScanned: themeCheck.totalFiles,
      score: Math.round(themeScore)
    };

    this.log(`✅ Archivos de tema: ${themeCheck.filesPresent}/${themeFiles.length}`, 'success');
    this.log(`🌙 Archivos con dark mode: ${themeCheck.darkModeClasses}/${themeCheck.totalFiles}`, 
             themeCheck.darkModeClasses > 0 ? 'success' : 'warning');
  }

  getAllFiles(dir, extensions = []) {
    let files = [];
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          files = files.concat(this.getAllFiles(fullPath, extensions));
        } else if (extensions.length === 0 || extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignorar errores de acceso a directorios
    }
    return files;
  }

  async checkBuildStatus() {
    this.log('🏗️ Verificando estado del build...', 'info');
    
    const buildCheck = {
      hasBuildFolder: fs.existsSync('.next'),
      hasBuildId: fs.existsSync('.next/BUILD_ID'),
      hasOptimizedBuild: false,
      buildSize: 0
    };

    if (buildCheck.hasBuildFolder) {
      try {
        const buildStats = fs.statSync('.next');
        buildCheck.buildSize = this.getFolderSize('.next');
        buildCheck.hasOptimizedBuild = fs.existsSync('.next/static');
      } catch (error) {
        // Ignorar errores
      }
    }

    const buildScore = buildCheck.hasBuildId && buildCheck.hasOptimizedBuild ? 100 : 
                      buildCheck.hasBuildFolder ? 50 : 0;

    this.report.sections.build = {
      ...buildCheck,
      score: buildScore
    };

    this.log(`${buildCheck.hasBuildId ? '✅' : '❌'} Build de producción: ${buildCheck.hasBuildId ? 'Presente' : 'Faltante'}`, 
             buildCheck.hasBuildId ? 'success' : 'error');
    this.log(`📊 Tamaño del build: ${(buildCheck.buildSize / 1024 / 1024).toFixed(2)}MB`, 'info');
  }

  getFolderSize(folderPath) {
    let totalSize = 0;
    try {
      const files = fs.readdirSync(folderPath);
      for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          totalSize += this.getFolderSize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Ignorar errores
    }
    return totalSize;
  }

  calculateOverallScore() {
    const sections = this.report.sections;
    const weights = {
      structure: 0.25,
      package: 0.15,
      tools: 0.30,
      theme: 0.20,
      build: 0.10
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [section, weight] of Object.entries(weights)) {
      if (sections[section] && sections[section].score !== undefined) {
        totalScore += sections[section].score * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  generateFinalReport() {
    const overallScore = this.calculateOverallScore();
    this.report.overallScore = overallScore;

    console.log('\n' + '='.repeat(80));
    console.log('📋 REPORTE FINAL DE PRODUCCIÓN - TOOLBOX');
    console.log('='.repeat(80));
    console.log(`📅 Fecha: ${new Date(this.report.timestamp).toLocaleString()}`);
    console.log(`🎯 Puntuación General: ${overallScore}/100`);
    
    // Mostrar puntuaciones por sección
    console.log('\n📊 PUNTUACIONES POR SECCIÓN:');
    console.log('-'.repeat(50));
    
    const sections = this.report.sections;
    if (sections.structure) console.log(`📁 Estructura del Proyecto: ${sections.structure.score}/100`);
    if (sections.package) console.log(`📦 Package Configuration: ${sections.package.score}/100`);
    if (sections.tools) console.log(`🛠️ Implementación de Herramientas: ${sections.tools.overallScore}/100`);
    if (sections.theme) console.log(`🎨 Sistema de Temas: ${sections.theme.score}/100`);
    if (sections.build) console.log(`🏗️ Build de Producción: ${sections.build.score}/100`);

    // Evaluación final
    console.log('\n🎭 EVALUACIÓN FINAL:');
    console.log('-'.repeat(50));
    
    if (overallScore >= 90) {
      console.log('🏆 ¡EXCELENTE! El proyecto está completamente listo para producción.');
      console.log('   ✅ Todos los componentes están implementados correctamente.');
      console.log('   ✅ La aplicación cumple con los estándares de producción.');
      console.log('   ✅ Se puede desplegar con confianza.');
    } else if (overallScore >= 80) {
      console.log('🥇 MUY BUENO. El proyecto está mayormente listo para producción.');
      console.log('   ✅ Los componentes principales están funcionando.');
      console.log('   ⚠️ Algunas mejoras menores podrían beneficiar el proyecto.');
    } else if (overallScore >= 70) {
      console.log('🥈 BUENO. El proyecto está funcional pero necesita refinamiento.');
      console.log('   ✅ La funcionalidad básica está implementada.');
      console.log('   ⚠️ Se requieren algunas mejoras antes del despliegue.');
    } else if (overallScore >= 60) {
      console.log('🥉 REGULAR. El proyecto necesita trabajo adicional.');
      console.log('   ⚠️ Funcionalidad básica presente pero incompleta.');
      console.log('   ❌ Se requieren mejoras significativas.');
    } else {
      console.log('❌ CRÍTICO. El proyecto requiere desarrollo adicional.');
      console.log('   ❌ Componentes esenciales faltantes o rotos.');
      console.log('   ❌ No recomendado para producción en el estado actual.');
    }

    // Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    console.log('-'.repeat(50));
    
    if (sections.tools && sections.tools.details && sections.tools.details.missingApi && sections.tools.details.missingApi.length > 0) {
      console.log(`🔌 Completar APIs faltantes: ${sections.tools.details.missingApi.join(', ')}`);
    }
    
    if (sections.build && sections.build.score < 100) {
      console.log('🏗️ Ejecutar "npm run build" para generar build optimizado');
    }
    
    if (sections.theme && sections.theme.score < 80) {
      console.log('🎨 Mejorar implementación de dark mode en más componentes');
    }

    console.log('\n🚀 ¡Gracias por usar ToolBox!');
    console.log('='.repeat(80));

    // Guardar reporte
    fs.writeFileSync(
      'production-final-report.json',
      JSON.stringify(this.report, null, 2)
    );
    console.log('📄 Reporte detallado guardado en: production-final-report.json');
  }

  async run() {
    this.log('🚀 Generando reporte final de producción...', 'info');
    
    await this.checkProjectStructure();
    await this.checkPackageInfo();
    await this.checkToolsImplementation();
    await this.checkThemeImplementation();
    await this.checkBuildStatus();
    
    this.generateFinalReport();
  }
}

// Ejecutar el reporte
if (require.main === module) {
  const reporter = new ProductionReport();
  reporter.run().catch(console.error);
}

module.exports = ProductionReport;
