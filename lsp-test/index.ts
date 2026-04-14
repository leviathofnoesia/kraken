function greet(name: string): string {
  return `Hello, ${name}!`
}

function calculateSum(a: number, b: number): number {
  return a + b
}

interface User {
  name: string
  age: number
}

function getUserInfo(user: User): string {
  return `User ${user.name} is ${user.age} years old`
}

const testUser: User = {
  name: "Alice",
  age: 30
}

console.log(greet("World"))
console.log(`Sum: ${calculateSum(5, 3)}`)
console.log(getUserInfo(testUser))
