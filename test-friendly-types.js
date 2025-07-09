// Test para verificar que las funciones de tipos amigables funcionan correctamente
const { getReadableFileType, getReadableFileTypes } = require('./src/lib/utils.ts')

console.log('=== Test de tipos de archivo amigables ===')

// Test individual types
console.log('\n1. Tipos individuales:')
console.log('Word:', getReadableFileType('application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
console.log('PDF:', getReadableFileType('application/pdf'))
console.log('JPEG:', getReadableFileType('image/jpeg'))
console.log('MP3:', getReadableFileType('audio/mpeg'))

// Test multiple types
console.log('\n2. Tipos múltiples:')
console.log('Word + PDF:', getReadableFileTypes([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf'
]))

console.log('Todas las imágenes:', getReadableFileTypes([
  'image/jpeg',
  'image/png',
  'image/gif'
]))

console.log('Wildcards:', getReadableFileTypes([
  'image/*',
  'application/pdf'
]))

console.log('\n=== Test completado ===')
