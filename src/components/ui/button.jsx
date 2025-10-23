import React from 'react'

export function Button({ children, asChild = false, className = '', ...props }) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { ...props, className: [className, children.props.className].filter(Boolean).join(' ') })
  }
  return (
    <button className={className} {...props}>
      {children}
    </button>
  )
}

export default Button
