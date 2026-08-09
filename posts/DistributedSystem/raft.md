---
title: TinyKV Project2-PartA 详解
date: 2026-08-05
order: 3
---

## TinyKV 项目背景

TinyKV 是 PingCAP Talent Plan 中的分布式 KV 存储课程。项目受到 MIT 6.5840 的启发，在 TIKV 的基础上，保留了分布式存储系统的主要组成部分，用 Go 简化成了一个适合新手学习的课程项目。完成整个课程，需要从单机存储开始，逐步加入 Raft、多 Raft 调度和分布式事务。

| Project   | 内容                                                 |
| --------- | ---------------------------------------------------- |
| Project 1 | 实现单机版 KV，熟悉 Badger 和存储接口                |
| Project 2 | 实现 Raft，在它之上构建容错 KV，并加入日志 GC 和快照 |
| Project 3 | 实现成员变更、Leader 转移、Region 分裂和调度         |
| Project 4 | 实现基于 Percolator 的分布式事务和 MVCC              |

Project 2 又分成三部分。Part A 实现 Raft 算法，Part B 把 Raft 接入 KV 服务，Part C 处理快照和日志压缩。本文只讨论 Part A 中的领导者选举与日志复制，不展开上层 KV、快照和成员变更。

TinyKV 把 Raft 写成一个由消息驱动的状态机。Raft 模块本身不建立网络连接，也不直接写磁盘。上层周期性推进逻辑时钟，把收到的消息交给 Raft，再取走 Raft 产生的待发送消息和待持久化日志。这种边界让选举和复制逻辑可以完全在内存中测试。

## Raft 术语表

| 术语         | 英文或常用字段              | 含义                                                              |
| ------------ | --------------------------- | ----------------------------------------------------------------- |
| 跟随者       | Follower                    | 默认角色，被动接收 Leader 的日志和心跳，并负责给 Candidate 投票   |
| 候选人       | Candidate                   | 选举超时后发起竞选，向其他节点请求投票                            |
| 领导者       | Leader                      | 接收客户端提案，为日志确定顺序，并把日志复制给其他节点            |
| 任期         | Term                        | 单调递增的逻辑时钟，用来区分不同轮次的选举和过期消息              |
| 投票         | Vote                        | 节点在当前任期选择的 Candidate，每个任期最多投给一个节点          |
| 法定多数     | Quorum                      | `floor(N/2) + 1` 个节点，选举成功和日志提交都需要得到多数节点确认 |
| 选举超时     | Election Timeout            | Follower 等待 Leader 消息的期限，超时后会转为 Candidate 发起选举  |
| 心跳         | Heartbeat                   | Leader 周期性发送的消息，用来维持领导权并阻止 Follower 发起选举   |
| 日志条目     | Log Entry                   | Raft 复制的基本记录，由 `index`、`term` 和上层命令组成            |
| 日志匹配性质 | Log Matching Property       | 两个节点在同一 index 上的日志 term 相同，则该位置之前的日志也相同 |
| 日志追加     | AppendEntries / `MsgAppend` | Leader 检查 Follower 的日志前缀，并向它复制后续日志的请求         |
| 提交位置     | Commit Index / `committed`  | 已确认复制到多数节点、可以交给状态机应用的最高日志位置            |
| 复制进度     | `nextIndex` / `matchIndex`  | Leader 为每个 Follower 维护的下一发送位置和已确认复制位置         |

## Raft 如何组织集群状态

Raft 集群通常由奇数个节点组成。每个节点保存一份日志，并处于下面三种角色之一：

- **Leader** 接收客户端提案，并把日志复制给 Follower。
- **Follower** 被动接收 Leader 的心跳与日志，也负责给 Candidate 投票。
- **Candidate** 在选举期间向其他节点请求投票。

正常运行时，客户端的写请求由 Leader 排定顺序。Follower 不会各自决定日志位置，因此所有副本看到的是同一条由 Leader 向外扩散的日志序列。

### 任期是单调递增的逻辑时钟

Raft 把时间划分成连续的任期（term）。一次选举会开启一个新任期，一个任期可能选出一位 Leader，也可能因为选票分散而没有结果。节点本地保存当前任期，消息也携带发送方的任期。

收到消息时，节点先比较任期：

