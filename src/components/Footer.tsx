'use client'

import { Heart, Github, Mail } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 dark:border-gray-800 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">ToolBox</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Una colección de herramientas útiles para procesamiento de imágenes, 
              documentos y audio. Completamente gratis y sin registros.
            </p>
          </div>

          {/* Tools */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Herramientas</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• Procesamiento de imágenes</li>
              <li>• Conversión de documentos</li>
              <li>• Herramientas de audio</li>
              <li>• Más herramientas próximamente</li>
            </ul>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Información</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• Procesamiento local y seguro</li>
              <li>• Sin almacenamiento de archivos</li>
              <li>• Código abierto</li>
              <li>• Privacidad garantizada</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
            Hecho con <Heart className="h-4 w-4 text-red-500" /> para la comunidad
          </p>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {currentYear} ToolBox. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
