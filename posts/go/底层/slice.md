---
title: Slice 底层原理
date: 2026-01-12
order: 7
---

切片（Slice）是 Go 中最常用、也是面试最常问的数据结构之一

### 一、 核心数据结构

在 Go 源码 `src/runtime/slice.go` 中，切片的运行时表现形式是 `slice` 结构体：

```go
type slice struct {
    array unsafe.Pointer // 指向切片首元素的地址
    len   int            // 切片当前包含的元素个数
    cap   int            // 从 array 指针到底层数组末尾的元素个数
}
```

1. 把一个 slice 传给函数时，发生的是**值拷贝**。总共拷贝 24 字节（指针、长度、容量）
2. 虽然是拷贝了结构体，但因为内部 `array` 是指针，所以被调用函数修改元素值，外层**能**看到。但是，如果被调用函数触发了**扩容**，`array` 指针指向新地址，外层是**看不得**的（除非返回新的 slice）

### 二、 构造与初始化

需要区分以下三种情况：

1. **Nil Slice** (`var s []int`) 只是声明，未分配底层内存
2. **Empty Slice** (`s := []int{}`) 已初始化，但没有元素。`array` 指向一个全局的 `zerobase` 地址（所有 0 字节分配都指向它）
3. **Make** (`s := make([]int, len, cap)`)

- `mallocgc` 分配一块连续内存
- `array` 指向该内存首地址

<!-- 这是一张图片，ocr 内容为： -->

![makeslice](/go/slice/slice.png)

**源码解析**：

```go
// et: element type (元素类型的元数据，包含了元素大小等信息)
func makeslice(et *_type, len, cap int) unsafe.Pointer {
    // 1. 内存计算与溢出检查
    mem, overflow := math.MulUintptr(et.Size_, uintptr(cap))

    // 2. 异常边界检查，越界panic
    if overflow || mem > maxAlloc || len < 0 || len > cap {
        mem, overflow := math.MulUintptr(et.Size_, uintptr(len))
        if overflow || mem > maxAlloc || len < 0 {
            panicmakeslicelen()
        }
        panicmakeslicecap()
    }

    // 3. 核心内存分配
    // 调用 mallocgc 分配 mem 大小的连续内存。
    // et: 告诉垃圾回收器这块内存存的是什么类型（特别是里面有没有指针）。
    // true: 表示这块内存需要被清零（Zeroed），即所有元素初始化为零值。
    return mallocgc(mem, et, true)
}
```

**1. 计算内存大小** (`math.MulUintptr`)

`makeslice` 并不直接返回 `SliceHeader` 结构体，它的任务仅仅是开辟底层数组，并返回数组首地址的指针

它负责计算所需字节数`sizeof(T) * cap`。 需要注意如果用户传了一个巨大的 `cap`，结果可能会溢出，引发严重的安全漏洞

**2. `maxAlloc` 是多少？**

- **64 位系统**: 理论上非常大，实际受限于虚拟内存空间（通常是 48 位或 57 位寻址）
- **32 位系统**: 限制在 2GB 或 4GB 以内

**3. `mallocgc` 的行为**

- **微小对象（< 16KB）**: 把多个微小对象塞进同一个 16 字节的内存块
- **小对象（16KB < size< 32KB）**: 从当前 P (Processor) 的 `mcache` 中分配，无锁，极快
- **大对象（> 32KB）**: 直接从 `mheap` 全局堆分配，需要加锁
- **空切片（`make([]int, 0)`）**：`mallocgc` 会检测到 `size` 为 0，不会真正分配内存，而是返回一个全局固定的地址 `zerobase`

**字面量初始化（`[]int{1, 2, 3}`）**

如果你不是用 `make`，而是直接用字面量初始化：

```go
s := []int{10, 20}
```

**这种情况下不会调用 `makeslice`。**

1. **栈上优化**: 如果数组很小且不逃逸，直接在栈上开辟一个数组 `[2]int`
2. **堆上分配**: 如果数组逃逸，调用 `newobject` 在堆上开辟数组
3. **构建切片**: 编译器生成指令，将数组的地址赋值给 `s.array`，并将 `len` 和 `cap` 都设为 2

### 三、引用传递

> **Go 语言中只有“值传递”。不存在由编译器层面支持的“引用传递”**

切片本质上是一个**包含指针的结构体**。当你把一个切片 `s` 传递给函数 `foo(s)` 时，发生了以下过程：

