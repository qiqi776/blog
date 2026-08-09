---
title: sync.Map 源码解析
date: 2026-01-14
order: 6
---

`sync.Map` 是 Go 语言在 1.9 版本引入的，专门为了解决 `sync.RWMutex` + `map` 在读多写少场景下，因为锁竞争导致的 CPU 缓存伪共享和性能下降问题。它的核心设计哲学是：空间换时间和读写分离

| 特性         | sync.Map                                        | standard map + RWMutex             |
| ------------ | ----------------------------------------------- | ---------------------------------- |
| **读性能**   | **极高** (原子操作，无锁)                       | 高 (读锁，有 CPU Cache Contention) |
| **写性能**   | 低 (新 Key 写入慢，需拷贝)                      | 中                                 |
| **扩容开销** | 渐进式 (通过 dirty 晋升)                        | Stop The World (标准 map 扩容)     |
| **适用场景** | **读多写少** (配置中心、缓存)；**Key 集合稳定** | 读写较均衡；Key 频繁变动           |

### 一、api 基本用法

我们通过一个 testing 熟悉一下 sync.map 的 api

```go
func Test_sync_map(t *testing.T) {
    var smp sync.Map
    smp.Store("key1", "val1")
    // smp.Delete("key1")
    v, ok := smp.Load("key1")
    if !ok {
        t.Error("key1 not exits")
        return
    }
    smp.Store("key2", "val2")
    smp.Store("key3", "val3")
    smp.Store("key4", "val4")
    smp.Range(func(key, value any) bool {
        t.Errorf("k: %+v, v: %+v", key, value)
        return key != "key2"
    })
    str, _ := v.(string)
    t.Errorf("v: %+v", str)
}
```

### 二、核心数据结构

`sync.Map`并没有使用单一的哈希表，而是维护了**两个**Map：一个用于无锁读取（`read`），一个用于加锁写入（`dirty`）

```go
type Map struct {
    mu Mutex
    // read 并发访问是安全的，所以可以无锁访问部分内容。
    // 实际上存储的是 readOnly 结构体
    read atomic.Value

    // dirty 包含当前 map 中所有的数据（包含新写入的）
    // 访问 dirty 必须持有 mu 锁
    dirty map[any]*entry

    // 记录从 read 中读取失败的次数
    // 当 misses >= len(dirty) 时，dirty 会被晋升为 read
    misses int
}

type readOnly struct {
    m       map[any]*entry // 底层 map
    amended bool           // 这是一个标记位
                           // 如果 dirty 里包含了一些 m 里没有的新 Key，它是 true
                           // 如果 dirty 为 nil 或 数据和 m 一致，它是 false
}

```

readOnly 相当于 Map 的一个“只读快照”，虽然 Value 可以通过指针修改，但 Map 的 Key 集合在它是 readOnly 的期间是不变的

`sync.Map` 的值不是直接存储的，而是包装在一个 `entry` 结构体中，包含一个指针 p

```go
type entry struct {
    // p 指向具体存储的值。
    // 状态机：
    // 1. p == nil: 软删除态：键已被逻辑删除，但该键还在 read map 中
    // 2. p == expunged (哨兵)硬删除态: 指向固定的全局变量 expunged
    // 3. 存活态
    p unsafe.Pointer
}
// Store 操作可以将其通过 CAS 恢复为有效值。
var expunged = unsafe.Pointer(new(any))
```

`read` 和 `dirty` 中的 key 指向的是同一个 `entry`。如果只需要修改 `entry` 中的值（且该 key 已经在 `read` 中），我们可以通过 CAS 操作直接修改 `p` 指针，不需要考虑加全局锁

### 三、具体流程

#### 1. Load

<!-- 这是一张图片，ocr 内容为： -->

![](/go/syncmap/1.png)