- 消息任期小于本地任期，说明消息已经过期，节点拒绝或忽略它。
- 消息任期大于本地任期，说明本地状态落后，节点更新任期并转为 Follower。
- 任期相同，节点再按自己的角色和消息类型继续处理。

任期把延迟消息、旧 Leader 和当前集群状态分开。一个失去多数派的 Leader 可能暂时不知道自己已经下台，但它一旦收到更高任期的消息，就会立即降级。

### 日志由 index 和 term 定位

每条 Raft 日志至少包含三部分：

| 字段      | 含义                                     |
| --------- | ---------------------------------------- |
| `index`   | 日志在整个序列中的位置，从前到后单调递增 |
| `term`    | 接收这条提案的 Leader 当时所处的任期     |
| `command` | 交给上层状态机执行的操作                 |

`index` 只能说明位置，`term` 还能说明这段日志属于哪一届 Leader。Raft 会频繁比较 `(index, term)`，用它判断候选人的日志是否足够新，也用它检查 Leader 与 Follower 的日志前缀是否一致。

### 多数派同时约束选举和提交

在包含 `N` 个节点的集群中，法定多数是 `floor(N/2) + 1`。Candidate 得到多数票才能成为 Leader，一条日志也要复制到多数节点后才能提交。

任意两个多数集合必然至少有一个共同节点。Raft 的安全性多次利用这个交集：同一任期的两位 Candidate 不可能都得到多数票；已经写入多数节点的日志，也会通过后续的投票限制影响新 Leader 的产生。

### 两种超时承担不同职责

Follower 和 Candidate 维护选举超时，Leader 维护心跳间隔。Follower 在选举超时内持续收到有效的 Leader 消息，就保持当前角色；超时后没有收到消息，便开始新一轮选举。Leader 周期性发送心跳，让其他节点知道自己仍在工作。

选举超时需要随机化。多个 Follower 如果总在同一时刻成为 Candidate，很容易互相瓜分选票，并在下一轮再次同时超时。每个节点从一个区间内选择超时时间，可以让其中一个节点更早开始拉票，提高单轮选出 Leader 的概率。

## 领导者选举

### 从超时到发起竞选

集群启动时，所有节点都是 Follower。如果一段时间没有收到 Leader 的有效消息，某个 Follower 会执行下面几步：

1. 把当前任期加一。
2. 转为 Candidate。
3. 把票投给自己。
4. 重置选举计时器。
5. 向其他节点发送 RequestVote 请求。

请求中除了 Candidate 的任期，还要带上最后一条日志的 `index` 和 `term`。投票不只是在候选人之间选一个存活节点，它还要阻止日志落后的节点成为 Leader。

### 投票需要同时满足两个条件

Follower 收到 RequestVote 后，会检查两件事。

第一，本任期是否还能投票。每个节点在一个任期内最多投一票，已经投给某个 Candidate 后，只能再次确认同一个 Candidate 的重试请求，不能改投另一个节点。

第二，Candidate 的日志是否至少和自己一样新。比较规则是：

1. 最后一条日志的 `term` 更大，Candidate 的日志更新。
2. 最后一条日志的 `term` 相同，再比较 `index`，`index` 更大的日志更新。

可以写成下面的判断：

```text
candidateLastTerm > localLastTerm
    || (candidateLastTerm == localLastTerm
        && candidateLastIndex >= localLastIndex)
```

先比较 `term`，是因为更长的日志不一定更新。旧 Leader 可能在失去多数派后继续接收提案，留下很多未提交日志；另一台节点的日志较短，但最后一条来自更新的任期。后者记录了集群更晚的进展。

### 为什么日志限制不会丢掉已提交记录

一条日志提交时，它已经存在于多数节点上。新 Candidate 也要得到多数票，两个多数集合必然相交。交集中的节点持有那条已提交日志，并且只会把票投给日志不比自己旧的 Candidate。再结合日志匹配性质做归纳，后续任期产生的新日志只能接在已经保留下来的已提交前缀之后，因此最终当选的节点也会包含这条记录。

这里保证的是已提交日志不会因为选举而丢失。某个 Candidate 可能缺少少量未提交日志并仍然当选，这些未提交日志之后可以被新 Leader 覆盖，因为集群从未对外确认它们已经生效。

