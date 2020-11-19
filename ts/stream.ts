class Stream<T> {
  arr: T[];
  i: number;

  constructor(arr: T[]) {
    this.arr = arr;
    this.i = 0;
  }

  peek(): T {
    if (this.eof()) {
      throw new Error("peek after end of stream");
    }
    return this.arr[this.i];
  }

  consume(): T {
    if (this.eof()) {
      throw new Error("consume after end of stream");
    }
    return this.arr[this.i++];
  }

  eof(): boolean {
    return this.i >= this.arr.length;
  }
}