```go
func (m *Map) Load(key any) (value any, ok bool) {
    // 1. 尝试无锁读取
	read, _ := m.read.Load().(readOnly)
	e, ok := read.m[key]

    // 如果 read 里没找到，且标记说 dirty 里有新数据
	if !ok && read.amended {
		m.mu.Lock() // 加锁

        // 2. Double Check (防止在加锁过程中 dirty 已经晋升为 read)
		read, _ = m.read.Load().(readOnly)
		e, ok = read.m[key]

        // 如果 read 里还是没有，且 dirty 里确实有新数据
		if !ok && read.amended {
            // 3. 查 dirty map
			e, ok = m.dirty[key]

            // 4. 记录一次 Miss (不管 dirty 里找没找到，都算穿透)
            // 这会导致 misses++，可能触发 dirty -> read 的晋升
			m.missLocked()
		}
		m.mu.Unlock()
	}

    // 如果最终没找到 entry
	if !ok {
		return nil, false
	}

    // 5. 取出 entry 中的值 (判断是否为 nil 或 expunged)
	return e.load()
}
```

`mu.Unlock`。这两个函数分别处于 `sync.Map` 机制的两端：

- `entry.load`是最底层的**取值**逻辑，负责把 `unsafe.Pointer` 翻译成用户能用的值
- `missLocked`是宏观的**调度**逻辑，负责判断什么时候把 dirty 转为 read

`entry.load`如何安全地读取值？

这个函数是 `Load` 方法的最后一步。当我们找到了 Key 对应的 `entry` 后，需要要把里面的值取出来

```go
func (e *entry) load() (value any, ok bool) {
    // 1. 原子读取指针 p
    p := atomic.LoadPointer(&e.p)

    // 2. 判断状态
    // nil: 逻辑删除了
    // expunged: 逻辑删除了，且已被清洗出 dirty
    if p == nil || p == expunged {
        return nil, false
    }

    // 3. 还原为 interface{} (any)
    return *(*any)(p), true
}
```

1. **原子性（`atomic.LoadPointer`）**：因为 `entry.p` 可能正在被其他协程并发修改（比如正在 `Store` 更新值，或者正在被 `Delete` 置为 `nil`），所以必须用原子加载。要么读到旧值，要么读到新值，不会读到写了一半的脏数据
2. **屏蔽内部状态（`expunged`）**：

- 对于用户来说，**Key 不存在** 和 **Key 被删除** 是一回事。所以无论 `p` 是 `nil` 还是 `expunged`，函数都返回 `nil, false`
- `expunged`是 `Store` 操作的哨兵标记。 它标识该 Key 已从 dirty 中剔除，写入时需加锁将其复活；而 Load 操作则将其视为空

**`missLocked`**: Dirty 什么时候晋升为 Read？

这个函数是 `sync.Map` 实现**自适应高性能**的关键，它在每次 `Load` 操作穿透 `read` 访问 `dirty` 时被调用（前提是加了锁）

```go
func (m *Map) missLocked() {
    // 1. 增加穿透计数
    m.misses++

    // 2. 判断阈值 (dirty map 的长度)
    // 如果穿透次数 达到了 dirty 中缓存的 key 的数量，
    // 系统就认为 read map 实在太旧了，必须要更新了。
    if m.misses < len(m.dirty) {
        return
    }

    // 3. 晋升
    // 将 dirty map 封装成 readOnly，原子替换掉当前的 read。
    // 此时，amended 自动变回 false
    m.read.Store(readOnly{m: m.dirty})

    // 4. 重置状态
    // dirty 置为 nil。注意：这里不是清空 map，而是直接丢弃引用。
    // 下次 Store 时会重建 dirty。
    m.dirty = nil
    m.misses = 0
}

```

1. **为什么阈值是 `len(m.dirty)`？**

- 如果 `misses` 次数很多，说明我们在频繁地加锁访问 `dirty`。这违背了 `sync.Map` “读操作无锁”的设计初衷，官方认为，当 Miss 次数等于 Dirty 长度时，意味着已经把 Dirty 里的每个 Key 都访问了一遍，必须把 `dirty` 提升上来

2. `m.read.Store` 发生了什么？

- `read` 原本指向旧的 map，现在瞬间指向了包含最新全量数据的 `dirty` map。**原子操作**替换瞬间完成，期间不会阻塞读操作

3. `m.dirty = nil`的深意

- 晋升后，`dirty` 变成了 `nil`，下一次发生写入时，代价会很大
- 因为下一次 `Store` 发现 `dirty` 是 `nil`，它需要把 `read` 里的所有有效数据**复制**一份出来创建新的 `dirty`（就是 Copy-on-Write 的逻辑）
- `missLocked`优化了读，让之后的读都命中 read，但增加了下一次写的成本（因为要重建 dirty）。这也再次印证了 `sync.Map` 适合读多写少

