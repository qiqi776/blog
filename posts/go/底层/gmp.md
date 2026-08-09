---
title: GMP 内存模型
date: 2026-01-10
order: 1
---

### 协程和 Goroutine

**协程是用户态线程**

1. 与线程存在映射关系，m:1
2. 创建、销毁、调度在用户态完成，对内核透明，更加轻量
3. 同一个内核级线程中无法并行，一个协程阻塞会导致从属同一个线程的协程无法执行

**Goroutine 的改进**

经过了 Golang 的优化，通过增加中间层 P，实现与单一线程解耦

1. 与线程存在映射关系，为 M:N
2. 创建、销毁、调度在用户态完成，对内核透明，更加轻量
3. 可利用多个线程实现并行
4. 通过调度器实现和线程间的动态绑定和灵活调度
5. 栈空间大小可动态扩缩

| **特性维度**       | **操作系统线程**                                         | **传统协程**                                                      | **Go 协程**                                                                              |
| :----------------- | :------------------------------------------------------- | :---------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| **调度机制**       | **抢占式**。由 OS 决定何时切换，完全不可控               | **协作式**。必须由协程主动让出(yield)。一旦死循环或阻塞，线程卡死 | **混合式**。主要为协作式(基于函数调用)，辅以基于信号的抢占式(防止死循环饿死别的 G)       |
| **上下文切换成本** | 需陷入内核态，保存所有寄存器、刷新 CPU 缓存 耗时约几微秒 | 仅在用户态保存必要的 CPU 寄存器。耗时约几十纳秒                   | 仅保存 PC, SP, DX 等少量寄存器。耗时约几纳秒到几十纳秒                                   |
| **内存栈大小**     | 通常默认 1MB - 8MB。创建成千上万个线程内存直接爆炸       | 固定或按需，通常比线程小，但不如 Go 灵活                          | 初始仅 2KB。根据需要动态伸缩 ，最大可达 1GB                                              |
| **应对阻塞 (I/O)** | 线程阻塞，OS 切走执行其他线程。但线程资源被占用          | 一个协程发起阻塞系统调用，整个宿主线程被阻塞，其他协程全卡住      | G 阻塞时，M 会与 P 分离，P 寻找新的 M 继续执行其他 G。网络 I/O 则交给 Netpoller 异步处理 |

### GMP 模型

gmp = goroutine + machine + processor

![](/go/gmp/1.png)

G 是 goroutine，有自己的运行栈、状态以及执行的任务函数，需要绑定到 p 才能执行，在 g 的视角中，p 就是 cpu

P 是 processor，golang 中的调度器，实现 g 和 m 的动态有机结合，对 g 而言，p 是其 cpu，g 只有被 p 调度才能执行，对 m 而言，p 是其执行代理，为其提供必要的信息的同时，隐藏了复杂的调度细节，p 的数量决定了 g 最大并行数量，可有用户通过 GOMAXPROCS 设定

M 是 machine，golang 中的线程，和 p 绑定，由 p 实现代理，借助 p，m 无需和 g 绑死，也无需记录 g 的状态信息，因此 g 在全生命周期中可以实现跨 m 执行

全局有多个 M 和多个 P，但同时并行的 G 的最大数量等于 P 的数量；

G 的存放队列有三类：P 的本地队列；全局队列；和 wait 队列。M 调度 G 时，优先取 P 本地队列，其次取全局队列，最后取 wait 队列；这样的好处是，取本地队列时，可以接近于无锁化，减少全局锁竞争。为防止不同 P 的闲忙差异过大，设立 work-straling 机制，本地队列为空的 P 可以尝试从其他 P 本地队列偷取一半的 G 补充到自身队列

### 核心数据结构

#### g

```go
type g struct {
    // ...
    m       *m
    // ...
    sched    gobuf
    // ...
}

type gobuf struct {
    sp       uintptr // 保存rsp寄存器，指向函数调用栈栈顶
    pc       uintptr // 保存rip寄存器的值，指向程序下一执行指令的地址
    ret      uintptr // 保存系统调用的返回值
    bp       uintptr // 保存rbp寄存器的值，存储函数栈帧的起始位置
}
```

**g 的生命周期**

```go
const (
    _Gidle = iota // 0 协程创建时的状态，此时尚未完成初始化
    _Grunnable    // 1 协程在等待执行队列中
    _Grunning     // 2 正在执行，同一时刻一个p只有一个g处于此状态
    _Gsyscall     // 3 正在执行系统调用
    _Gwaiting     // 4 处于挂起状态，需要等待被唤醒 gc、channel或者锁操作时会进入
    _Gdead        // 6 刚初始化完成或者已经被销毁
    _Gcopystack   // 8 正在栈扩容中
    _Gpreempted   // 9 被抢占后的状态
)

```

