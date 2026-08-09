---
title: Sync.Mutex 单机锁
date: 2026-04-14
order: 4
draft: true
---

## Sync.Mutex

### 核心机制

```c
type MyConcurrentMap struct {
    sync.Mutex
    mp map[int]int
}

func MakeMyConcurrentMap() *MyConcurrentMap {
	return &MyConcurrentMap{
		mp: make(map[int]int),
	}
}

func (m *MyConcurrentMap) Get(key int) (int, bool) {
	m.Mutex.Lock()
	v, ok := m.mp[key]
	m.Mutex.Unlock()
	return v,ok
}

func (m *MyConcurrentMap) Put(key, val int) {
	m.Mutex.Lock()
	m.mp[key] = val
	m.Mutex.Unlock()
}

func (m *MyConcurrentMap) Delete(key int) {
	m.Mutex.Lock()
	delete(m.mp, key)
	m.Mutex.Unlock()
}
```

Mutex内部的状态值表示锁的状态

上锁：0->1

解锁：1->0

上锁时在上锁，会失败

### 锁升级

对于goroutine加锁时发现锁已经被抢占的情形

- 阻塞/唤醒：将当前goroutine阻塞挂起，直到锁被释放，以回调的方式将阻塞的goroutine重新唤醒
- 自旋 + CAS：轮询，重复校验锁的状态尝试获取锁

<!-- 这是一张图片，ocr 内容为： -->

![](/go/Golang单机锁/image.png)

sync.Mutex结合两种方案制定了锁升级的过程：

- 首先保持乐观，采用自旋+CAS策略争夺锁，尝试失败之后，转为阻塞/挂起模式
- 转换条件：自选失败累计达到4次、CPU单核或仅有单个P调度器、当前P的执行队列中仍有待执行的G

### 饥饿模式

阻塞队列如果存在 goroutine 等待锁时间超过1ms 就会转化成饥饿模式，将抢锁流程由非公平机制转换为公平机制，锁的所有权按照阻塞队列的顺序进行依次传递，新goroutine不得抢锁，而是进入队列尾部

当队列清空，或者取得锁的 goroutine 等待锁的时间低于1ms，就会由饥饿模式转化为正常模式，当gotoutine从阻塞队列中唤醒时，会和此时进入抢锁流程的goroutine进行争夺锁资源，如果失败则重新回到阻塞队列头部

### goroutine唤醒标识

sync.Mutex通过一个标识位，标志当前是否有goroutine在自旋锁或存在goroutine从阻塞队列中被唤醒。如果标识位为true，则不用额外唤醒阻塞的goroutine从而引起竞争内耗

## 数据结构

```go
type Mutex struct {
    state int32
    sema  uint32 	// 用于阻塞和唤醒goroutine的信号量
}

const (
    mutexLocked = 1 << iota 	// 是否上锁
    mutexWoken					// 是否有 goroutine 从阻塞队列中被唤醒
    mutexStarving				// 是否处于饥饿模式
    mutexWaiterShift = iota 	// 右侧存在上述3个bit位标识特殊信息

    starvationThresholdNs = 1e6 // 进入饥饿模式的等待时间阈值
)
```

#### state字段

<!-- 这是一张图片，ocr 内容为： -->

![](/go/Golang单机锁/state.png)

低 3 位分别标识 mutexLocked（是否上锁）、mutexWoken（是否有协程在抢锁）、mutexStarving（是否处于饥饿模式），高 29 位的值聚合为一个范围为 0~2^29-1 的整数，表示在阻塞队列中等待的协程个数

#### Lock方法

```go
func (m *Mutex) Lock() {
    // 假如当前未上锁且锁内不存在阻塞协程，则直接 CAS 抢锁成功返回；
    if atomic.CompareAndSwapInt32(&m.state, 0, mutexLocked) {
        return
    }
    // 失败则进入lockSlow
    m.lockSlow()
}
```

<!-- 这是一张图片，ocr 内容为： -->

![](/go/Golang单机锁/path.png)

#### Mutex.lockSlow方法

```go
func (m *Mutex) lockSlow() {
    var waitStartTime int64 // 标识当前 goroutine 在抢锁过程中的等待时长，单位：ns；
    starving := false       // 标识当前是否处于饥饿模式；
    awoke := false			// 标识当前是否已有协程在等锁；
    iter := 0				// 标识当前 goroutine 参与自旋的次数；
    old := m.state			// 临时存储锁的 state 值.
    // ...
    // 自旋空转
    for {
        // 进入该 if 分支，说明抢锁失败，处于饥饿模式，但仍满足自旋条件
        if old&(mutexLocked|mutexStarving) == mutexLocked && runtime_canSpin(iter) {
            // 进入该 if 分支，说明当前锁阻塞队列有协程，但还未被唤醒，因此需要将
            // mutexWoken 标识置为 1，避免再有其他协程被唤醒和自己抢锁
            if !awoke && old&mutexWoken == 0 && old>>mutexWaiterShift != 0 &&
                atomic.CompareAndSwapInt32(&m.state, old, old|mutexWoken) {
                awoke = true
            }
            // 告知调度器 P 当前处于自旋模式；
            runtime_doSpin()
            // 更新自旋次数 iter 和锁状态值 old；
            iter++
            old = m.state
            continue
        }
        // ...
    }
}
```