### 计票与成为 Leader

Candidate 会记录每个投票响应。赞成票达到多数，它就转为 Leader；反对票达到多数，这一轮已经不可能获胜，可以退回 Follower 等待下一轮。两边都没有达到多数时，Candidate 继续等待响应或下一次选举超时。

平票不需要额外的仲裁规则。没有 Candidate 得到多数时，本轮选举自然失败。各节点重新选择随机超时，下一轮通常会由更早超时的节点率先完成拉票。

成为 Leader 后，节点会立即开始维持领导权，并初始化每个 Follower 的复制进度。常见实现还会追加一条当前任期的空日志。提交这条空日志后，它之前的旧任期日志也会随前缀一起提交，这一点会在日志提交规则中继续说明。

### 心跳维持领导权

Leader 定期向 Follower 发送心跳。Follower 收到当前任期的有效心跳后，重置选举计时器并记住 Leader。Candidate 如果收到同任期 Leader 的有效心跳或日志追加请求，也应转回 Follower。

心跳不是永久租约。Leader 无法仅凭自己还在发送心跳确认领导权，它仍然可能被网络隔离。Raft 依靠多数派提交保护安全性：旧 Leader 在少数分区里可以追加本地日志，却无法把这些日志提交。

### 网络分区中的选举

考虑一个五节点集群，节点 1 是任期 5 的 Leader，网络分裂为 `{1, 2}` 和 `{3, 4, 5}`。

节点 1 仍可能认为自己是 Leader，也能在本地追加客户端提案，但它只能联系节点 2，拿不到三个节点的确认。这些新日志无法提交，客户端也不能收到成功响应。

节点 3、4、5 收不到心跳后会发起选举。假设节点 3 在任期 6 得到三票，它可以继续为多数分区提供服务。网络恢复后，节点 1 收到任期 6 的消息，更新任期并转为 Follower。它在任期 5 写下的未提交日志随后会被新 Leader 的日志覆盖。

五节点集群允许两个节点故障，三节点集群允许一个节点故障。只要存活且互通的节点不足多数，集群就不能安全地选出 Leader 或确认新的写入。

## 日志复制

选出 Leader 后，所有改变状态机的操作都要先进入 Raft 日志。Leader 决定日志位置，Follower 检查自己的前缀是否与 Leader 一致，再接受后续条目。

### 从客户端提案到 AppendEntries

Leader 收到客户端提案后，为它分配下一个 `index`，把当前任期写入 `term`，然后先追加到自己的日志。此时日志还没有提交，只是 Leader 本地持有的一条新记录。

接着，Leader 为每个 Follower 发送 AppendEntries。消息包含：

| 字段           | 含义                       |
| -------------- | -------------------------- |
| `prevLogIndex` | 本批日志前一条记录的 index |
| `prevLogTerm`  | 本批日志前一条记录的 term  |
| `entries`      | 准备追加的日志，可以为空   |
| `leaderCommit` | Leader 已知的提交位置      |

`prevLogIndex` 和 `prevLogTerm` 是一致性检查的锚点。Follower 只有在这个位置存在相同任期的日志时，才接受后面的条目。

### 一个匹配点如何约束整段前缀

Raft 要维持日志匹配性质：如果两个节点在同一个 `index` 上的日志具有相同 `term`，那么它们在这个位置之前的日志也相同。

Leader 每次发送日志都要求 Follower 先匹配前一条记录。第一次复制从更早的日志建立匹配，后面的复制便可以归纳地延续这个性质。Follower 不需要每次比较全部历史，只需要验证 AppendEntries 携带的前一条日志坐标。

### Follower 如何处理冲突

Follower 处理 AppendEntries 时按下面的顺序执行：

1. 消息任期过期，拒绝请求。
2. 本地没有 `prevLogIndex`，拒绝请求。
3. 本地 `prevLogIndex` 的任期与 `prevLogTerm` 不同，拒绝请求。
4. 前缀匹配后，逐条比较新日志。遇到相同 `index` 但不同 `term` 的条目时，从冲突位置开始删除本地后缀。
5. 追加消息中尚未存在的条目。
6. 把本地提交位置推进到 `min(leaderCommit, lastNewIndex)`。
7. 返回复制成功及当前匹配位置。