#### 2. Store

<!-- 这是一张图片，ocr 内容为： -->

![](/go/syncmap/2.png)

```go
func (m *Map) Store(key, value any) {
    // 1. Fast Path: 如果 key 在 read 中存在，尝试直接 CAS 更新
	read, _ := m.read.Load().(readOnly)
	if e, ok := read.m[key]; ok && e.tryStore(&value) {
		return // 成功直接返回，全程无锁
	}

    // Slow Path: 需要加锁
	m.mu.Lock()
	read, _ = m.read.Load().(readOnly)

	if e, ok := read.m[key]; ok {
        // Case A: Key 在 read 中
		if e.unexpungeLocked() {
            // 如果 entry 是 expunged (说明 dirty 初始化时抛弃了它)
            // 必须把它加回 dirty，否则 read 和 dirty 数据不一致
			m.dirty[key] = e
		}
        // 原子更新 entry 的值
		e.storeLocked(&value)

	} else if e, ok := m.dirty[key]; ok {
        // Case B: Key 不在 read 中，但在 dirty 中
        // 直接更新 dirty 中的 entry
		e.storeLocked(&value)

	} else {
        // Case C: 全新的 Key (read 和 dirty 都没有)
		if !read.amended {
            // 如果这是自上次晋升后的第一个新 Key
            // 需要将 read 中的有效数据拷贝到 dirty (延迟初始化)
			m.dirtyLocked()
			m.read.Store(readOnly{m: read.m, amended: true})
		}

        // 将新 Key 放入 dirty
		m.dirty[key] = newEntry(value)
	}
	m.mu.Unlock()
}
```

写入逻辑比较复杂，分为三种情况

**Case 1: Key 已在 Read 中（且未被标记清除）**：

- 直接使用 CAS 操作尝试修改 `entry.p`
- 不需要锁，纯原子操作，性能极高。_这是 sync.Map 性能优于 RWMutex 的核心场景_

**Case 2: Key 在 Read 中，但被标记为 expunged（已清除）**：

- 说明该 Key 被删除了，且之后发生过 `dirty` -> `read` 的晋升（清理了脏数据）
- 此时必须加锁，将该 Key 重新加入 `dirty`（unexpunge），然后更新值

**Case 3: Key 不在 Read 中**：

- 加锁，再次检查 `read`
- 如果 `dirty` 中有，直接更新。如果 `dirty` 中没有（这是一个全新的 Key）：
  - 如果 `read.amended` 是 false（意味着这是自上次晋升以来的第一个新 Key），需要将 `read` 中的所有未删除数据浅拷贝到 `dirty` 中
- 将新 Key 写入 `dirty`。`read.amended` 置为 true

##### `entry.tryStore`

这是 `Store` 操作的第一步尝试，完全**无锁**。它试图通过原子操作直接修改值。

```go
func (e *entry) tryStore(i *any) bool {
    for {
        p := atomic.LoadPointer(&e.p)
        // 如果发现是 expunged，说明 dirty 里没有这个 key。
        // 不能直接改，read 里有了新值，但 dirty 里依然没有这个 key，
        // 导致数据不一致
        if p == expunged {
            return false
        }
        // CAS 尝试将 p 替换为新值 i
        if atomic.CompareAndSwapPointer(&e.p, p, unsafe.Pointer(i)) {
            return true
            // 如果返回 false，外层函数 Store 会被迫进入加锁流程
        }
    }
}
```

##### `entry.unexpungeLocked`

**场景**：`dirty` 刚被初始化过，剔除了所有已删除的 Key。现在我们要给一个被剔除的 Key 重新赋值

```go
func (e *entry) unexpungeLocked() (wasExpunged bool) {
    // 使用 CAS 将 expunged 替换为 nil
    return atomic.CompareAndSwapPointer(&e.p, expunged, nil)
}
```

`Store` 函数看到它返回 `true` 后，会立即执行 `m.dirty[key] = e`，将这个 Key 重新塞回 `dirty` map

##### `entry.storeLocked`

当外层已经加了锁，或者已经确保了状态安全后，直接写入

