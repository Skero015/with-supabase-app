import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Sample Test Suite', () => {
  it('should render a button component', () => {
    render(<Button>Test Button</Button>)
    
    const button = screen.getByRole('button', { name: /test button/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Test Button')
  })

  it('should perform basic arithmetic', () => {
    expect(2 + 2).toBe(4)
    expect(10 - 5).toBe(5)
    expect(3 * 4).toBe(12)
  })

  it('should handle string operations', () => {
    const greeting = 'Hello, World!'
    expect(greeting).toContain('World')
    expect(greeting.length).toBe(13)
  })
})