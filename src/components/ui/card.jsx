import React from 'react'
import { cn } from '@/lib/utils'

export const Card = ({ children, className = '', ...props }) => (
  <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)} {...props}>{children}</div>
)
export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>{children}</div>
)
export const CardContent = ({ children, className = '', ...props }) => (
  <div className={cn('p-6 pt-0', className)} {...props}>{children}</div>
)
export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...props}>{children}</p>
)
export const CardTitle = ({ children, className = '', ...props }) => (
  <div className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props}>{children}</div>
)

export default Card