不能在前缀匹配后直接删除 Follower 的整个后缀。AppendEntries 可能是一次重传，消息只携带一段已经存在的日志；无条件截断会误删这段消息之后的正确记录。只有发现同一 `index` 上的 `term` 冲突时，才需要覆盖本地后缀。

提交位置也只能前进。`min(leaderCommit, lastNewIndex)` 防止日志落后的 Follower 把提交位置推进到自己尚未拥有的记录。

### Leader 如何追踪每个 Follower

Leader 为每个节点维护两个复制位置：

- `matchIndex` 表示已确认该节点拥有的最高日志位置。
- `nextIndex` 表示下一次准备发给该节点的日志位置，通常等于 `matchIndex + 1`。

新 Leader 起初不知道每个 Follower 的真实进度，可以把 `nextIndex` 初始化为 Leader 最后一条日志之后的位置，把其他节点的 `matchIndex` 初始化为 0。AppendEntries 成功后，Leader 向前推进这两个位置；失败后，Leader 回退 `nextIndex` 并重试，直到找到双方共同的日志前缀。

基础实现可以每次回退一个或一段 index。更完整的实现会让 Follower 返回冲突任期和该任期的起始位置，使 Leader 一次跳过整段冲突日志。这项优化减少网络往返，但不改变协议的安全条件。

### 多数复制后仍要检查当前任期

Leader 收集各节点的 `matchIndex`，找出已被多数节点持有的最大日志位置。这个位置还不能无条件提交，Raft 规定 Leader 只能通过统计副本数直接提交当前任期的日志。

旧任期日志即使后来被当前 Leader 复制到多数节点，也可能在后续选举中输给最后日志任期更高的另一条分支。Raft 论文 Figure 8 给出了这种交错场景。直接提交旧任期日志，存在记录被未来 Leader 覆盖的风险。

当前任期的日志复制到多数后，持有它的节点会影响未来的多数选举，新的 Leader 无法缺少这条日志。Leader 可以提交这条当前任期日志，它之前的所有日志也随前缀一起提交。新 Leader 上任时追加空日志，正是为了尽快生成一条可以按这条规则提交的当前任期记录。

### 三节点复制过程

假设三节点集群的 Leader 是节点 1，当前任期为 3，三个节点都已经拥有 index 1 到 4，提交位置也是 4。

1. 客户端提交一个写请求，节点 1 追加 `{index: 5, term: 3}`。
2. 节点 1 向节点 2、3 发送 AppendEntries，前缀坐标是 `{index: 4, term: 2}`，新日志是 index 5。
3. 节点 2 匹配 index 4，追加 index 5，并返回成功。
4. 节点 1 更新节点 2 的 `matchIndex` 为 5。节点 1 和节点 2 已构成多数。
5. index 5 属于当前任期，节点 1 把提交位置推进到 5。
6. 节点 1 在后续 AppendEntries 中把新的提交位置告诉其他节点，它们再推进各自的提交位置。

Leader 确认多数复制后就能提交本地日志，Follower 需要在下一次收到 Leader 消息时才能知道新的提交位置。各节点获知提交的时间可以不同，但应用顺序始终由相同的日志 index 决定。

## TinyKV Project 2A 如何实现选举与复制

前面描述的是 Raft 协议，这一节回到 TinyKV 仓库 `raft/` 目录的当前实现。选举和复制主要分布在三个文件中：

```text
raft/
  raft.go   Raft 状态、角色转换、消息处理和复制进度
  log.go    RaftLog 的日志视图与提交、应用、持久化位置
  util.go   消息分类和通用辅助函数
```

消息结构定义在 `proto/proto/eraftpb.proto`。`raft.go` 中的 `Step` 是统一入口，本地时钟事件和网络消息最终都会进入这个函数。

### `Raft` 保存了协议需要的状态

下面是与本文两条链路直接相关的字段：

```go
type Progress struct {
    Match, Next uint64
}

type Raft struct {
    id   uint64
    Term uint64
    Vote uint64

    RaftLog *RaftLog
    Prs     map[uint64]*Progress
    State   StateType
    votes   map[uint64]bool
    msgs    []pb.Message
    Lead    uint64

    heartbeatTimeout     int
    electionTimeout      int
    randomElectionTimeout int
    heartbeatElapsed     int
    electionElapsed      int
}
```