<!-- 这是一张图片，ocr 内容为： -->

![](/go/Golang单机锁/logic.png)

#### state新值构造

```go
func (m *Mutex) lockSlow() {
    // ...
    for {
        // 自旋抢锁失败后处理 ...
        // new old 状态值更新
        new := old
        // 倘若当前是非饥饿模式，则在新值 new 中置为已加锁，即尝试抢锁；
        if old&mutexStarving == 0 {
            new |= mutexLocked
        }
        // 倘若旧值为已加锁或者处于饥饿模式
        // 则当前 goroutine 在这一轮注定无法抢锁成功，可以直接令新值的阻塞协程数加1；
        if old&(mutexLocked|mutexStarving) != 0 {
            new += 1 << mutexWaiterShift
        }
        // 倘若当前进入饥饿模式且旧值已加锁，则将新值置为饥饿模式；
        if starving && old&mutexLocked != 0 {
            new |= mutexStarving
        }
        // 倘若局部变量标识是已有唤醒协程抢锁，说明mutexWoken是被当前gouroutine置为1的
        // 但由于当前 goroutine 接下来要么抢锁成功，要么被阻塞挂起
        // 因此需要在新值中将该 mutexWoken 标识更新置 0.
        if awoke {
            new &^= mutexWoken
        }

        // 通过 CAS 操作，用构造的新值替换旧值；
        if atomic.CompareAndSwapInt32(&m.state, old, new) {
            // 倘若 CAS 替换成功，则进入最后一轮的二择一局面
            // case1 加锁成功，返回
            // case2 加锁失败，将当前协程挂起

            // ...
        }else {
            // 倘若失败（即旧值被其他协程介入提前修改导致不符合预期）
            // 则将旧值更新为此刻的 Mutex.State，并开启一轮新的循环；
            old = m.state
        }
        // ...
    }
}
```

#### 上锁成功分支

```go
func (m *Mutex) lockSlow() {
    // ...
    for {
        // 自旋抢锁失败后处理 ...

        // new old 状态值更新 ...
        // 此时已经成功将 Mutex.state 由旧值替换为新值

        // 接下来进行判断，倘若旧值是未加锁状态且为正常模式
        // 则意味着加锁标识位正是由当前 goroutine 完成的更新，说明加锁成功，返回即可
        // 倘若旧值中锁未释放或者处于饥饿模式，则当前 goroutine 需要进入阻塞队列挂起.
        if atomic.CompareAndSwapInt32(&m.state, old, new) {
            if old&(mutexLocked|mutexStarving) == 0 {
                break
            }

            // ...
        }
        // ...
    }
}
```

#### 阻塞挂起

```go
func (m *Mutex) lockSlow() {
    // ...
    for {
        // 自旋抢锁失败后处理 ...

        // new old 状态值更新 ...

        if atomic.CompareAndSwapInt32(&m.state, old, new) {
            // 加锁成功后返回的逻辑分支 ...

            // 标识当前 goroutine
            queueLifo := waitStartTime != 0
            if waitStartTime == 0 {
                // 等待时间为零则是新进 goroutine，将等待的起始时间置为当前时刻的 ns 时间戳
                waitStartTime = runtime_nanotime()
            }
            // 将当前协程添加到阻塞队列中，倘若是旧 goroutine 则挂入队头；倘若是新 goroutine，则挂入队尾
            // 挂起当前协程
            runtime_SemacquireMutex(&m.sema, queueLifo, 1)
            // ...
        }
        // ...
    }
}
```

#### 从阻塞态被唤醒

```go
func (m *Mutex) lockSlow() {
    // ...
    for {
        // 自旋抢锁失败后处理...

        // new old 状态值更新 ...

        if atomic.CompareAndSwapInt32(&m.state, old, new) {
            // 加锁成功后返回的逻辑分支 ...

            // 挂起前处理 ...
            runtime_SemacquireMutex(&m.sema, queueLifo, 1)
            // 若当前 goroutine 阻塞等待时间超过阈值(1ms)，标记为 starving
            // 该标志将用于后续决定是否维持/退出饥饿模式，并在下一轮循环中更新 state
            starving = starving || runtime_nanotime()-waitStartTime > starvationThresholdNs
            old = m.state
            // 模式处于饥饿状态，当前唤醒的协程需优先获取锁（公平调度）
            if old&mutexStarving != 0 {
                // 计算状态变更的差值 (delta)，通过一次原子操作批量更新
                delta := int32(mutexLocked - 1<<mutexWaiterShift)
                // 满足任一即清除饥饿标志
                if !starving || old>>mutexWaiterShift == 1 {
                    delta -= mutexStarving
                }
                // 原子更新锁状态：应用 delta 差值，完成状态迁移
                atomic.AddInt32(&m.state, delta)
                break
            }
            // 非饥饿模式：重置辅助变量，准备下一轮尝试
            awoke = true
            iter = 0
        }
        // ...
    }
}
```