Go 运行时将 `s` 的 24 字节 `SliceHeader`完整**拷贝**了一份。函数 `foo` 内部的参数 `s`，在内存栈上是一个全新的变量，有独立的地址。但是，拷贝出来的 `s.Data` 指针值，和原来的 `Data` 指针值是一模一样的

#### 场景 1：修改底层元素

```go
func modify(s []int) {
    // s 是外部切片的一份拷贝
    // s.Data 和外部切片的 Data 指向同一个数组
    s[0] = 999
}

func main() {
    a := []int{1, 2, 3}
    modify(a)
    fmt.Println(a) // 输出 [999, 2, 3] -> 变了！
}

```

- `modify` 函数拿到的 `s` 虽然是副本，但 `s.Data` 指向的堆内存地址没变
- `s[0] = 999` 本质是汇编指令：`MOVQ $999, (s.Data)`
- 它直接去修改了堆内存里的数据。外部变量读取同一块堆内存，自然看到了变化

#### 场景 2：触发扩容/修改 Header

```go
func appendNum(s []int) {
    // s 是外部切片的一份拷贝 触发了扩容
    // 1. 分配新数组 (新地址 0xff...)
    // 2. 将 s.Data 修改为 0xff...
    // 3. 将 s.Len 修改为 4
    s = append(s, 4)
    fmt.Println("内部:", s) // [1, 2, 3, 4]
}

func main() {
    a := []int{1, 2, 3}
    appendNum(a)
    fmt.Println("外部:", a) // 输出 [1, 2, 3] -> 没变！
}

```

- `append` 导致 `s` 的容量不足，触发 `growslice`。Go 分配了一个新的底层数组
- 函数内部的变量 `s`，它的 `Data` 指针变了，指向了新数组；它的 `Len` 也变了。外部变量 `a`的 `SliceHeader` 不变，`Data` 还指向老的数组，`Len` 还是 3。这证明 `s` 和 `a` 是两个独立的结构体变量

#### 如何函数里改长度怎么办？

**方法：传切片的指针 或者 return 新切片**

```go
// 接收一个指向切片的指针
func realAppend(s *[]int) {
    // *s 解引用，找到了外部真正的 SliceHeader
    // 修改了外部那个 Header 的 Data 和 Len
    *s = append(*s, 4)
}

// func realAppend(s []int) []int {
//     s = append(s, 4)
//     return s
// }

func main() {
    a := []int{1, 2, 3}
    realAppend(&a) // 传地址
    fmt.Println(a) // [1, 2, 3, 4] -> 变了
}
```

Go 语言严格遵守**值传递**。切片作为参数传递时，拷贝的是 **SliceHeader**。因为 Header 内部包含指向底层数组的指针，所以表现为**引用语义**或者**浅拷贝**

### 四、内容截取

截取操作通常写为 `s[i:j]`），是典型的 Zero-Copy 机制

```go
oldSlice := []int{10, 20, 30, 40, 50}
// len=5, cap=5, array=0x1000
// 截取下标 1 到 3 (不包含 3)
newSlice := oldSlice[1:3]
// 结果: [20, 30]
```

**编译器在背后做了简单的加减法**：

1. **Data 指针移动**:`newSlice.Data` = `oldSlice.Data` + `1 * sizeof(int)`
2. **Len 长度计算**: `newSlice.Len` = `high - low` = `3 - 1` = `2`
3. **Cap 容量计算**: `newSlice.Cap` = `oldSlice.Cap - low` = `5 - 1` = `4`

默认情况下，新切片的容量是从新起点一直到底层数组的最末尾

因为 `newSlice` 和 `oldSlice` 共享同一块物理内存，这带来了两个影响：

**性能优势**: 无论底层数组有 100MB 还是 1GB，执行 `s[i:j]` 的时间复杂度永远是 **O(1)**。因为它只涉及创建 3 个整数大小的结构体

**风险**: 修改 `newSlice` 的元素，会影响 `oldSlice`

```go
data := []int{1, 2, 3, 4, 5}
sub := data[1:3] // [2, 3]

sub[0] = 888
fmt.Println(data) // 输出 [1, 888, 3, 4, 5] -> 原切片被改了！
```

#### 三下标截取

如果你不希望新切片拥有“到数组末尾”那么大的容量，可以使用 **Go 1.2** 引入的语法：

`slice[low : high : max]`

