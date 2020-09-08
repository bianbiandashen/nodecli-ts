


interface Decorator {
  (target: any, key: string, descriptor: PropertyDescriptor): void
}

interface SingleDecorator {
  (value: any): Decorator
}



//ts  文件中的Transactional 指的是这个单利 


export const Transactional: SingleDecorator