#### m

```go
type m struct {
    g0      *g // 特殊调度协程，仅负责执行g之间的切换调度，与m 1:1
    // ...
    tls      [tlsSlots]uintptr // 线程本地存储
    // ...
}

```

#### P

```go
type p struct {
    // ...
    runqhead uint32        // 队列头部
    runqtail uint32        // 队列尾部
    runq     [256]guintptr // 本地goroutine队列，最大长度为256
    runnext  guintptr      // 下一个可执行的goroutine
    // ...
}

```

#### schedt

```go
type schedt struct {
    // ...
    lock mutex      // 全局队列的锁
    // ...
    runq     gQueue // 全局goroutine队列
    runqsize int32  // 队列容量
    // ...
}

```

### 调度切换

goroutine 主要分为两种

- 负责调度普通 g 的 g0，执行固定的调度流程，与 m 关系一对一
- 负责执行用户函数的普通 g

m 通过 p 调度执行的 goroutine 永远在 g 和 g0 之间切换，当 g0 找到可执行的 g 时，调用 gogo 方法，调度 g 执行用户定义的任务；当 g 需要主动让渡或被动调度时，会触发 mcall 方法，将执行权重新交还给 g0

#### 调度类型

通常调度指由 g0 按照特定策略找到下一个可执行 g 的过程，这里指调度器 p 实现从执行一个 g 切换到另一个 g 的过程

1. **主动调度**：用户调用 runtime.Gosched()，主动让出当前 g 的执行权，当前的 g 会由 running 状态切换到 runnable 状态，并且投递到全局队列当中，于是当前这个 g 对应的 m 的 g0 在感知到这一事件之后，会重新获得一个执行权，尝试寻找另一个可以被执行的处于 runnable 状态的 g
2. **被动调度**：通道、互斥锁等操作，需要被唤醒。gopark()函数会将当前执行的 g 由一个 running 状态切换到 waiting 状态。goready()函数会将 g 从一个 waiting 的状态切换到 runnable 的状态，使其重新获得一个被 p 执行的权利
3. **正常调度**：g 执行完成后，调用 goexit0 清理 g 的状态，然后再次调用 schedule()开启下一轮循环
4. **抢占调度**：由一个全局异步的监控者协程 sysmon 发起（因为在发起系统调用的时候，g 和 m 处于强绑定的状态，需要交由 m 进入内核态发起系统调用，而 m 本身也会因为发起系统调用而陷入僵持态，对应的 g0 也没有办法执行，所以需要一个第三者帮助调度），当某一个 g 发起系统调用，到达一定时长之后，会被 sysmon 所感知，强行将 g 和 p 解绑，重新让 p 寻找新的可执行 g。另外 g 如果是单纯的计算任务，超时也会被感知到，这种情况下其会向 m 发送信号，m 收到信号之后软中断当前 g 的执行，强制 g 让出 cpu，放回全局队列

#### 宏观调度流程

g0 -> g -> g0 的具体流程：

- g0 执行 schedule() 函数，寻找到用于执行的 g；
- g0 执行 execute() 方法，更新当前 g、p 的状态信息，并调用 gogo() 方法，将执行权交给 g；
- g 因主动让渡( gosche_m() )、被动调度( park_m() )、正常结束( goexit0() )等原因，调用 m_call 函数，执行权重新回到 g0 手中；
- g0 执行 schedule() 函数，开启新一轮循环.

#### **schedule**

调度流程的主干方法，此时的执行权位于 g0 手中：

```go
func schedule() {
    // ...
    gp, inheritTime, tryWakeP := findRunnable() // 寻找到下一个执行的 goroutine；
    // ...
    execute(gp, inheritTime) // 执行该 goroutine
}

```

#### **findRunnable**

为 m 寻找到下一个执行的 g