```go
func (e *entry) storeLocked(i *any) {
    atomic.StorePointer(&e.p, unsafe.Pointer(i))
}

```

它不管当前是 `nil` 还是正常值，直接覆盖。通常紧跟在 `unexpungeLocked` 之后，或者直接用于更新 `dirty` 中的值。

##### `sync.map.dirtyLocked`

当 `dirty`是 `nil`（刚晋升）而又有新 Key 要写入时触发。它负责重建 dirty map

```go
func (m *Map) dirtyLocked() {
    if m.dirty != nil {
        return
    }
    // 1. 既然要写入新 key，dirty 就不能是 nil 了
    read, _ := m.read.Load().(readOnly)
    m.dirty = make(map[any]*entry, len(read.m))

    // 2. 遍历 read，把活着的数据拷过去
    for k, e := range read.m {
        // tryExpungeLocked 是这里的核心判断逻辑
        if !e.tryExpungeLocked() {
            // 只有不是 expunged 的，才拷贝到 dirty
            m.dirty[k] = e
        }
    }
}

func (e *entry) tryExpungeLocked() (isExpunged bool) {
    p := atomic.LoadPointer(&e.p)
    for p == nil {
        // 如果当前是 nil (软删除)，趁着这次重建 dirty，
        // 把它标记为 expunged (硬删除)。
        // 意味着：这个 key 不会拷贝到 dirty 里去了！
        if atomic.CompareAndSwapPointer(&e.p, nil, expunged) {
            return true
        }
        p = atomic.LoadPointer(&e.p)
    }
    // 如果本来就是 expunged，返回 true
    return p == expunged
}
```

这个过程把 `read` 中所有标记为 `nil` 的 Key，升级为 `expunged`，并且**不拷贝**到新的 `dirty` 中，这样，`dirty` 就只包含有效数据，防止了 map 的无限膨胀

#### 3. Delete-延迟删除

<!-- 这是一张图片，ocr 内容为： -->

![](/go/syncmap/3.png)

```go
// Delete 删除键值对。
func (m *Map) Delete(key any) {
    m.LoadAndDelete(key)
}

// LoadAndDelete 删除键值对，并返回删除前的值。
func (m *Map) LoadAndDelete(key any) (value any, loaded bool) {
    // 1. Fast Path: 尝试从 read 中获取
    read, _ := m.read.Load().(readOnly)
    e, ok := read.m[key]

    // 如果 read 里没找到，且 dirty 里可能有新数据
    if !ok && read.amended {
        m.mu.Lock() // 加锁

        // 2. Double Check
        read, _ = m.read.Load().(readOnly)
        e, ok = read.m[key]

        if !ok && read.amended {
            // Case A: Key 确实只在 dirty 中
            e, ok = m.dirty[key]

            // 直接从 dirty map 中物理删除
            // 因为 dirty map 是受锁保护的，直接操作 map 结构是安全的
            // 此时该 Key 从 dirty 中彻底消失。
            delete(m.dirty, key)

            // 这一步虽然是删除，但也算作一次对 dirty 的穿透访问
            // 所以也要增加 miss 计数，可能触发 dirty -> read 的晋升
            m.missLocked()
        }
        m.mu.Unlock()
    }

    // 3. 执行逻辑删除
    if ok {
        // Case B: Key 在 read 中 (或者刚才从 dirty 拿到了 entry)
        // 调用 entry 的原子删除方法
        return e.delete()
    }

    return nil, false
}

```

1. 如果 Key 在 `read` 中，直接调用 `entry.delete` 置为 `nil`
2. 如果 Key 不在 `read` 且 `amended` 为 true，加锁，在 `dirty` 中找到 Key，直接调用原生的 `delete` 从 dirty 中**物理删除**该 Key，调用 `missLocked`
3. 无论是在 `read` 还是 `dirty` 中找到的 `entry`，最终都通过 CAS 将其指针置为 `nil`

##### `entry.delete`

`Load` 和 `Delete` 共用的底层逻辑，负责将指针原子地改为 `nil`