### Unlock方法

```go
func (m *Mutex) Unlock() {
    // 通过原子操作解锁
    new := atomic.AddInt32(&m.state, -mutexLocked) // 如果仅有自己竞争，return
    if new != 0 {
        m.unlockSlow(new)
    }
}
```

#### unlockSlow方法

```go
func (m *Mutex) unlockSlow(new int32) {
    // 为加锁的异常情况
    if (new+mutexLocked)&mutexLocked == 0 {
        fatal("sync: unlock of unlocked mutex")
    }

    // 正常情况
    if new&mutexStarving == 0 {
        old := new
        for {
            if old>>mutexWaiterShift == 0 || old&(mutexLocked|mutexWoken|mutexStarving) != 0 {
                return
            }
            // 只要有一种情况出现，就说明有其他协程介入
            new = (old - 1<<mutexWaiterShift) | mutexWoken
            // 通过CAS操作将state阻塞协程-1，如果成功就唤醒队列头部的goroutine，return
            if atomic.CompareAndSwapInt32(&m.state, old, new) {
                runtime_Semrelease(&m.sema, false, 1)
                return
            }
            // 否则更新为新的old值
            old = m.state
        }
    }
    // ...
    // 饥饿模式，直接唤醒队列头部的goroutine
    if new&mutexStarving == 0 {
        // ...
    } else {
        runtime_Semrelease(&m.sema, true, 1)
    }
}
```

## Sync.RWMutex

可以把 RWMutex 理解为一把读锁加一把写锁，适用于读多写少的场景，最理想化的情况，当所有操作均使用读锁，则可实现去无化；最悲观的情况，倘若所有操作均使用写锁，则 RWMutex 退化为普通的 Mutex

- 写锁具有严格的排他性，当其被占用，其他试图取写锁或者读锁的 goroutine 均阻塞
- 读锁具有有限的共享性，当其被占用，试图取写锁的 goroutine 会阻塞，试图取读锁的 goroutine 可与当前 goroutine 共享读锁

### 数据结构

```go
const rwmutexMaxReaders = 1 << 30 // 共享读锁的 goroutine 数量上限，值为 2^29；

type RWMutex struct {
    w           Mutex  // 内置的一把普通互斥锁 sync.Mutex；
    writerSem   uint32 // 关联写锁阻塞队列的信号量；
    readerSem   uint32 // 关联读锁阻塞队列的信号量；
    readerCount int32  // 正常情况下等于介入读锁流程的goroutine数量；当goroutine接入写锁流程时
                       // 该值为实际介入读锁流程的 goroutine数量减rwmutexMaxReaders.
    readerWait  int32  // 记录在当前goroutine获取写锁前，还需要等待多少个goroutine释放读锁.
}
```

### 流程

```go
// 读锁
func (rw *RWMutex) RLock() {
    if atomic.AddInt32(&rw.readerCount, 1) < 0 {
        runtime_SemacquireMutex(&rw.readerSem, false, 0)
    }
}

func (rw *RWMutex) RUnlock() {
    if r := atomic.AddInt32(&rw.readerCount, -1); r < 0 {
        rw.rUnlockSlow(r)
    }
}

func (rw *RWMutex) rUnlockSlow(r int32) {
    if r+1 == 0 || r+1 == -rwmutexMaxReaders {
        fatal("sync: RUnlock of unlocked RWMutex")
    }
    if atomic.AddInt32(&rw.readerWait, -1) == 0 {
        runtime_Semrelease(&rw.writerSem, false, 1)
    }
}

// 写锁
func (rw *RWMutex) rUnlockSlow(r int32) {
    if r+1 == 0 || r+1 == -rwmutexMaxReaders {
        fatal("sync: RUnlock of unlocked RWMutex")
    }
    if atomic.AddInt32(&rw.readerWait, -1) == 0 {
        runtime_Semrelease(&rw.writerSem, false, 1)
    }
}

func (rw *RWMutex) Unlock() {
    r := atomic.AddInt32(&rw.readerCount, rwmutexMaxReaders)
    if r >= rwmutexMaxReaders {
        fatal("sync: Unlock of unlocked RWMutex")
    }
    for i := 0; i < int(r); i++ {
        runtime_Semrelease(&rw.readerSem, false, 0)
    }
    rw.w.Unlock()
}
```
