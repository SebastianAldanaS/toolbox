import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tool } from '@/types'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'

interface ToolCardProps {
  tool: Tool
  className?: string
}

export function ToolCard({ tool, className }: ToolCardProps) {
  const IconComponent = Icons[tool.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>

  return (
    <Link href={tool.path} className="block group">
      <Card className={cn(
        'transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer',
        'group-hover:border-primary/50',
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {IconComponent && (
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <IconComponent className="h-5 w-5" />
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-lg">{tool.name}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
            {tool.description}
          </CardDescription>
          <div className="mt-3 flex flex-wrap gap-1">
            {tool.acceptedFileTypes.slice(0, 3).map((type, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                {type.split('/')[1] || type}
              </span>
            ))}
            {tool.acceptedFileTypes.length > 3 && (
              <span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                +{tool.acceptedFileTypes.length - 3}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