```go
func (e *entry) delete() (value any, ok bool) {
    for {
        // 原子读取当前的指针
        p := atomic.LoadPointer(&e.p)

        // 1. 如果已经是 nil 或者已经是 expunged
        // 直接返回 false，表示无需重复删除
        if p == nil || p == expunged {
            return nil, false
        }

        // CAS 操作：尝试将 p 修改为 nil
        // 注意：这里只是置为 nil，并没有释放 entry 结构体的内存
        if atomic.CompareAndSwapPointer(&e.p, p, nil) {
            return *(*any)(p), true
        }
    }
}

```

**Read 中的删除是“逻辑删除”，Dirty 中的删除是“物理删除”**

如果 Key 存在于 `read` map 中，我们不能直接从 map 里删掉它

- `read.m` 是并发读安全的，如果并发修改（增删 Key），会导致 panic 或数据竞争。
- 我们只能修改 `read.m[key]` 指向的 `entry` 内部的状态。将 `entry.p` 置为 `nil`

如果 Key 只在 `dirty` 中，我们持有锁。

- 直接 `delete(m.dirty, key)`，Key 从`dirty map`的哈希槽中移除。下次 `dirty` 晋升为 `read` 时，这个 Key 也就彻底不存在了。

**对内存的影响**

- 只有当 `dirty` 发生晋升，或者`read`数据被拷贝到新`dirty`时，这些无用的`entry` 才会被 GC 回收。

#### 4. Range

Range 的核心策略是：快照

在遍历之前，先判断现在的 read map 里是否包含了所有数据？如果是则直接遍历 read，如果 dirty 里有新数据，会把 dirty 里的所有数据提升为 read，然后再遍历

<!-- 这是一张图片，ocr 内容为： -->

![](/go/syncmap/4.png)

```go
func (m *Map) Range(f func(key, value any) bool) {
    // 1. 获取当前的 read map
    read, _ := m.read.Load().(readOnly)

    // 2. 检查数据完整性
    // 如果 read.amended 为 true，说明 dirty 里有 read 没有的新数据。
    // 为了保证遍历到所有数据，必须把 dirty 合并进来。
    if read.amended {
        m.mu.Lock() // 加锁

        // Double Check
        read, _ = m.read.Load().(readOnly)

        if read.amended {
            // 【关键操作：强制晋升】
            // 直接把 dirty map 提升为 read map。
            // 这样 read 就拥有了全量数据（因为 dirty 总是包含全量的）。
            read = readOnly{m: m.dirty}

            // 原子替换 read
            m.read.Store(read)

            // 重置 dirty 和 misses
            // 注意：此时 dirty 变成了 nil，misses 归零。
            m.dirty = nil
            m.misses = 0
        }
        m.mu.Unlock()
    }

    // 3. 遍历 read map (此时 read 一定包含全量数据)
    for k, e := range read.m {
        // 取出 entry 中的值
        v, ok := e.load()

        // 如果 ok 为 false，说明 entry.p 是 nil 或 expunged
        // 即该 key 已被删除，遍历时跳过。
        if !ok {
            continue
        }

        // 调用用户的回调函数 f
        // 如果用户返回 false，终止遍历
        if !f(k, v) {
            break
        }
    }
}
```

**为什么要做“强制晋升”？**

普通的 Load 操作只有在 misses 穿透次数够多时才晋升，但是用户调用 Range 需要查找完整的 map，在遍历过程中频繁切换 read 和 dirty 逻辑复杂，性能很差。所以选择直接加一把锁，把 dirty 变成 read。这样后续的遍历过程（最耗时的部分）就是无锁的了

**遍历时的并发安全性**

`Range` 在拿到 `read` 变量后，执行 `for k, e := range read.m` 进行遍历。在此过程中，即使有其他协程并发操作，也能保证安全

假如在遍历过程中，如果有其他协程调用 Store 修改了值，由于我们持有的是 entry 的指针，Store 原子修改的是 entry.p 指向的值，所以 Range 能读到最新的值

假如有其他协程 Delete 了 key ，Delete 只是把 entry.p 设为 nil，Range 里的 e.load() 会检查 nil，如果发现是 nil 就 continue 跳过

注意：Range 可能会清空 dirty，如果在 Range 之后紧接着有大量的新 Key 写入，会发生严重的性能抖动，因为 dirty 为 nil，新 Key 写入会触发 dirtyLocked（从 read 全量拷贝数据重建 dirty）。所以 sync.Map 并不适合需要频繁 Range 且同时频繁插入新 Key 的场景
