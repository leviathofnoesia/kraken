export function calculateAdd(a: number, b: number): number {
  return a + b
}

export function multiplyNumbers(x: number, y: number): number {
  return x * y
}

interface User {
  name: string
  age: number
}

export function createGreeting(user: User): string {
  return `Hello, ${user.name}! You are ${user.age} years old.`
}