```go
source := []int{10, 20, 30, 40, 50}
// 标准截取: len=1, cap=4 (30, 40, 50, ...)
s1 := source[1:2]
// 三下标截取: len=1, cap=1 (20)
// max 设为 2，意味着 cap = 2 - 1 = 1
s2 := source[1:2:2]
```

**好处：保护底层数组不被意外修改**  
如果 `s2` 的容量只有 1，当你对 `s2` 执行 `append` 时，由于容量不足，Go 会强制分配一个新的底层数组（Copy-on-Write）。这样，你再修改 `s2` 的元素，就不会影响到原来的 `source` 数组了。

#### 内存泄露

**场景**： 你读取了一个 100MB 的大文件到内存中，然后只需要其中的前 1KB 数据。

```go
func getHeader() []byte {
    // 1. 假设分配 100MB 内存
    content, _ := os.ReadFile("big_log.txt")
    // 2. 截取前 10 字节
    // header 的结构体很小，但它的 Data 指针指向那个 100MB 的大数组
    return content[:10]
}

func main() {
    h := getHeader()
    // 只要 h 还在被使用，那 100MB 内存就永远不会被 GC 回收
}
```

**解决方案：Copy**，必须新建一个切片，把数据拷出来，断开与大数组的联系。

```go
func getHeaderSafe() []byte {
    content, _ := os.ReadFile("big_log.txt")
    header := make([]byte, 10)

    copy(header, content[:10]) // 深拷贝
    // 函数返回后，content 变量销毁，那个 100MB 数组没有被引用，会被 GC 回收
    return header
}
```

### 五、 扩容机制

#### 扩容流程

**预估扩容容量**

Go 1.18 之前和之后的算法不同。目前的版本（1.18+）为了让容量增长曲线更平滑，弃用了简单的 "1024 阈值"。**当前算法逻辑** (`src/runtime/slice.go`)

- 倘若扩容后预期的新容量小于原切片的容量，则 panic
- 倘若切片元素大小为 0（元素类型为 struct{}），则直接复用一个全局的 zerobase 实例，直接返回
- 倘若预期的新容量超过老容量的两倍，则直接采用预期的新容量
- 倘若老容量小于 256，则直接采用老容量的 2 倍作为新容量
- 倘若老容量已经大于等于 256，则老容量的基础上扩大 1/4 的比例并且累加上 192 的数值，持续这样处理，直到得到的新容量已经大于等于预期的新容量为止

**内存对齐**

这时候计算出的 `newCap` 往往不是最终的 `cap`。Go 的内存分配器是按**跨度类**分配内存的（例如 8B, 16B, 32B, 48B, 64B...）

1. 根据 `newCap * sizeof(Element)` 计算需要的**字节数**
2. 向内存分配器申请**最接近且大于等于**该字节数的内存块（Spec）
3. 用**实际申请到的内存大小**除以 `sizeof(Element)`，得到**最终的 Cap**

假设 `[]byte`，`oldCap=10`，`append` 后需要 11 字节

1. 预估: `<256`，翻倍到 20 字节
2. 对齐: 内存分配器没有 20B 规格，最小匹配是 32B
3. 最终: 32 / 1 = 32， `cap` 变成了 32，而不是 20

**数据搬迁**

- 分配新数组
- 使用 `memmove`（汇编指令）将旧数据拷贝到新地址。**注意不是 memcopy，memmove 能处理内存重叠，虽然后里一般不重叠**
- 返回新的 slice 结构体

<!-- 这是一张图片，ocr 内容为： -->

![扩容机制](/go/slice/slicekuorong.png)

#### 源码解析

