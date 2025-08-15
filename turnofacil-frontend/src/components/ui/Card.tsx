import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  onClick
}) => {
  return (
    <div 
      className={`
        bg-white 
        p-6 
        rounded-lg 
        shadow-md 
        ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}