`Prs` 由 Leader 用来记录各节点的 `Match` 和 `Next`。`votes` 只在 Candidate 计票时使用。`msgs` 保存状态机产生的待发送消息，Raft 代码不会自己执行网络发送。

TinyKV 把消息分成本地消息和网络消息。本地消息的 `Term` 为 0，用来驱动当前节点；网络消息带任期，在节点之间传递。

| 消息                                        | 作用                   |
| ------------------------------------------- | ---------------------- |
| `MsgHup`                                    | 本地选举超时，开始竞选 |
| `MsgBeat`                                   | 本地心跳超时，广播心跳 |
| `MsgPropose`                                | 本地提交一条提案       |
| `MsgRequestVote` / `MsgRequestVoteResponse` | 拉票与投票响应         |
| `MsgAppend` / `MsgAppendResponse`           | 追加日志与复制响应     |
| `MsgHeartbeat` / `MsgHeartbeatResponse`     | 心跳与心跳响应         |

### `Step` 先处理任期，再按角色分发

`Step` 开头统一处理消息任期。`Term == 0` 的本地消息跳过任期比较；更高任期会让当前节点转为 Follower；更低任期的投票、心跳和追加请求会收到拒绝响应。下面删去了拒绝响应的构造和各角色的具体分支，只保留分发骨架。

```go
func (r *Raft) Step(m pb.Message) error {
    switch {
    case m.Term == 0:
    case m.Term > r.Term:
        lead := None
        if m.MsgType == pb.MessageType_MsgAppend ||
            m.MsgType == pb.MessageType_MsgHeartbeat ||
            m.MsgType == pb.MessageType_MsgSnapshot {
            lead = m.From
        }
        r.becomeFollower(m.Term, lead)
    case m.Term < r.Term:
        // 根据消息类型发送拒绝响应
        return nil
    }

    switch r.State {
    case StateFollower:
        // Follower 消息处理
    case StateCandidate:
        // Candidate 消息处理
    case StateLeader:
        // Leader 消息处理
    }
    return nil
}
```

这段代码也是理解 TinyKV Raft 的主线。角色转换函数负责更新状态，`Step` 决定某个角色如何响应消息，辅助函数负责构造追加和心跳消息。

## TinyKV 中的领导者选举

TinyKV 的选举路径可以概括为：

```text
tick -> MsgHup -> becomeCandidate
     -> MsgRequestVote -> MsgRequestVoteResponse
     -> becomeLeader
```

### `tick` 触发本地选举事件

Follower 和 Candidate 每次 tick 都增加 `electionElapsed`。达到随机选举超时后，节点给自己发送一条 `MsgHup`。

```go
func (r *Raft) tick() {
    switch r.State {
    case StateLeader:
        r.heartbeatElapsed++
        if r.heartbeatElapsed >= r.heartbeatTimeout {
            r.heartbeatElapsed = 0
            r.Step(pb.Message{
                From: r.id, To: r.id,
                MsgType: pb.MessageType_MsgBeat,
            })
        }
    default:
        r.electionElapsed++
        if r.electionElapsed >= r.randomElectionTimeout {
            r.electionElapsed = 0
            r.Step(pb.Message{
                From: r.id, To: r.id,
                MsgType: pb.MessageType_MsgHup,
            })
        }
    }
}
```

`becomeFollower` 和 `becomeCandidate` 都会从 `[electionTimeout, 2 * electionTimeout)` 中重新选择超时时间：

```go
r.randomElectionTimeout = r.electionTimeout + rand.Intn(r.electionTimeout)
```

每轮重置时重新随机，可以减少节点在一次平票后继续同时发起选举的概率。

### `MsgHup` 让 Follower 开始拉票

Follower 收到 `MsgHup` 后调用 `becomeCandidate`。这个函数把任期加一，投票给自己，清空上一轮票数，并重置计时器。

```go
func (r *Raft) becomeCandidate() {
    r.State = StateCandidate
    r.Term++
    r.Vote = r.id
    r.votes = map[uint64]bool{r.id: true}
    r.Lead = None
    r.electionElapsed = 0
    r.randomElectionTimeout =
        r.electionTimeout + rand.Intn(r.electionTimeout)
}
```

