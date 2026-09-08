export class ObjectPool {
    create;
    reset;
    free = [];
    constructor(create, reset, warm = 0) {
        this.create = create;
        this.reset = reset;
        for (let i = 0; i < warm; i += 1)
            this.free.push(this.create());
    }
    acquire() { return this.free.pop() ?? this.create(); }
    release(item) { this.reset(item); this.free.push(item); }
    clear(dispose) { if (dispose)
        this.free.forEach(dispose); this.free = []; }
}
