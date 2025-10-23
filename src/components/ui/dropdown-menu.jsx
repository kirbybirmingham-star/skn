import React from 'react'

export const DropdownMenu = ({ children }) => <>{children}</>
export const DropdownMenuTrigger = ({ children, asChild }) => <>{children}</>
export const DropdownMenuContent = ({ children, className = '', ...props }) => <div className={className} {...props}>{children}</div>
export const DropdownMenuItem = ({ children, ...props }) => <div {...props}>{children}</div>
export const DropdownMenuLabel = ({ children, ...props }) => <div {...props}>{children}</div>
export const DropdownMenuSeparator = () => <hr />

export default DropdownMenu