随后节点向其他 peer 发送 `MsgRequestVote`，请求中使用自己最后一条日志的 index 和 term：

```go
lastIndex := r.RaftLog.LastIndex()
lastTerm, _ := r.RaftLog.Term(lastIndex)
r.msgs = append(r.msgs, pb.Message{
    MsgType: pb.MessageType_MsgRequestVote,
    From:    r.id,
    To:      id,
    Term:    r.Term,
    Index:   lastIndex,
    LogTerm: lastTerm,
})
```

单节点集群不需要等待网络响应。它给自己的一票已经构成多数，可以直接调用 `becomeLeader()`。

### Follower 检查投票资格和日志新旧

当前实现把日志新旧判断直接写在 Follower 的 `MsgRequestVote` 分支中：

```go
lastIndex := r.RaftLog.LastIndex()
lastTerm, _ := r.RaftLog.Term(lastIndex)
logOK := m.LogTerm > lastTerm ||
    (m.LogTerm == lastTerm && m.Index >= lastIndex)
canVote := (r.Vote == None || r.Vote == m.From) && logOK

if canVote {
    r.Vote = m.From
    r.electionElapsed = 0
    r.msgs = append(r.msgs, pb.Message{
        MsgType: pb.MessageType_MsgRequestVoteResponse,
        From: r.id, To: m.From, Term: r.Term,
        Reject: false,
    })
}
```

更高任期已经在 `Step` 开头处理，此时 `becomeFollower` 会清空旧任期的 `Vote`。同一任期内，`r.Vote == None || r.Vote == m.From` 保证节点最多选择一位 Candidate，同时允许同一请求重试。

投出赞成票后，Follower 把 `electionElapsed` 归零，避免刚投完票就因本地超时发起另一轮选举。

### Candidate 计票并完成角色转换

Candidate 把响应记录到 `votes`。代码同时统计赞成与反对票，因此能够在任一方达到多数时结束这一轮。

```go
r.votes[m.From] = !m.Reject
granted, rejected := 0, 0
for _, vote := range r.votes {
    if vote {
        granted++
    } else {
        rejected++
    }
}

quorum := len(r.Prs)/2 + 1
if granted >= quorum {
    r.becomeLeader()
} else if rejected >= quorum {
    r.becomeFollower(r.Term, None)
}
```

`becomeLeader` 重建所有节点的复制进度，并追加一条当前任期的空日志：

```go
lastIndex := r.RaftLog.LastIndex()
for id := range r.Prs {
    r.Prs[id] = &Progress{Next: lastIndex + 1, Match: 0}
}

r.RaftLog.entries = append(r.RaftLog.entries, pb.Entry{
    Term:  r.Term,
    Index: r.RaftLog.LastIndex() + 1,
})

r.Prs[r.id].Match = r.RaftLog.LastIndex()
r.Prs[r.id].Next = r.RaftLog.LastIndex() + 1
```

其他节点的 `Next` 从 Leader 原日志末尾之后开始，`Match` 暂时为 0；Leader 自己的进度立即更新到新追加的空日志。随后 Leader 调用 `maybeCommit`，并向每个 Follower 发送 `MsgAppend`。

### 心跳和角色降级

Leader 达到心跳间隔后，通过 `MsgBeat` 广播 `MsgHeartbeat`。Follower 收到心跳时重置选举计时器、记录 Leader，并返回 `MsgHeartbeatResponse`。Leader 发现响应节点的 `Match` 落后，会调用 `sendAppend` 补日志。

当前实现的 `sendHeartbeat` 虽然在消息中填写了 `Commit`，`handleHeartbeat` 并没有用它推进 Follower 的 `committed`。提交位置通过后续的 `MsgAppend` 传播，`MsgAppend` 可以不携带新日志，只承担前缀确认和提交位置同步。原文把心跳写成了直接推进提交位置，这与当前仓库实现不符。

## TinyKV 中的日志复制

TinyKV 的复制路径是：

```text
MsgPropose -> 追加 Leader 本地日志 -> sendAppend
           -> handleAppendEntries -> MsgAppendResponse
           -> 更新 Progress -> maybeCommit
```

### `RaftLog` 维护三条进度线

`RaftLog` 把未压缩日志保存在 `entries` 中，并记录提交、应用和持久化进度：

