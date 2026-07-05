export class Registry<T> {
  private readonly items = new Map<string, T>()

  constructor(private readonly type: string) {}

  register(name: string, implementation: T): void {
    if (this.items.has(name)) {
      throw new Error(`${this.type} déjà enregistré : ${name}`)
    }

    this.items.set(name, implementation)
  }

  get(name: string): T {
    const item = this.items.get(name)

    if (!item) {
      throw new Error(`${this.type} introuvable : ${name}`)
    }

    return item
  }

  has(name: string): boolean {
    return this.items.has(name)
  }

  list(): string[] {
    return [...this.items.keys()]
  }

  all(): T[] {
    return [...this.items.values()]
  }
}