```go
func findRunnable() (gp *g, inheritTime, tryWakeP bool) {
    _g_ := getg()

top:
    _p_ := _g_.m.p.ptr()
    // ...
    // 每经过 61 次调度，强制去检查一次全局队列
    // 防止本地队列一直有任务，导致全局队列里的 G 永远得不到执行
    if _p_.schedtick%61 == 0 && sched.runqsize > 0 {
        lock(&sched.lock)
        gp = globrunqget(_p_, 1) // 参数 1 表示只取 1 个 G
        unlock(&sched.lock)
        if gp != nil {
            return gp, false, false
        }
    }

    // ...
    // 优先从当前 P 的本地队列获取 G。
    // 通常不需要加重锁，且利用了 CPU 缓存局部性。
    if gp, inheritTime := runqget(_p_); gp != nil {
        return gp, inheritTime, false
    }

    // ...
    // 如果本地队列空了，就去全局队列拿。
    // 这里参数是 0，表示取一批 G 到本地，而不仅仅拿1个，减少后续频繁加锁。
    if sched.runqsize != 0 {
        lock(&sched.lock)
        gp := globrunqget(_p_, 0)
        unlock(&sched.lock)
        if gp != nil {
            return gp, false, false
        }
    }

    // 检查是否有网络 I/O 就绪的 G
    // netpoll(0) 是非阻塞的。没有不等待，立即往下走
    if netpollinited() && atomic.Load(&netpollWaiters) > 0 && atomic.Load64(&sched.lastpoll) != 0 {
        if list := netpoll(0); !list.empty() { // non-blocking
            gp := list.pop()
            injectglist(&list) // 如果唤醒了多个，把剩下的放回全局队列
            casgstatus(gp, _Gwaiting, _Grunnable) // 修改状态：Waiting -> Runnable
            return gp, false, false
        }
    }


    // ...
    // 如果本地、全局、网络都没活，就去窃取其他 P 的任务。
    procs := uint32(gomaxprocs)

    // 判断是否进入自旋
    // 如果当前 M 已经在自旋，或者自旋的 M 数量还不够多（为了保持 CPU 利用率）
    // 就让当前 M 保持活跃去窃取任务，而不是休眠
    if _g_.m.spinning || 2*atomic.Load(&sched.nmspinning) < procs-atomic.Load(&sched.npidle) {
        if !_g_.m.spinning {
            _g_.m.spinning = true
            atomic.Xadd(&sched.nmspinning, 1)
        }

        // stealWork 会随机遍历其他 P，尝试窃取其本地队列的一半任务
        gp, inheritTime, tnow, w, newWork := stealWork(now)
        now = tnow
        if gp != nil {
            // 窃取到了
            return gp, inheritTime, false
        }
        if newWork {
            // stealWork 发现可能有新的 Timer 或 GC 任务，
            // 所以跳回 top 重新跑一遍流程，以免遗漏。
            goto top
        }
        if w != 0 && (pollUntil == 0 || w < pollUntil) {
            // 记录最近的一个 Timer 唤醒时间，后续休眠时用到
            pollUntil = w
        }
    }
}

func globrunqget(_p_ *p, max int32) *g {
    // 1. 如果全局队列本来就是空的，直接返回
    if sched.runqsize == 0 {
        return nil
    }

    // 负载均衡，每次多拿点，避免频繁加锁。
    // 2. 计算公式：n = 全局总数 / P的总数 + 1
    n := sched.runqsize/gomaxprocs + 1

    // 3. 不能超过全局现有的总数
    if n > sched.runqsize {
        n = sched.runqsize
    }

    // 4. 处理 max 参数限制
    // 如果调用方指定了 max，则严格遵守
    if max > 0 && n > max {
        n = max
    }

    // 5. 本地队列容量通常是 256
    // 最多只能拿本地容量的一半 (len(_p_.runq)/2)，也就是最多一次搬运 128 个 G
    if n > int32(len(_p_.runq))/2 {
        n = int32(len(_p_.runq)) / 2
    }

    // 更新全局队列的计数器
    sched.runqsize -= n
    // 6. 从全局队列 Pop 出第 1 个 G
    // 这个 G 是要直接返回给 M 立即执行的
    gp := sched.runq.pop()
    n--

    // 7. 剩下的n-1个 G，搬运到 P 的本地队列
    for ; n > 0; n-- {
        gp1 := sched.runq.pop()
        // runqput 将 G 放入 P 的本地队列
        // false 表示不尝试唤醒其他 P (因为自己正在忙着拿任务)
        runqput(_p_, gp1, false)
    }

    // 返回第 1 个 G 给当前线程去跑
    return gp
}

```

将一个 g 由全局队列转移到 p 本地队列

