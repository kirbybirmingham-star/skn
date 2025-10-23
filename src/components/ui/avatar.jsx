import React from 'react'

export const Avatar = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>{children}</div>
)
export const AvatarImage = ({ src, alt, ...props }) => (
  <img src={src} alt={alt} {...props} />
)
export const AvatarFallback = ({ children, ...props }) => (
  <div {...props}>{children}</div>
)

export default Avatar