```go
type RaftLog struct {
    storage Storage

    committed uint64
    applied   uint64
    stabled   uint64

    entries []pb.Entry
    pendingSnapshot *pb.Snapshot
}
```

`committed` 表示已经得到多数副本确认的最高位置，`applied` 表示已经交给状态机的最高位置，始终满足 `applied <= committed`。`stabled` 表示已经进入稳定存储的最高位置，它描述的是持久化进度，与是否得到多数确认不是同一件事。

选举和复制直接依赖 `LastIndex()`、`FirstIndex()` 与 `Term(i)`。`Term(i)` 优先从内存日志读取，索引不在内存范围时再查询 `Storage`。

### Leader 处理 `MsgPropose`

Leader 为提案分配连续的 index，并写入当前任期。然后更新自己的 `Progress`，尝试提交，并向其他节点发送追加请求。

```go
lastIndex := r.RaftLog.LastIndex()
for i, e := range m.Entries {
    e.Index = lastIndex + uint64(i) + 1
    e.Term = r.Term
    r.RaftLog.entries = append(r.RaftLog.entries, *e)
}

r.Prs[r.id].Match = r.RaftLog.LastIndex()
r.Prs[r.id].Next = r.RaftLog.LastIndex() + 1
r.maybeCommit()

for id := range r.Prs {
    if id != r.id {
        r.sendAppend(id)
    }
}
```

Leader 自己也必须更新 `Match`。`maybeCommit` 统一使用 `Prs` 统计多数位置，漏掉 Leader 自己会少算一个副本。

### `sendAppend` 从 `Next` 选择日志

对某个 Follower，`Next - 1` 就是本轮需要验证的前一条日志位置。TinyKV 读取这个位置的 term，再把从 `Next` 到 Leader 末尾的日志装入消息。

```go
func (r *Raft) sendAppend(to uint64) bool {
    prevIndex := r.Prs[to].Next - 1
    prevTerm, err := r.RaftLog.Term(prevIndex)
    if err != nil {
        return false
    }

    var entries []*pb.Entry
    if len(r.RaftLog.entries) > 0 {
        first := r.RaftLog.entries[0].Index
        for i := r.Prs[to].Next; i <= r.RaftLog.LastIndex(); i++ {
            e := r.RaftLog.entries[i-first]
            entries = append(entries, &e)
        }
    }

    r.msgs = append(r.msgs, pb.Message{
        MsgType: pb.MessageType_MsgAppend,
        From: r.id, To: to, Term: r.Term,
        Index: prevIndex, LogTerm: prevTerm,
        Entries: entries,
        Commit: r.RaftLog.committed,
    })
    return true
}
```

Project 2A 暂不处理快照。`Term(prevIndex)` 失败时，当前函数直接返回 `false`；日志压缩后如何发送快照属于 Project 2C。

### Follower 验证前缀并处理冲突

`handleAppendEntries` 先重置选举计时器并记录 Leader。Follower 的日志比 `m.Index` 短时，它返回自己的 `LastIndex`；对应位置的 term 不同时，它返回 `m.Index`。Leader 会根据这个 index 调整 `Next` 后重试。

```go
if m.Index > r.RaftLog.LastIndex() {
    r.msgs = append(r.msgs, pb.Message{
        MsgType: pb.MessageType_MsgAppendResponse,
        From: r.id, To: m.From, Term: r.Term,
        Reject: true, Index: r.RaftLog.LastIndex(),
    })
    return
}

if term, _ := r.RaftLog.Term(m.Index); term != m.LogTerm {
    r.msgs = append(r.msgs, pb.Message{
        MsgType: pb.MessageType_MsgAppendResponse,
        From: r.id, To: m.From, Term: r.Term,
        Reject: true, Index: m.Index,
    })
    return
}
```

前缀匹配后，Follower 逐条比较消息中的日志。已有条目的 term 相同就继续，发现冲突便从该 index 截断本地日志，回退 `stabled`，再追加剩余条目。