```go
// _p_: 目标 P (通常是当前 P)
// gp: 要放入的 G
// next: 是否优先放入 runnext 槽位 (代码片段中未展示，通常在 retry 标签之前处理)
func runqput(_p_ *p, gp *g, next bool) {

retry:
    // 1. 原子读取队头 (Head)
    // 保证在读取 head 之前，所有的内存写入都已完成
    // 这里主要是为了和消费者同步，防止读到脏数据
    h := atomic.LoadAcq(&_p_.runqhead)

    // 2. 读取队尾 (Tail)
    // 只有当前 P 会修改 tail，所以对于当前 P 来说，直接读就行
    t := _p_.runqtail

    // 本地队列没满
    // 本地队列容量为 256，只要 (tail - head) < 256，说明还有空位。
    if t-h < uint32(len(_p_.runq)) {
        // 3. 放入环形队列
        _p_.runq[t%uint32(len(_p_.runq))].set(gp)

        // 4. 原子更新队尾
        // 保证 gp 被放入数组的操作，在 tail 更新之前对其他线程可见
        // 这样其他 P 来窃取任务时，只要看到 tail 变了，就一定能读到有效的 gp
        atomic.StoreRel(&_p_.runqtail, t+1)
        return
    }

    // 本地队列满了
    // 调用 runqputslow，将本地队列的一半 G + 当前 gp，一起扔到全局队列
    if runqputslow(_p_, gp, h, t) {
        return
    }

    // 如果 runqputslow 返回 false，说明在尝试处理满队列的过程中，
    // 队列突然不满了(可能是有其他 P 刚好来窃取走了一半任务)
    // 直接 goto retry 回去走 Fast Path
    goto retry
}

```

倘若发现本地队列 runq 已经满了，则会返回来将本地队列中一半的 g 放回全局队列中，帮助当前 p 缓解执行压力

```go
// _p_: 当前 P
// gp: 想要放入但放不下的那个 G
// h, t: 当前本地队列的头和尾指针
func runqputslow(_p_ *p, gp *g, h, t uint32) bool {
    // 1. 准备搬运容器
    var batch [len(_p_.runq)/2 + 1]*g

    // 2. 计算要搬运的数量n
    n := t - h
    n = n / 2  // n = 128

    // 3. 复制指针
    // 从队列头部 (h) 开始，把最老的 n 个 G 的指针复制到 batch 数组里
    for i := uint32(0); i < n; i++ {
        batch[i] = _p_.runq[(h+i)%uint32(len(_p_.runq))].ptr()
    }

    // 4. 原子提交
    // 尝试原子地将本地队列的 head 指针向后移动 n 位 (h + n)
    // 相当于在逻辑上把这 n 个 G 从本地队列里删了
    if !atomic.CasRel(&_p_.runqhead, h, h+n) { // cas-release, commits consume
        return false
    }

    // 5. 把那个导致溢出的 gp 放到 batch 的最后
    batch[n] = gp

    // 6. 数组转链表，遍历 batch，通过 schedlink 指针把它们串起来。
    for i := uint32(0); i < n; i++ {
        batch[i].schedlink.set(batch[i+1])
    }

    var q gQueue
    q.head.set(batch[0])
    q.tail.set(batch[n])

    // 7. 投递到全局队列
    lock(&sched.lock)
    globrunqputbatch(&q, int32(n+1))
    unlock(&sched.lock)

    return true
}

```

尝试从 p 本地队列中获取一个可执行的 goroutine

```go
if gp, inheritTime := runqget(_p_); gp != nil {
    return gp, inheritTime, false
}

// _p_: 当前 P
// 返回值 gp: 获取到的 G
// 返回值 inheritTime: 是否继承上一个 G 的剩余时间片 (Time Slice)
func runqget(_p_ *p) (gp *g, inheritTime bool) {

    // 检查 runnext
    // runnext 是一个特殊的指针，独立于runq数组之外。存放最新变成 Runnable 的 G
    // 为了利用 CPU 缓存局部性。刚产生的 G 很可能和当前逻辑相关，优先执行它。
    if next != 0 && _p_.runnext.cas(next, 0) { // CAS 将 runnext 置为 nil (拿走)
        // 意味着这个 G 会继承上一个 G 没用完的时间片，不会重新重置调度计数器。
        return next.ptr(), true
    }

    // 检查 runq 数组，没有就去环形数组里按 FIFO 顺序拿
    for {
        // 1. 原子读取队头
        h := atomic.LoadAcq(&_p_.runqhead)

        // 2. 读取队尾
        // 只有当前 P 会修改 tail (在 runqput 中)，所以读 tail 不需要原子操作
        t := _p_.runqtail

        // 3. 判空
        if t == h {
            return nil, false
        }

        // 4. 拿取 G 指针
        gp := _p_.runq[h%uint32(len(_p_.runq))].ptr()

        // 5. CAS 修改 Head
        // 尝试将 head 指针向后移一位 (h + 1)
        if atomic.CasRel(&_p_.runqhead, h, h+1) {
            // CAS 成功：说明我们成功抢到了这个 G，没有被别人偷走
            // inheritTime = false：普通排队的 G，执行时会重置时间片 (10ms)
            return gp, false
        }

        // 6. CAS 失败
        // 说明发生了竞争，循环重试，读取新的 head 再次尝试。
    }
}


```