```go
func growslice(oldPtr unsafe.Pointer, newLen, oldCap, num int, et *_type) slice {
	oldLen := newLen - num

	if et.Size_ == 0 {
		if newLen < oldCap {
			throw("growslice: cap out of range")
		}
		// append 后的 slice 依然指向 zerobase
		return slice{unsafe.Pointer(&zerobase), newLen, newLen}
	}

	if newLen < 0 {
		panic(errorString("growslice: len out of range"))
	}

	// 核心扩容算法逻辑
	// 倘若扩容后预期的新容量小于原切片的容量，则 panic (在前面 newLen < 0 已经处理了溢出)
	// 这里主要是处理 newLen 本身的需求
	if newLen < oldCap {
		panic(errorString("growslice: cap out of range"))
	}

	// 默认新容量至少要满足当前需求
	newcap := oldCap
	doublecap := newcap + newcap

	// 倘若预期的新容量超过老容量的两倍，则直接采用预期的新容量
	if newLen > doublecap {
		newcap = newLen
	} else {
		const threshold = 256
		// 倘若老容量小于 256，则直接采用老容量的 2 倍作为新容量
		if oldCap < threshold {
			newcap = doublecap
		} else {
			// 倘若老容量已经大于等于 256...
			// 循环检查直到 newcap >= newLen
			for 0 < newcap && newcap < newLen {
				// 公式：扩大 1/4 的比例并且累加上 192 的数值
				newcap += (newcap + 3*threshold) / 4
			}
			// 处理 newcap 溢出变为负数的情况
			if newcap <= 0 {
				newcap = newLen
			}
		}
	}

	// 内存对齐
	var overflow bool
	var lenmem, newlenmem, capmem uintptr

	// 针对不同大小的元素进行特定的优化
	switch {
	case et.Size_ == 1:
		lenmem = uintptr(oldLen)
		newlenmem = uintptr(newLen)
		// roundupsize: 将预估容量向上取整到内存规格
		capmem = roundupsize(uintptr(newcap))
		overflow = uintptr(newcap) > maxAlloc

		newcap = int(capmem)

	case et.Size_ == goarch.PtrSize:
		lenmem = uintptr(oldLen) * goarch.PtrSize
		newlenmem = uintptr(newLen) * goarch.PtrSize
		// roundupsize: 预估容量 * 8 后再取整
		capmem = roundupsize(uintptr(newcap) * goarch.PtrSize)
		overflow = uintptr(newcap) > maxAlloc/goarch.PtrSize

		newcap = int(capmem / goarch.PtrSize)

	case isPowerOfTwo(et.Size_):
		// 元素大小是 2 的幂次 (如 2, 4, 16...)，用位运算优化
		var shift uintptr
		if goarch.PtrSize == 8 {
			// Mask shift for better code generation.
			shift = uintptr(sys.Ctz64(uint64(et.Size_))) & 63
		} else {
			shift = uintptr(sys.Ctz32(uint32(et.Size_))) & 31
		}
		lenmem = uintptr(oldLen) << shift
		newlenmem = uintptr(newLen) << shift
		capmem = roundupsize(uintptr(newcap) << shift)
		overflow = uintptr(newcap) > (maxAlloc >> shift)
		newcap = int(capmem >> shift)

	default:
		// 普通元素大小，使用标准乘除法
		lenmem = uintptr(oldLen) * et.Size_
		newlenmem = uintptr(newLen) * et.Size_
		capmem, overflow = math.MulUintptr(et.Size_, uintptr(newcap))
		capmem = roundupsize(capmem)
		newcap = int(capmem / et.Size_)
	}

	// 再次检查是否溢出或超出最大分配限制
	if overflow || capmem > maxAlloc {
		panic(errorString("growslice: len out of range"))
	}

	// 内存分配与数据搬迁

	var p unsafe.Pointer
	// 如果元素不包含指针，调用 mallocgc 时不需要扫描 (scan)，效率更高
	if et.PtrBytes == 0 {
		p = mallocgc(capmem, nil, false) // false: 不需要清零，后续 memclrNoHeapPointers 会处理
		// The command-line flag -d=checkptr enables this...
		// (省略 checkptr 调试相关代码)

		// 只是将超出 oldLen 的部分清零
		memclrNoHeapPointers(add(p, newlenmem), capmem-newlenmem)
	} else {
		// 包含指针，需要 GC 扫描，且分配出来的内存必须清零
		p = mallocgc(capmem, et, true)
		if lenmem > 0 && writeBarrier.enabled {
			// 如果开启了写屏障，使用 bulkBarrierPreWrite
			bulkBarrierPreWriteSrcOnly(uintptr(p), uintptr(oldPtr), lenmem-et.Size_+et.PtrBytes)
		}
	}

	// 将旧数组的数据搬迁到新数组
	// memmove 处理内存拷贝 (底层汇编)
	memmove(p, oldPtr, lenmem)

	return slice{p, newLen, newcap}
}
```

### 六、切片拷贝

slice 的拷贝分为简单拷贝和完整拷贝（截取操作也属于简单拷贝）

当你使用 `=` 进行赋值，或者将切片作为参数传递给函数时，发生的是浅拷贝，只拷贝了 **24 字节的 SliceHeader**。`s1` 和 `s2` 是两个独立的结构体，但它们的 `Data` 指针指向堆内存中 **同一个底层数组**。