```go
for i, e := range m.Entries {
    if e.Index > r.RaftLog.LastIndex() {
        for _, ne := range m.Entries[i:] {
            r.RaftLog.entries = append(r.RaftLog.entries, *ne)
        }
        break
    }

    term, _ := r.RaftLog.Term(e.Index)
    if term != e.Term {
        if len(r.RaftLog.entries) > 0 {
            first := r.RaftLog.entries[0].Index
            r.RaftLog.entries = r.RaftLog.entries[:e.Index-first]
            if r.RaftLog.stabled >= e.Index {
                r.RaftLog.stabled = e.Index - 1
            }
        }
        for _, ne := range m.Entries[i:] {
            r.RaftLog.entries = append(r.RaftLog.entries, *ne)
        }
        break
    }
}
```

回退 `stabled` 很重要。被覆盖的冲突日志可能已经持久化，新的日志必须重新进入待持久化范围，否则内存和稳定存储会保留不同的后缀。

Follower 最后用本条消息实际覆盖到的位置限制提交进度，并返回自己的最新日志位置：

```go
lastNewIndex := m.Index
if len(m.Entries) > 0 {
    lastNewIndex = m.Entries[len(m.Entries)-1].Index
}
if m.Commit > r.RaftLog.committed {
    r.RaftLog.committed = min(m.Commit, lastNewIndex)
}

r.msgs = append(r.msgs, pb.Message{
    MsgType: pb.MessageType_MsgAppendResponse,
    From: r.id, To: m.From, Term: r.Term,
    Reject: false, Index: r.RaftLog.LastIndex(),
})
```

当前实现采用按 index 回退的简单策略，没有返回冲突 term 的起始位置。它可能比按任期跳跃多发几轮消息，但对应的协议过程更直接。

### Leader 更新 `Progress` 并提交

Leader 收到拒绝响应后，把该 Follower 的 `Next` 调整到响应携带的 index，再次调用 `sendAppend`。收到成功响应后，Leader 更新 `Match` 和 `Next`，然后调用 `maybeCommit`。

```go
if m.Reject {
    if m.Index > 0 {
        r.Prs[m.From].Next = m.Index
    } else {
        r.Prs[m.From].Next = 1
    }
    r.sendAppend(m.From)
} else if m.Index > r.Prs[m.From].Match {
    r.Prs[m.From].Match = m.Index
    r.Prs[m.From].Next = m.Index + 1
    if r.maybeCommit() {
        for id := range r.Prs {
            if id != r.id {
                r.sendAppend(id)
            }
        }
    }
}
```

提交位置变化后，Leader 立即再次广播 `MsgAppend`。这批消息可以不含新日志，主要用于把新的 `Commit` 告诉 Follower。

`maybeCommit` 把所有 `Match` 从大到小排序，取下标 `len(Prs)/2`。三节点取第二大值，五节点取第三大值，得到已被多数节点持有的最高位置。

```go
func (r *Raft) maybeCommit() bool {
    matches := make(uint64Slice, 0, len(r.Prs))
    for _, p := range r.Prs {
        matches = append(matches, p.Match)
    }
    sort.Slice(matches, func(i, j int) bool {
        return matches[i] > matches[j]
    })
    quorumMatch := matches[len(r.Prs)/2]

    if quorumMatch > r.RaftLog.committed {
        first := r.RaftLog.FirstIndex()
        if quorumMatch < first {
            return false
        }
        logTerm, err := r.RaftLog.Term(quorumMatch)
        if err != nil {
            return false
        }
        if logTerm == r.Term {
            r.RaftLog.committed = quorumMatch
            return true
        }
    }
    return false
}
```

`logTerm == r.Term` 对应 Raft 只能直接提交当前任期日志的规则。成为 Leader 时追加的空日志会进入同一条复制路径，空日志提交后，它之前的旧任期日志也随日志前缀一起进入已提交状态。

## 小结

领导者选举和日志复制共享三条约束。任期让节点识别延迟消息和旧 Leader；投票时的日志新旧比较阻止缺少已提交记录的节点当选；多数派同时决定谁能成为 Leader，以及哪些日志可以提交。

TinyKV Project 2A 把这些规则组织在一个消息驱动的状态机里。选举从 `tick` 产生的 `MsgHup` 开始，经由投票消息完成角色转换；复制从 `MsgPropose` 开始，经由 `MsgAppend`、`Progress` 和 `maybeCommit` 推进日志。顺着这两条路径阅读 `raft.go`，大部分字段和分支都能回到明确的协议规则。