如果想把数据分离出来，必须使用 Go 提供的内建函数 `copy`。

```go
func copy(dst, src []Type) int
```

**核心规则**：`min(len(dst), len(src))` 拷贝的数量取决于两者长度较小的那个。

```go
// 错误写法
src := []int{1, 2, 3}
dst := make([]int, 0) // len=0, cap=0
copy(dst, src)        // 拷贝了 min(0, 3) = 0 个元素！
// dst 依然是 []

// 正确写法，显式分配长度
dst := make([]int, len(src)) // 预分配足够的长度
copy(dst, src)
// dst 是 [1, 2, 3]
```

`copy` 是将 `src` 的元素内存**原样复制**到 `dst`。

- **对于数值（`int`、`struct`）**：是完全的拷贝，互不影响
- **对于引用（`*int`、`map`、`slice`）**：这是**浅拷贝**

```go
type Node struct {
    Val int
    Next *Node
}
// 假设 src 里存的是指针
src := []*Node{{Val: 1}}
dst := make([]*Node, 1)
copy(dst, src)

// 危险：dst[0] 和 src[0] 指向同一个堆内存地址！
// 修改 dst[0].Val 会影响 src[0].Val。
```

#### 底层实现：`slicecopy`

`copy` 关键字在编译时会根据参数类型转换为 `runtime.slicecopy`（如果涉及字符串则是 `slicestringcopy`）。**源码位置**: `src/runtime/slice.go`

```go
// toPtr: 目标地址 (dst.Data)
// toLen: 目标长度 (len(dst))
// width: 元素大小 (sizeof(T))
func slicecopy(toPtr unsafe.Pointer, toLen int, fromPtr unsafe.Pointer, fromLen int, width uintptr) int {
    // 1. 计算拷贝数量: min(toLen, fromLen)
    if fromLen == 0 || toLen == 0 {
        return 0
    }
    n := fromLen
    if toLen < n {
        n = toLen
    }
    // 2. 只有 width != 0 才需要真拷贝 (空结构体 struct{} 不占位)
    if width == 0 {
        return n
    }
    // 3. 计算内存大小
    // size = n * width
    size := uintptr(n) * width
    // 4. 核心：调用 memmove
    // race.enabled 的代码略去...
    memmove(toPtr, fromPtr, size)
    return n
}
```

**为什么是 `memmove` 而不是 `memcpy`？**

- **`memcpy`**： 假设源区域和目标区域**不重叠**。如果重叠，行为未定义（可能会导致数据被覆盖破坏）
- **`memmove`**： 能够安全地处理**内存重叠** 的情况。它会根据重叠的方向，决定是从前往后拷，还是从后往前拷

**应用场景**: 切片的元素删除操作，本质上就是利用了“自身拷贝”

```go
s := []int{1, 2, 3, 4, 5}
// 删除下标为 2 的元素 (3)
// 相当于把 [4, 5] 拷贝到 [3, 4] 的位置
copy(s[2:], s[3:])
// s 变成了 [1, 2, 4, 5, 5]
s = s[:4] // 截断

```

在这个操作中，源内存 (`s[3:]`) 和目标内存 (`s[2:]`) 是重叠的。正是因为 Go 底层用了 `memmove`，这种写法才是安全的

#### 问题 1：

- 初始化切片 s 长度容量均为 10
- 初始化切片 s 长度为 0，容量为 10
- 初始化切片 s 长度为 10，容量为 11

在 s 的基础上追加 append 一个元素

s 的内容、长度以及容量分别是什么

#### 问题 2：

初始化切片 s 长度为 10，容量为 12

- 截取切片 s index=8 之后的内容赋给 s1
- 截取切片 s index 为[ 8,9 ) 之后的内容赋给 s1
- 截取切片 s index=8 之后的内容赋给 s1 修改 s1[ 0 ]的值 是否会影响 s 的值
- 访问 s[ 10 ]会不会越界
- 截取切片 s index=8 之后的内容赋给 s1 在方法 changeSlice 中对 s1[ 10 ]进行修改，s 的内容是什么
- 截取切片 s index=8 之后的内容赋给 s1 在方法 changeSlice 中对 s1[ 10 ]进行 append，s 以及 s1 的内容、长度、容量分别是什么

s1 的内容、长度以及容量分别是什么
