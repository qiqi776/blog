---
title: golang 基础语法
date: 2026-01-06
order: 1
---

# Go 基础语法

### 变量定义

在 Go 语言中，变量是用于存储数据的内存地址的具名表示。Go 是一种静态类型语言，这意味着每个变量在声明时都必须有一个明确的类型

#### 标准声明

最基础的变量声明方式是使用 `var` 关键字，其标准格式为：

```go
var 变量名 变量类型
```

如果一个变量被声明但没有被显式赋值，它将被赋予其类型的零值

- 数值类型（`int`, `float64` 等）的零值是 `0`
- 布尔类型（`bool`）的零值是 `false`
- 字符串类型（`string`）的零值是 `""` (空字符串)
- 指针、接口、切片、映射、通道、函数类型的零值是 `nil`

```go
package main

import "fmt"

func main() {
    // 声明一个名为 age 的 int 类型变量
    var age int
    fmt.Println("age 的零值是:", age) // 输出: age 的零值是: 0

    // 声明一个名为 name 的 string 类型变量
    var name string
    fmt.Println("name 的零值是:", name) // 输出: name 的零值是:

    // 声明一个名为 isStudent 的 bool 类型变量
    var isStudent bool
    fmt.Println("isStudent 的零值是:", isStudent) // 输出: isStudent 的零值是: false
}
```

使用 `var` 关键字配合括号进行批量声明，使代码更整洁

```go
var (
    studentName string
    studentAge  int
    studentID   string
)
```

在声明变量的同时，可以直接为其赋值

```go
var 变量名 变量类型 = 值
```

Go 编译器非常智能，可以根据右侧的值自动推断变量的类型，因此 `变量类型` 也可以省略

```go
var 变量名 = 值
```

批量声明也可以同时进行初始化：

```go
var (
    planet   = "地球"
    star     = "太阳"
    distance = 149600000 // 单位: km
)
```

在函数内部，可以使用一种更简洁的 `:=` 操作符来声明并初始化变量。它会自动进行类型推断，并且是 Go 语言中最常用的变量声明方式

**注意：短变量声明 `:=` 只能在函数内部使用，不能用于声明全局变量**

```go
func main() {
    name := "Go 语言"
    version := 1.18

    fmt.Printf("%s 的版本是 %.2f\n", name, version)
}
```

`:=` 操作符的一个重要特性是，在多变量赋值时，如果其中至少有一个变量是新声明的，就可以使用它。这在处理函数返回值（特别是错误处理）时非常有用

```go
// 假设 os.Open 返回 (*os.File, error)
file, err := os.Open("test.txt")
if err != nil {
    log.Fatal(err)
}

// 在这里，err 变量已经被声明过，但 a 是新变量，所以可以使用 :=
a, err := someOtherFunction()
if err != nil {
    log.Fatal(err)
}
```

#### 常量

常量用于存储在程序运行期间不可改变的值。使用 `const` 关键字定义

```go
const pi = 3.14159
const companyName = "Google"

// 批量定义常量
const (
    StatusOK = 200
    StatusNotFound = 404
)
```

#### `iota` 常量生成器

Go 提供了一个特殊的常量 `iota`，它可以被认为是一个可被编译器修改的常量。在每一个 `const` 关键字出现时，`iota` 的值被重置为 0，然后 `const` 声明块中每新增一行常量声明，`iota` 的值会自动加 1

```go
const (
    a = iota // a = 0
    b = iota // b = 1
    c = iota // c = 2
)

// 更简洁的写法
const (
    d = iota // d = 0
    e        // e = 1 (省略时会自动应用上一行的表达式)
    f        // f = 2
)

// iota 也可以用于复杂的表达式
const (
    B = 1 << (10 * iota) // 1 << (10 * 0) = 1
    KB                   // 1 << (10 * 1) = 1024
    MB                   // 1 << (10 * 2) = 1048576
    GB                   // 1 << (10 * 3) = ...
)
```

### 标准输入输出

Go 的标准输入输出功能主要由 `fmt` 包提供

#### 标准输出

- `fmt.Print()`: 将内容输出到控制台，不带换行

```go
fmt.Print("Hello,")
fmt.Print(" World!") // 输出: Hello, World!
```

- `fmt.Println()`: 将内容输出到控制台，参数之间会添加空格，并在最后自动添加换行符

```go
fmt.Println("Hello,", "World!") // 输出: Hello, World!
```

- `fmt.Printf()`: 格式化输出，允许你通过“格式化动词”来控制输出的格式

**常用的格式化动词**：

- `%v`：值的默认格式
- `%+v`：在 `%v` 基础上，结构体会输出字段名
- `%#v`：值的 Go 语法表示
- `%T`：值的类型
- `%s`：字符串
- `%d`：十进制整数
- `%f`：浮点数
- `%p`：指针地址

```go
type User struct {
    Name string
    Age  int
}

func main() {
    user := User{Name: "Alice", Age: 25}
    fmt.Printf("默认格式: %v\n", user)       // 输出: {Alice 25}
    fmt.Printf("带字段名: %+v\n", user)     // 输出: {Name:Alice Age:25}
    fmt.Printf("Go 语法表示: %#v\n", user)  // 输出: main.User{Name:"Alice", Age:25}
    fmt.Printf("变量类型: %T\n", user)       // 输出: main.User
}
```

#### 标准输入

`fmt` 包提供了 `Scan` 系列函数用于从标准输入读取数据。**这些函数会阻塞程序，直到用户输入并按下回车**

- `fmt.Scan(&变量1, &变量2, ...)`: 从标准输入读取数据，通过空格分隔，并赋值给传入的变量（必须是地址）
- `fmt.Scanln(&变量1, &变量2, ...)`: 与 `Scan` 类似，但在读取到换行时停止
- `fmt.Scanf("格式化字符串", &变量1, ...)`: 按照指定的格式进行读取

```go
var name string
var age int
fmt.Print("请输入姓名和年龄 (用空格隔开): ")
fmt.Scan(&name, &age)
fmt.Printf("姓名: %s, 年龄: %d\n", name, age)
```

**更健壮的输入方式**： `bufio`

`fmt.Scan` 系列函数在处理复杂的或带空格的输入时可能会出问题。更推荐使用 `bufio` 包来按行读取

```go
import (
    "bufio"
    "fmt"
    "os"
    "strings"
)

func main() {
    // 创建一个读取器，关联到标准输入
    reader := bufio.NewReader(os.Stdin)

    fmt.Print("请输入你的名字: ")
    // 读取直到遇到第一个换行符
    name, _ := reader.ReadString('\n')
    // 移除字符串末尾的换行符
    name = strings.TrimSpace(name)

    fmt.Printf("你好, %s!\n", name)
}
```

### 基础数据类型详解

#### 整数类型

Go 语言提供了多种尺寸的整数类型，以满足不同场景下对性能和内存占用的需求。这些类型分为**有符号**和**无符号**两大家族

**有符号整数**：可以表示正数、负数和零

- `int8`: 8 位整数，范围 -128 到 127
- `int16`: 16 位整数，范围 -32,768 到 32,767
- `int32`: 32 位整数，范围约 -21 亿 到 21 亿
- `int64`: 64 位整数，范围约 -922 京 到 922 京
- `int`: **最常用的整数类型**。在 32 位系统上是 `int32`，在 64 位系统上是 `int64`

**无符号整数**：只能表示非负数

- `uint8`: 8 位无符号整数，范围 0 到 255
- `uint16`: 16 位无符号整数，范围 0 到 65,535
- `uint32`: 32 位无符号整数，范围 0 到 约 42 亿
- `uint64`: 64 位无符号整数，范围 0 到 约 1844 京
- `uint`: 平台相关的无符号整数（32 位或 64 位）

**特殊整数类型**

- `byte`: `uint8` 的别名。它常用于强调处理的是原始的字节数据，例如在文件 I/O 或网络通信中
- `rune`: `int32` 的别名。它专门用于表示一个 Unicode 码点，是 Go 语言处理多国语言字符的核心。一个 `rune` 可以代表一个英文字母、一个汉字、一个 emoji 表情等

#### 浮点数类型

- `float32`: 32 位浮点数，也称为单精度浮点数
- `float64`: 64 位浮点数，也称为双精度浮点数

在 Go 中，如果没有明确指定，浮点数常量（如 `3.14`）的默认类型是 `float64`。由于 `float64` 的精度更高，在大多数情况下都推荐使用 `float64`

```go
package main

import "fmt"

func main() {
    var pi float64 = 3.1415926535
    var price float32 = 99.99

    fmt.Printf("圆周率 (float64): %f\n", pi)
    fmt.Printf("价格 (float32): %.2f\n", price) // %.2f 表示格式化为2位小数
}
```

#### 布尔类型

布尔类型 `bool` 只有两个可能的值：`true` 和 `false`。它常用于条件判断。在 Go 中，`bool` 类型的值不能和 `int` 类型（如 0 或 1）相互转换

```go
package main

import "fmt"

func main() {
    var isLogin bool = true
    isVIP := false

    if isLogin {
        fmt.Println("用户已登录")
        if !isVIP {
            fmt.Println("但不是 VIP 用户")
        }
    }
}
```

#### 字符与字符串类型

Go 语言中没有专门的 `char` 类型。单个字符由单引号 `' '` 包裹，其类型是 `rune`。如前所述，`rune` 是 `int32` 的别名，代表一个 Unicode 码点

- 对于 ASCII 字符（如 `'a'`），其码点值可以用一个 `byte` (`uint8`) 存储
- 对于非 ASCII 字符（如 `'中'`），其码点值需要超过一个字节来存储，因此必须使用 `rune`

字符串 `string` 是一个**不可变的字节序列**。字符串通常使用双引号 `"` `"` 包裹

**核心特性**：

1. 不可变性：一旦字符串被创建，其内容就不能被修改。任何试图修改字符串的操作都会创建一个新的字符串
2. 字节序列：`len()` 函数返回的是字符串包含的字节数，而不是字符数

```go
package main

import "fmt"

func main() {
    s1 := "Hello, World!"
    s2 := "你好，世界！"

    // len() 返回字节数
    fmt.Printf("'%s' 的长度 (字节数): %d\n", s1, len(s1)) // 输出: 13
    fmt.Printf("'%s' 的长度 (字节数): %d\n", s2, len(s2)) // 输出: 18 (UTF-8编码下，一个汉字占3个字节)

    // 正确遍历包含多字节字符的字符串，应该使用 for...range
    // for...range 会自动按 rune 解码
    for i, r := range s2 {
        fmt.Printf("索引 %d, 字符 %c\n", i, r)
    }
}
```

#### 转义字符

在双引号字符串中，可以使用转义字符表示特殊字符：

- `\n`：换行符
- `\t`：制表符（Tab）
- `\r`：回车符
- `\"`：双引号
- `\\`：反斜杠
- `\'`：单引号（通常可不转义）

```go
fmt.Println("第一行\n第二行")
fmt.Println("他说：\"你好！\"")
```

#### 多行字符串

使用反引号 `` ` `` 包裹的字符串是原始字符串字面量

1. 字符串中的内容不会被转义，所有字符（包括 `\n`）都按原样输出
2. 可以直接在代码中换行来创建多行字符串

它非常适合用于书写 HTML 模板、SQL 查询、JSON 数据等

```go
package main

import "fmt"

func main() {
    html := `
<!DOCTYPE html>
<html>
<head>
    <title>我的页面</title>
</head>
<body>
    <h1>欢迎！</h1>
</body>
</html>
`
    fmt.Println(html)
}
```

#### 零值

这是 Go 语言的一个重要特性。当一个变量被声明但没有显式初始化时，Go 会自动为其赋予一个**零值**。这确保了所有变量都有一个可预测的、确定的初始状态，避免了在其他语言中常见的“未初始化变量”错误

**各基础类型的零值**：

- `int`（所有尺寸）：`0`
- `uint`（所有尺寸）：`0`
- `float32`、`float64`：`0.0`
- `bool`：`false`
- `string`：`""`（空字符串）
- `rune`：`0`（表示 `\x00`，即 NUL 字符）

#### 自定义类型

结构体就是自定义类型中的一种，除此之外我们使用自定义类型，还可以让代码组合更加规范，例如，响应给客户端的想要码，给他一个自定义类型

```go
package main

import "fmt"

type Code int

const (
    SuccessCode    Code = 0
    ValidCode      Code = 7 // 校验失败的错误
    ServiceErrCode Code = 8 // 服务错误
)

func (c Code) GetMsg() string {
    // 可能会有更加响应码返回不同消息内容的要求，我们在这个函数里面去实现即可
    // 可能还会有国际化操作
    return "成功"
}

func main() {
    fmt.Println(SuccessCode.GetMsg())
    var i int
    fmt.Println(int(SuccessCode) == i) // 必须要转成原始类型才能判断
}
CopyErrorOK!
```

#### 类型别名

和自定义类型很像，但是有一些地方和自定义类型有很大差异

- 不能绑定方法
- 打印类型还是原始类型
- 和原始类型比较，类型别名不用转换

```go
package main

import "fmt"

type AliasCode = int
type MyCode int

const (
  SuccessCode      MyCode    = 0
  SuccessAliasCode AliasCode = 0
)

// MyCodeMethod 自定义类型可以绑定自定义方法
func (m MyCode) MyCodeMethod() {
}

// MyAliasCodeMethod 类型别名 不可以绑定方法
func (m AliasCode) MyAliasCodeMethod() {
}

func main() {
  // 类型别名，打印它的类型还是原始类型
  fmt.Printf("%T %T \n", SuccessCode, SuccessAliasCode) // main.MyCode int
  // 可以直接和原始类型比较
  var i int
  fmt.Println(SuccessAliasCode == i)
  fmt.Println(int(SuccessCode) == i) // 必须转换之后才能和原始类型比较
}
```

### 数组、切片、map

#### 数组

数组是一个由固定长度的、同一类型元素组成的序列。数组是 Go 语言中最基础的复合数据结构

- 声明与初始化

```go
// 声明一个长度为 3 的 int 类型数组，所有元素被初始化为零值 0
var a [3]int

// 声明并初始化一个数组
var b = [3]int{10, 20, 30}

// 使用 ... 让编译器自动计算数组长度
c := [...]int{1, 2, 3, 4} // c 的类型是 [4]int
```

数组的元素通过索引进行访问。索引是一个从 `0` 开始的整数，最大值为 `数组长度 - 1`

```go
package main

import "fmt"

func main() {
    scores := [4]int{90, 85, 95, 100}

    // 通过索引读取元素
    firstScore := scores[0] // 90
    thirdScore := scores[2] // 95
    fmt.Printf("第一门成绩: %d\n", firstScore)

    // 通过索引修改元素
    scores[1] = 88 // 将第二个元素从 85 修改为 88
    fmt.Printf("修改后的成绩: %v\n", scores) // [90 88 95 100]
}
```

在 Go 中，数组是值类型。这意味着当一个数组被赋值给另一个变量，或者作为参数传递给函数时，**传递的是整个数组的副本**

```go
func modifyArray(arr [3]int) {
    arr[0] = 100 // 修改的是 arr 的副本
}

func main() {
    original := [3]int{1, 2, 3}
    modifyArray(original)
    fmt.Println(original) // 输出: [1 2 3]，原始数组并未改变
}
```

由于其固定长度和值传递的特性，数组在 Go 中的使用场景相对有限，更常用切片

#### 切片

切片是一个拥有相同类型元素的可变长度的序列。切片是 Go 语言的灵魂，也是使用最广泛的数据结构。切片并不直接拥有数据，更像是一个指向底层数组的视图或窗口。切取了底层数组的一部分来进行操作

一个切片内部由三个部分构成：

1. 指针：指向底层数组中切片起始元素的位置
2. 长度：切片中包含的元素个数，通过 `len()` 函数获取
3. 容量：从切片的起始位置到底层数组末尾的元素个数，通过 `cap()` 函数获取

**有多种方式可以创建切片**

1. 从数组或另一个切片切出来

```go
// 使用 `[low:high]` 语法，这是一个左闭右开的区间
arr := [...]int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}
s1 := arr[2:5] // 从索引 2 开始，到索引 5 结束（不包含 5），结果是 [2 3 4]
s2 := arr[:4]  // 从头开始，到索引 4 结束，结果是 [0 1 2 3]
s3 := arr[6:]  // 从索引 6 开始，到结尾，结果是 [6 7 8 9]
s4 := arr[:]   // 包含所有元素
```

2. 使用字面量直接创建

```go
s := []string{"北京", "上海", "深圳"} // 注意：这里没有指定长度
```

3. 使用 `make` 函数

`make` 函数是创建切片（以及 Map 和 Channel）的内置函数。它会分配一个底层数组，并返回一个指向该数组的切片

创建一个指定长度和容量（容量等于长度）的切片

```go
s := make([]int, 5) // len=5, cap=5, 结果是 [0 0 0 0 0]
```

创建一个指定长度和容量的切片

```go
s := make([]int, 3, 5) // len=3, cap=5, 结果是 [0 0 0]
```

预先指定容量可以在已知需要大量添加元素时，减少内存重新分配的次数，从而提高性能

与数组不同，切片是**引用类型**。当一个切片被赋值或传递时，传递的是其内部结构（指针、长度、容量）的副本，但**指针指向的底层数组是同一个**

```go
func modifySlice(s []int) {
    s[0] = 100 // 修改会影响原始切片
}

func main() {
    original := []int{1, 2, 3}
    modifySlice(original)
    fmt.Println(original) // 输出: [100 2 3]，原始切片被改变
}
```

#### `append` 函数与扩容

`append` 函数用于向切片末尾添加元素。这是一个非常重要的操作

```go
s := []int{1, 2}
s = append(s, 3, 4) // s 变为 [1 2 3 4]
```

如果 `append` 操作超出了切片的容量，Go 会自动进行扩容：它会分配一个新的、更大的底层数组，将旧数组的数据复制过去，然后添加新元素。由于可能发生底层数组的更换，`append` 函数会返回一个新的切片

因此，必须总是将 `append` 的结果重新赋值给原切片变量：`mySlice = append(mySlice, newValue)`

#### 切片排序

对切片进行排序，推荐使用 Go 1.21+ 引入的 `slices` 包

```go
package main

import (
    "fmt"
    "slices"
)

type Person struct {
    Name string
    Age  int
}

func main() {
    // 1. 排序基础类型
    nums := []int{3, 1, 4, 1, 5, 9}
    slices.Sort(nums)
    fmt.Println("排序后的数字:", nums) // [1 1 3 4 5 9]

    // 2. 排序结构体切片
    people := []Person{
        {"Alice", 30},
        {"Bob", 25},
        {"Charlie", 35},
    }

    // 使用 slices.SortFunc 提供自定义比较函数
    slices.SortFunc(people, func(a, b Person) int {
        if a.Age < b.Age {
            return -1 // a 排在 b 前面
        }
        if a.Age > b.Age {
            return 1 // b 排在 a 前面
        }
        return 0 // a 和 b 相等
    })
    fmt.Println("按年龄排序后:", people)
}
```

在旧版本 Go 中，通常使用 `sort` 包的 `sort.Ints` 或 `sort.Slice` 函数

#### Map

Map 是一个无序的、由 `key-value` 键值对组成的集合。Map 也常被称为哈希表或字典

#### 声明与创建

```go
// 声明一个 map，key 是 string 类型，value 是 int 类型
var m map[string]int

// 使用 make 函数创建一个空的 map (推荐)
// 只有 make 后的 map 才能开始存入键值对
m = make(map[string]int)

// 使用字面量直接创建并初始化
ages := map[string]int{
    "Alice": 30,
    "Bob":   25,
}
```

#### 基本操作

```go
ages := make(map[string]int)

// 存入或修改键值对
ages["Alice"] = 30
ages["Bob"] = 25
ages["Alice"] = 31 // 修改 Alice 的值

// 删除键值对
delete(ages, "Bob")

// 获取 map 的长度
fmt.Println(len(ages)) // 1
```

#### Map 取值

从 Map 中取值是一个有“陷阱”的操作。如果访问一个不存在的 key，你不会得到错误，而是会得到那个 value 类型的零值

```go
ages := map[string]int{"Alice": 30}
bobAge := ages["Bob"]
fmt.Println(bobAge) // 输出: 0 (int 的零值)
```

为了解决这个问题，Go 提供了 “comma, ok” 的取值范式

```go
// value, ok := myMap[key]
age, ok := ages["Bob"]

if ok {
    fmt.Println("Bob 的年龄是:", age)
} else {
    fmt.Println("查无此人 (Bob)")
}
```

- 如果 `key` 存在，`ok` 的值为 `true`，`value` 为对应的值
- 如果 `key` 不存在，`ok` 的值为 `false`，`value` 为该类型的零值

**这是从 Map 安全取值的标准做法**

#### 遍历 Map

使用 `for...range` 可以遍历 Map

```go
ages := map[string]int{"Alice": 30, "Bob": 25}

for name, age := range ages {
    fmt.Printf("%s 的年龄是 %d\n", name, age)
}
```

Map 的遍历顺序是完全随机的，Go 会在每次遍历时都随机化起始点。不要依赖 Map 的遍历顺序

### 流程控制

#### 条件语句 `if`

`if` 语句用于根据一个布尔表达式的值来决定是否执行某段代码，基本形式包括 `if`、`if-else` 和 `if-else if-else`

```go
package main

import "fmt"

func main() {
    score := 85

    // 基本 if
    if score >= 60 {
        fmt.Println("及格了")
    }

    // if-else
    if score >= 90 {
        fmt.Println("优秀")
    } else {
        fmt.Println("还有提升空间")
    }

    // if-else if-else
    if score >= 90 {
        fmt.Println("等级：A")
    } else if score >= 80 {
        fmt.Println("等级：B")
    } else if score >= 60 {
        fmt.Println("等级：C")
    } else {
        fmt.Println("等级：D")
    }
}
```

`if` 语句可以在条件判断之前包含一个初始化语句，由分号 `;` 分隔。这个初始化语句中声明的变量，其作用域仅限于整个 `if-else if-else` 代码块

```go
package main

import (
    "fmt"
    "io/ioutil"
)

func main() {
    // a. 常用在错误处理
    if content, err := ioutil.ReadFile("a.txt"); err != nil {
        // 'content' 和 'err' 变量只在 if-else 块中可见
        fmt.Println("读取文件失败:", err)
    } else {
        fmt.Printf("文件内容: %s\n", content)
    }

    // b. 在这里访问 content 或 err 会导致编译错误
    // fmt.Println(content) // undefined: content
}
```

好处：将变量的作用域限制在最小的必要范围内，使代码更清晰、更安全

#### 选择语句 `switch`

`switch` 语句提供了一种比 `if-else if` 链更清晰的方式来处理多路分支

1. 每个 `case` 分支在执行完毕后会自动终止，不会像 C 或 Java 那样“贯穿”到下一个 `case`
2. 如果想强制执行下一个 `case`，需要使用 `fallthrough` 关键字

```go
package main

import "fmt"

func main() {
    day := 3

    switch day {
    case 1:
        fmt.Println("星期一")
    case 2:
        fmt.Println("星期二")
    case 3:
        fmt.Println("星期三")
    case 4:
        fmt.Println("星期四")
    case 5:
        fmt.Println("星期五")
    default:
        fmt.Println("周末")
    }
}
```

`switch` 语句在 Go 中非常灵活，支持多种用法

1. 一个 `case` 匹配多个值

```go
finger := 3
switch finger {
case 1, 2, 3, 4, 5:
    fmt.Println("这是一个手指")
default:
    fmt.Println("输入有误")
}
```

2. 无表达式的 `switch`（替代 `if-else if`）
   `switch` 后面可以不跟任何变量或表达式。此时，`case` 后面跟的是布尔表达式。这种写法是实现复杂条件分支的绝佳方式，代码比 `if-else if` 更具可读性

```go
score := 85
switch { // 注意这里没有表达式
case score >= 90:
    fmt.Println("等级：A")
case score >= 80:
    fmt.Println("等级：B")
case score >= 60:
    fmt.Println("等级：C")
default:
    fmt.Println("等级：D")
}
```

3. 带初始化语句的 `switch`
   与 `if` 类似，`switch` 也支持初始化语句，声明的变量作用域仅限于 `switch` 块

```go
// 检查数字是奇数还是偶数
switch num := 7; num % 2 {
case 0:
    fmt.Printf("%d 是偶数\n", num)
case 1:
    fmt.Printf("%d 是奇数\n", num)
}
```

#### 循环语句 `for`

Go 语言**只有一种循环结构**，那就是 `for` 循环。但它通过不同的变体，可以实现其他语言中 `for`、`while`、`do-while` 等所有功能

最常见的形式，包含三个部分：初始化语句、条件表达式和后置语句

```go
// 打印 0 到 4
for i := 0; i < 5; i++ {
    fmt.Println(i)
}
```

省略初始化语句和后置语句，只保留条件表达式，就等同于其他语言的 `while` 循环

```go
n := 0
for n < 5 {
    fmt.Println(n)
    n++
}
```

省略所有部分，就构成了一个无限循环或“死循环”。它通常需要配合 `break` 或 `return` 来终止

```go
for {
    fmt.Println("这是一个无限循环，除非被 break...")
    // 在某个条件下跳出循环
    if someCondition {
        break
    }
}
```

Go 语言没有原生的 `do-while` 循环（即循环体至少执行一次）。但我们可以使用 `for` 的死循环轻松模拟

```go
// 模拟 do-while，确保循环体至少执行一次
i := 0
for {
    fmt.Println("循环体执行了", i+1, "次")
    i++
    if i >= 5 { // 退出条件在循环体末尾判断
        break
    }
}
```

`for-range` 是 Go 语言中用于遍历数组、切片、字符串、Map 和 Channel 的主要方式

1. 遍历数组/切片，会同时返回索引 `index` 和值 `value`

```go
nums := []int{10, 20, 30}
for index, value := range nums {
    fmt.Printf("索引: %d, 值: %d\n", index, value)
}

// 如果你不需要索引，可以使用空白标识符 _ 忽略
for _, value := range nums {
    fmt.Println(value)
}
```

2. 遍历 Map 会同时返回键 `key` 和值 `value`

```go
m := map[string]int{"a": 1, "b": 2}
for key, value := range m {
    fmt.Printf("键: %s, 值: %d\n", key, value)
}
```

#### 循环控制：`break` 和 `continue`

`break` 用于立即终止其所在的最内层的 `for`、`switch` 或 `select` 语句的执行

```go
for i := 0; i < 10; i++ {
    if i == 5 {
        break // 当 i 等于 5 时，循环立即停止
    }
    fmt.Println(i)
}
// 输出 0 1 2 3 4
```

`continue` 用于**跳过**本次循环中余下的代码，直接进入下一次循环

```go
for i := 0; i < 5; i++ {
    if i == 2 {
        continue // 当 i 等于 2 时，跳过本次循环的 fmt.Println
    }
    fmt.Println(i)
}
// 输出 0 1 3 4
```

#### 标签与 `goto` (扩展)

Go 支持使用标签配合 `break` 和 `continue` 来跳出或控制外层循环

```go
OuterLoop: // 定义一个标签
for i := 0; i < 3; i++ {
    for j := 0; j < 3; j++ {
        if i == 1 && j == 1 {
            break OuterLoop // 跳出外层循环
        }
        fmt.Printf("i=%d, j=%d\n", i, j)
    }
}
```

Go 也有 `goto` 语句，但它会使代码逻辑变得混乱，应极力避免使用。标签化的 `break` 和 `continue` 是处理复杂循环控制的更佳选择

### 函数（指针）

#### 函数定义

函数是一段封装了特定功能的、可重复使用的代码块。基本语法结构如下：

```go
func functionName(parameter1 type1, parameter2 type2) returnType {
    // 函数体: 实现功能的代码
    return value
}
```

- `func`：定义函数的关键字
- `functionName`：函数的名称，遵循驼峰命名法
- `(parameter1 type1, ...)`：参数列表。每个参数都有一个名称和一个类型。如果多个相邻参数类型相同，可以简写
- `returnType`：返回值类型。如果函数没有返回值，这里可以省略

```go
package main

import "fmt"

// add 函数接收两个 int 类型的参数，并返回一个 int 类型的结果
func add(x int, y int) int {
    return x + y
}

// 简写形式：如果参数类型相同
func subtract(x, y int) int {
    return x - y
}

// 没有返回值的函数
func greet(name string) {
    fmt.Println("你好,", name)
}

func main() {
    sum := add(10, 20)
    fmt.Println("和是:", sum) // 和是: 30

    greet("Go 语言") // 你好, Go 语言
}
```

#### 函数参数

参数是函数与外部世界交换数据的入口。Go 中参数的传递机制是理解函数行为的关键

值传递和引用传递是一组非常重要的概念，决定了函数内部对参数的修改是否会影响到函数外部的原始数据

- 值传递：函数接收的是原始数据的一个副本。在函数内部对这个副本的任何修改，都不会影响到原始数据
- 引用传递：函数接收的是原始数据在内存中的地址。在函数内部通过这个地址对数据的修改，会直接影响到原始数据

**Go 语言中所有参数传递都是值传递**，但是，这个规则需要结合数据类型来理解，因为某些类型（切片、Map、Channel）天生就带有引用的语义，对于基础类型和数组、结构体，它们是典型的值传递

```go
func modifyValue(val int) {
    val = 100 // 修改的是副本
}

func main() {
    num := 10
    modifyValue(num)
    fmt.Println(num) // 输出: 10，原始值未变
}
```

对于切片、Map、通道、函数，它们是引用类型。虽然它们本身也是通过值传递的，但传递的是它们内部结构的副本，这个副本中包含了一个指向底层数据结构的指针。因此，在函数内部对这些类型进行修改，会影响到原始数据，表现出类似“引用传递”的行为

```go
func modifySlice(s []int) {
    s[0] = 100 // 通过指针修改了底层数组
}

func main() {
    mySlice := []int{10, 20, 30}
    modifySlice(mySlice)
    fmt.Println(mySlice) // 输出: [100 20 30]，原始切片被修改
}
```

#### 指针

为了真正实现对任何类型（尤其是基础类型和结构体）的引用传递，我们需要使用指针。指针是一个存储了另一个变量内存地址的变量

- 获取地址 `&`：使用 `&` 操作符可以获取一个变量的内存地址
- 声明指针：指针类型是在原类型前加一个 `*`，例如 `*int` 是一个指向 `int` 类型的指针
- 解引用 `*`：使用 `*` 操作符可以获取指针指向地址上存储的值

```go
package main

import "fmt"

// 函数接收一个指向 int 类型的指针
func modifyByPointer(ptr *int) {
    // 通过解引用，修改指针指向地址上的值
    *ptr = 100
}

func main() {
    num := 10
    // 打印 num 的值和内存地址
    fmt.Printf("原始值: %d, 内存地址: %p\n", num, &num)
    // 将 num 的内存地址传递给函数
    modifyByPointer(&num)
    // 函数执行后，num 的值被改变
    fmt.Printf("修改后的值: %d\n", num) // 输出: 100
}
```

#### 函数返回值

Go 函数支持非常灵活的返回值机制

- 单返回值：最常见的形式
- 多返回值：一个函数可以返回多个值。这在 Go 中是处理错误的标准方式，通常最后一个返回值是 `error` 类型

```go
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("除数不能为零")
    }
    return a / b, nil // nil 表示没有错误
}

func main() {
    result, err := divide(10, 2)
    if err != nil {
        fmt.Println("错误:", err)
    } else {
        fmt.Println("结果:", result)
    }
}
```

- 命名返回值：可以为返回值预先命名。这些命名的变量在函数开始时被创建并初始化为零值，在函数体中可以直接对它们赋值。一个裸 `return` 语句会自动返回这些命名变量的当前值

```go
func calc(a, b int) (sum int, diff int) {
    sum = a + b
    diff = a - b
    return // 自动返回 sum 和 diff 的当前值
}
```

#### 匿名函数

没有函数名的函数。它通常在需要一个函数作为表达式的地方被定义和使用

```go
func main() {
    // 将一个匿名函数赋值给变量 add
    add := func(x, y int) int {
        return x + y
    }

    // 通过变量调用匿名函数
    sum := add(5, 3)
    fmt.Println(sum) // 8

    // 定义并立即执行
    func() {
        fmt.Println("我是一个立即执行的匿名函数")
    }()
}
```

#### 函数指针

Go 语言中没有像 C 语言那样的传统函数指针，但通过将函数赋值给变量，可以实现完全相同的效果。一个函数类型的变量就可以被看作是函数指针，允许你动态地改变调用的具体函数

```go
func add(x, y int) int { return x + y }
func subtract(x, y int) int { return x - y }

func main() {
    var op func(int, int) int // 声明一个函数类型的变量 op

    op = add
    fmt.Println(op(10, 5)) // 输出: 15

    op = subtract
    fmt.Println(op(10, 5)) // 输出: 5
}
```

#### 高阶函数

一个函数如果满足以下条件之一，就被称为高阶函数：

1. 接收一个或多个函数作为参数
2. 返回一个函数

```go
// operate 是一个高阶函数，它接收一个函数作为参数
func operate(a, b int, op func(int, int) int) int {
    return op(a, b)
}

func main() {
    result := operate(10, 5, add) // 将 add 函数作为参数传入
    fmt.Println(result) // 15
}
```

#### 闭包

闭包是一个函数值，它引用了其函数体之外的变量。简单来说，闭包 = 函数 + 其引用的外部环境

匿名函数常常形成闭包。闭包的强大之处在于，即使外部函数已经执行完毕返回了，闭包仍然可以访问和修改它所引用的外部变量

```go
// makeAdder 是一个高阶函数，它返回一个闭包
func makeAdder(x int) func(int) int {
    // 返回的匿名函数和它引用的变量 x 形成了一个闭包
    return func(y int) int {
        x += y // 闭包可以修改它引用的外部变量 x
        return x
    }
}

func main() {
    // adder5 是一个闭包，它内部的 x 初始值为 5
    adder5 := makeAdder(5)
    fmt.Println(adder5(2)) // 输出: 7 (x 变为 5+2=7)
    fmt.Println(adder5(3)) // 输出: 10 (x 变为 7+3=10)

    // adder10 是另一个独立的闭包，它内部的 x 初始值为 10
    adder10 := makeAdder(10)
    fmt.Println(adder10(2)) // 输出: 12 (x 变为 10+2=12)
}
```

### 特殊函数 `init` 与 `defer` 详解

在 Go 语言中，除了我们常规定义的函数外，还有两个由系统在特定时机自动调用的特殊函数：`init` 和 `defer`。`init` 函数用于包级别的初始化，而 `defer` 语句用于延迟函数的执行，是 Go 实现优雅资源管理的关键

#### 初始化函数 `init`

`init` 函数是一个用于在程序启动时执行初始化任务的特殊函数

1. 无参数，无返回值：`init` 函数的签名固定为 `func()`
2. 自动执行：它不能被代码手动调用，而是在包被导入时由 Go 运行时自动执行
3. 多个实例：同一个包（甚至同一个文件）中可以定义多个 `init` 函数，Go 会保证它们都会被执行

`init` 函数的执行时机在 Go 程序启动流程中非常明确：

1. 如果当前包 `A` 导入了另一个包 `B`，Go 会保证先将 `B` 包完全初始化（变量初始化 -> `init` 函数执行），然后再初始化 `A` 包
2. 在执行 `init` 函数之前，当前包内所有的全局变量会先被初始化
3. `init` 函数执行：包内所有的 `init` 函数被执行
4. `main` 函数执行：所有包的初始化完成后，才会执行 `main` 包的 `main` 函数

**多个 `init` 函数的执行顺序**：

- 在同一个文件中从上到下依次执行
- 在不同文件中 Go 会按照文件名的字典序（字母顺序）来依次执行不同文件中的 `init` 函数

开发者绝对不应该依赖多个 `init` 函数之间，特别是跨文件的执行顺序。这种依赖会让代码变得非常脆弱，因为文件名的任何改动都可能破坏预期的执行流程

`init` 函数的应用场景

1. 初始化包级变量：当全局变量的初始化逻辑比较复杂，无法在单行内完成时，可以使用 `init` 函数

```go
var config map[string]string

func init() {
    fmt.Println("init: 正在初始化配置...")
    // 模拟从文件或环境变量加载配置
    config = make(map[string]string)
    config["version"] = "1.0"
    config["env"] = "development"
}
```

2. 注册驱动或插件：这是 `init` 最经典的用途。通过导入一个包，利用其 `init` 函数的副作用来注册自身。最常见的例子就是数据库驱动

```go
import (
    "database/sql"
    // 空白标识符 _ 表示我们只导入这个包，
    // 以便执行其 init 函数进行驱动注册，
    // 但我们不会在代码中直接使用这个包的任何导出成员
    _ "github.com/go-sql-driver/mysql"
)
```

#### 延迟执行 `defer`

`defer` 是 Go 语言提供的一个关键字，用于将一个函数调用延迟到其所在的外层函数即将返回之前执行。核心特性是后进先出

如果一个函数内有多个 `defer` 语句，它们会被像叠盘子一样放入一个栈中。当外层函数准备返回时，这些延迟的调用会以后进先出的顺序被依次执行

```go
package main

import "fmt"

func main() {
    fmt.Println("函数开始")

    defer fmt.Println("第一个 defer (最后执行)")
    defer fmt.Println("第二个 defer")
    defer fmt.Println("第三个 defer (最先执行)")

    fmt.Println("函数即将结束")
}
```

输出结果：

```plain
函数开始
函数即将结束
第三个 defer (最先执行)
第二个 defer
第一个 defer (最后执行)
```

`defer` 后面跟的函数，其参数的值是在 `defer` 语句执行时就被确定下来的，而不是在最后延迟执行时才确定

```go
package main

import "fmt"

func main() {
    i := 0
    // 此时 i 的值是 0，defer 会将 0 这个值存起来
    defer fmt.Println("defer 打印的值:", i)

    i = 100
    fmt.Println("i 的最终值:", i)
}
```

**输出结果**：

```plain
i 的最终值: 100
defer 打印的值: 0
```

`defer` 的主要用途是确保资源被正确释放，无论函数是正常返回还是中途出错

将资源释放语句紧跟在资源获取语句之后，可以极大地提高代码的可读性，并有效防止忘记释放资源的 bug

```go
package main

import (
    "fmt"
    "os"
)

func readFile(filename string) {
    file, err := os.Open(filename)
    if err != nil {
        fmt.Println("打开文件失败:", err)
        return
    }
    // 立刻安排文件关闭操作，无论后续代码如何，它都会在函数返回前执行
    defer file.Close()

    // ... 进行文件读取等操作 ...
    fmt.Println("文件操作完成")
}
```

当一个函数发生 `panic`（恐慌）时，函数的执行会立即停止。但在退出之前，所有已注册的 `defer` 函数调用仍然会被正常执行。这个特性使得 `defer` 成为捕获和处理 `panic` 的理想场所。通过在 `defer` 中调用 `recover()` 内置函数，可以重新获得程序的控制权，避免程序崩溃

```go
package main

import "fmt"

func main() {
    defer func() {
        // recover() 只有在 defer 中调用时才有效
        if r := recover(); r != nil {
            fmt.Println("捕获到一个 panic:", r)
        }
    }()

    fmt.Println("准备触发 panic")
    panic("这是一个测试 panic")
    fmt.Println("这行代码不会被执行")
}
```

`defer` 语句可以读取和修改函数的命名返回值

```go
package main

import "fmt"

// result 是命名返回值
func double(n int) (result int) {
    defer func() {
        // 在函数返回前，将 result 的值乘以 2
        result *= 2
    }()
    return n
}

func main() {
    fmt.Println(double(5)) // 输出: 10
}
```

这个特性可以用于在函数返回前做一些统一的收尾工作或修改最终结果

### 结构体

结构体（`struct`）是 Go 语言中用于封装和组织数据的核心工具。它允许我们将不同类型的数据字段组合成一个单一的、有意义的复合类型

#### 结构体定义与使用

结构体是一种自定义的复合类型，用于将零个或多个任意类型的命名变量（字段）组合在一起

使用 `type` 和 `struct` 关键字来定义一个新的结构体类型

```go
package main

import "fmt"

// 定义一个 Person 结构体
type Person struct {
    Name   string
    Age    int
    City   string
}
```

有多种方式可以创建结构体的实例

1. 基本的 `var` 声明
   这将创建一个所有字段都为其零值的结构体实例

```go
var p1 Person
// p1.Name 是 "", p1.Age 是 0, p1.City 是 ""
```

2. 使用 `new()` 函数
   `new()` 函数会为结构体分配内存，并返回一个指向该实例的**指针**。字段同样是零值

```go
p2 := new(Person)
// p2 的类型是 *Person
```

3. 使用结构体字面量

- 键值对形式：明确指定字段名和对应的值，不依赖字段定义的顺序，可读性最好

```go
p3 := Person{
    Name: "Alice",
    Age:  30,
    City: "北京",
}
```

- 顺序形式：必须按照结构体定义中字段的顺序提供所有值。这种方式比较脆弱，如果未来结构体字段顺序改变，代码就会出错

```go
p4 := Person{"Bob", 25, "上海"}
```

使用点号 `.` 操作符来访问和修改结构体的字段

```go
p := Person{Name: "Charlie"}
fmt.Println(p.Name) // 输出: Charlie

p.Age = 40 // 修改 Age 字段
fmt.Println(p.Age) // 输出: 40
```

方法是附加到特定类型上的函数。通过为结构体定义方法，我们可以封装与该数据结构相关的行为。方法的定义与函数类似，但在 `func` 关键字和方法名之间有一个接收者 (receiver)

```go
// (p Person) 就是接收者
func (p Person) Greet() {
    fmt.Printf("你好，我是 %s，今年 %d 岁。\n", p.Name, p.Age)
}

func main() {
    p := Person{"David", 22, ""}
    p.Greet() // 调用方法
}
```

#### 结构体指针

在 Go 中，我们经常使用结构体指针，主要有两个原因：

1. 允许函数或方法修改原始结构体实例的值
2. 避免在函数调用时复制整个结构体，特别是对于大型结构体，可以提高性能

创建结构体指针

```go
// 方式一：使用 new()
p1 := new(Person)

// 方式二：对结构体字面量取地址 & (更常用)
p2 := &Person{Name: "Eva", Age: 28}
```

`p1` 和 `p2` 的类型都是 `*Person`（指向 Person 的指针）

指针接收者 vs 值接收者

为结构体定义方法时，接收者可以是值类型或指针类型

- 值接收者 `(p Person)`：方法操作的是结构体的副本。在方法内部对字段的任何修改都不会影响原始的结构体实例
- 指针接收者 `(p *Person)`：方法操作的是指向原始结构体实例的指针。在方法内部对字段的修改会影响原始实例

```go
// 值接收者，无法修改原始 Age
func (p Person) SetAgeValue(age int) {
    p.Age = age
}

// 指针接收者，可以修改原始 Age
func (p *Person) SetAgePointer(age int) {
    p.Age = age
}

func main() {
    p := Person{"Frank", 50, ""}

    p.SetAgeValue(55)
    fmt.Println(p.Age) // 输出: 50

    p.SetAgePointer(60)
    fmt.Println(p.Age) // 输出: 60
}
```

如果方法需要修改接收者的状态，或者结构体本身很大，应优先使用指针接收者

Go 语言提供了一个便利特性：当你有一个结构体指针时，可以直接用点号 `.` 来访问其字段，而无需像 C 语言中那样进行解引用（`(*p).FieldName`）

```go
p := &Person{Name: "Grace", Age: 35}

// Go 允许直接这样写，非常方便
fmt.Println(p.Name)

// 它等同于下面的标准写法
fmt.Println((*p).Name)
```

#### 匿名字段与“继承”

Go 语言没有传统面向对象语言（如 Java, C++）中的继承概念。Go 通过类型嵌入（匿名字段）来实现代码的复用和组合，这种模式有时被称为组合优于继承

**类型嵌入**：在结构体中只指定一个类型而没有字段名

```go
// Animal 结构体
type Animal struct {
    Name string
}

func (a *Animal) Move() {
    fmt.Printf("%s 在移动...\n", a.Name)
}

// Dog 结构体，嵌入了 Animal
type Dog struct {
    Animal // 匿名字段，实现了“继承”
    Breed  string
}

func main() {
    d := Dog{
        Animal: Animal{Name: "旺财"},
        Breed:  "哈士奇",
    }

    // Dog 结构体“继承”了 Animal 的字段和方法
    fmt.Println(d.Name)   // 直接访问 Name 字段
    d.Move()              // 直接调用 Move 方法

    // 也可以通过类型名访问
    fmt.Println(d.Animal.Name)
}
```

通过嵌入，`Dog` 结构体“提升”了 `Animal` 的所有字段和方法，使得我们可以直接在 `Dog` 实例上访问它们，从而达到了类似继承的效果

#### 结构体标签

结构体标签是附加在结构体字段后的一个字符串字面量，使用反引号 `` ` `` 包裹

标签是用来为字段添加元数据的。这些元数据在程序运行时，可以被 `reflect` 包读取，从而影响某些库（如 `encoding/json`、ORM 框架等）的行为

标签的格式通常是 `key:"value"` 的键值对字符串。多个键值对用空格隔开

```go
type User struct {
    ID   int    `json:"id" db:"user_id"`
    Name string `json:"name"`
}
```

`json` 标签是结构体标签最常见和最实用的一个例子，它由标准库 `encoding/json` 使用，用于控制结构体和 JSON 数据之间的转换

常用 `json` 标签选项：

1. 重命名字段 `json:"field_name"`：将 Go 结构体中的 `CamelCase` 字段名映射为 JSON 中的 `snake_case` 或其他格式
2. 忽略字段 `json:"-"`：在 JSON 转换过程中完全忽略该字段
3. 忽略空值字段 `json:"field_name,omitempty"`：如果字段的值是其类型的零值（如 0, "", false, nil），则在生成 JSON 时忽略该字段

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Product struct {
    ProductID   int      `json:"product_id"`
    Name        string   `json:"name"`
    Price       float64  `json:"price"`
    Description string   `json:"description,omitempty"` // 如果为空则忽略
    Password    string   `json:"-"`                   // 始终忽略
    Tags        []string `json:"tags"`
}

func main() {
    p1 := Product{
        ProductID: 101,
        Name:      "Go 编程语言",
        Price:     99.9,
        Password:  "secret",
        Tags:      []string{"tech", "programming"},
    }

    // 将结构体编码为 JSON (Marshal)
    jsonData, err := json.Marshal(p1)
    if err != nil {
        fmt.Println("JSON marshal error:", err)
        return
    }

    fmt.Println(string(jsonData))
}
```

**输出结果**：

```json
{
  "product_id": 101,
  "name": "Go 编程语言",
  "price": 99.9,
  "tags": ["tech", "programming"]
}
```

可以看到，`ProductID` 被重命名为 `product_id`，`Description` 因为是空值而被忽略，`Password` 字段被完全跳过

### 接口

接口（Interface）是 Go 语言的精髓和最强大的特性之一。它是一种抽象类型，通过定义一组方法签名来规范对象的行为

#### 接口的定义与实现

接口类型是一种抽象的类型，它定义了一组方法的集合。如果一个具体类型实现了接口中的所有方法，那么它就被称为“实现了”这个接口

使用 `type` 和 `interface` 关键字来定义一个新的接口

```go
package main

import "fmt"

// 定义一个 Notifier (通知器) 接口
// 任何类型，只要它有一个签名为 Notify(message string) 的方法，就自动实现了这个接口
type Notifier interface {
    Notify(message string)
}
```

这是 Go 接口与其他语言（如 Java, C#）最核心的区别。Go 语言没有 `implements` 关键字。一个类型是否实现了一个接口，完全取决于它是否实现了接口要求的所有方法。这种方式被称为“隐式实现”或“鸭子类型”

```go
// 定义 EmailNotifier 类型
type EmailNotifier struct {
    EmailAddress string
}

// 为 EmailNotifier 实现 Notify 方法，它就自动实现了 Notifier 接口
func (e EmailNotifier) Notify(message string) {
    fmt.Printf("发送邮件到 %s: %s\n", e.EmailAddress, message)
}

// 定义 SMSNotifier 类型
type SMSNotifier struct {
    PhoneNumber string
}

// 为 SMSNotifier 实现 Notify 方法，它也自动实现了 Notifier 接口
func (s SMSNotifier) Notify(message string) {
    fmt.Printf("发送短信到 %s: %s\n", s.PhoneNumber, message)
}
```

接口的主要用途是实现多态——编写能够处理多种不同类型对象的通用代码

```go
// 这个函数可以接受任何实现了 Notifier 接口的类型作为参数
func SendNotification(n Notifier, message string) {
    n.Notify(message)
}

func main() {
    email := EmailNotifier{EmailAddress: "test@example.com"}
    sms := SMSNotifier{PhoneNumber: "13800138000"}

    SendNotification(email, "您的账户已登录")
    SendNotification(sms, "您的验证码是 123456")
}
```

**输出结果**：

```plain
发送邮件到 test@example.com: 您的账户已登录
发送短信到 13800138000: 您的验证码是 123456
```

#### 空接口 `any`

一个不包含任何方法的接口被称为空接口。在 Go 1.18 之前，它写作 `interface{}`，从 Go 1.18 开始，引入了一个更清晰的别名 `any`

```go
type Any interface{} // 任何类型都实现了这个接口
// 等价于 var i any
```

因为空接口没有任何方法需要实现，所以 Go 语言中的任何类型都默认实现了空接口。这意味着，一个类型为 `any` 的变量可以用来存储任意类型的值

```go
var i any

i = 42
fmt.Printf("类型: %T, 值: %v\n", i, i) // 类型: int, 值: 42

i = "hello"
fmt.Printf("类型: %T, 值: %v\n", i, i) // 类型: string, 值: hello

i = EmailNotifier{}
fmt.Printf("类型: %T, 值: %v\n", i, i) // 类型: main.EmailNotifier, 值: {}
```

当一个值被存入 `any` 类型的变量时，我们丢失了它的原始静态类型信息。为了再次使用这个值，我们需要将其从接口中“取”出来，恢复其原始类型。这个过程就是类型断言

#### 类型断言

类型断言是一个用于检查接口变量中存储的具体值类型的机制，并可以将该值转换为其原始的具体类型

`value, ok := i.(TypeName)`，这种方式不会在断言失败时导致程序崩溃

- `i`：一个接口类型的变量
- `TypeName`：你猜测 `i` 中存储的具体类型
- `value`：如果断言成功，`value` 就是转换后 `TypeName` 类型的值
- `ok`：如果断言成功，`ok` 为 `true`；如果断言失败（即 `i` 中存储的不是 `TypeName`），`ok` 为 `false`

```go
func process(i any) {
    // 尝试将 i 断言为 string 类型
    s, ok := i.(string)
    if ok {
        fmt.Printf("这是一个字符串: %s\n", s)
        return
    }

    // 尝试将 i 断言为 int 类型
    n, ok := i.(int)
    if ok {
        fmt.Printf("这是一个整数，它的平方是: %d\n", n*n)
        return
    }

    fmt.Printf("不支持的类型: %T\n", i)
}

func main() {
    process("hello")
    process(10)
    process(true)
}
```

**输出结果**：

```plain
这是一个字符串: hello
这是一个整数，它的平方是: 100
不支持的类型: bool
```

`value := i.(TypeName)`：非安全的类型断言

这种形式只返回一个值。它会假设百分之百确定接口 `i` 中存储的就是 `TypeName` 类型。如果断言失败，这种方式会立即触发一个 `panic`，导致程序崩溃

#### `Type Switch` 类型选择

当需要判断一个接口变量可能是多种类型中的哪一种时，`Type Switch` 是比一长串 `if-else` 更优雅、更强大的选择

**示例**：

```go
func processWithTypeSwitch(i any) {
    switch v := i.(type) {
    case string:
        fmt.Printf("这是一个字符串: %s\n", v)
    case int:
        fmt.Printf("这是一个整数，它的平方是: %d\n", v*v)
    case bool:
        fmt.Printf("这是一个布尔值: %t\n", v)
    default:
        fmt.Printf("不支持的类型: %T，值为 %v\n", v, v)
    }
}

func main() {
    processWithTypeSwitch("hello")
    processWithTypeSwitch(10)
    processWithTypeSwitch(true)
    processWithTypeSwitch(3.14)
}
```

**输出结果**：

```plain
这是一个字符串: hello
这是一个整数，它的平方是: 100
这是一个布尔值: true
不支持的类型: float64，值为 3.14
```

### 协程、Channel、并发和锁

Go 的并发能力主要围绕几个核心概念展开：

- `goroutine`：轻量级并发执行单元
- `sync.WaitGroup`：等待一组协程执行结束
- `channel`：在协程之间传递数据
- `select`：同时监听多个 Channel 操作
- `sync.Mutex`、`sync.RWMutex`：保护共享资源，避免数据竞争

#### Goroutine

Goroutine 是 Go 运行时管理的轻量级执行单元。和传统线程相比，它的创建成本更低、占用内存更小，也更适合大量并发任务

启动一个 Goroutine 只需要在函数调用前加上 `go` 关键字

```go
package main

import (
    "fmt"
    "time"
)

func say(s string) {
    for i := 0; i < 3; i++ {
        fmt.Println(s)
        time.Sleep(100 * time.Millisecond)
    }
}

func main() {
    // 启动一个新的 Goroutine 来执行 say("World")
    go say("World")

    // main 函数自身也是一个 Goroutine
    say("Hello")
}
```

输出结果通常是交错的，因为两个 Goroutine 会并发执行：

```plain
Hello
World
Hello
World
World
Hello
```

需要注意的是，`main` 函数结束后，程序会直接退出，不会等待其他 Goroutine 自动完成。因此，实际开发里通常要配合同步工具一起使用

#### `sync.WaitGroup`

`sync.WaitGroup` 用来等待一组 Goroutine 执行结束。它内部维护一个计数器，常用方法有：

- `Add(delta int)`：将计数器增加 `delta`。通常在启动 Goroutine 前调用
- `Done()`：将计数器减 1。通常在 Goroutine 执行结束时，通过 `defer` 调用
- `Wait()`：阻塞当前 Goroutine，直到计数器归零

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, wg *sync.WaitGroup) {
    // 在函数退出时，通知 WaitGroup 任务完成
    defer wg.Done()

    fmt.Printf("工人 %d 开始工作\n", id)
    time.Sleep(time.Second) // 模拟工作
    fmt.Printf("工人 %d 完成工作\n", id)
}

func main() {
    var wg sync.WaitGroup

    for i := 1; i <= 3; i++ {
        // 每启动一个 Goroutine，计数器加 1
        wg.Add(1)
        go worker(i, &wg)
    }

    // 等待所有 Goroutine 完成（即计数器归零）
    wg.Wait()

    fmt.Println("所有工人都已完成工作！")
}
```

#### Channel

Go 有一句很经典的话：

> 不要通过共享内存来通信，而要通过通信来共享内存

Channel 就是这个思想的核心工具。它本质上是一个类型化管道，可以在不同 Goroutine 之间安全地发送和接收数据

- 创建 Channel：使用 `make`

```go
// 创建一个能传输 int 类型的无缓冲 Channel
ch := make(chan int)

// 创建一个容量为 3 的、能传输 string 类型的缓冲 Channel
chBuffered := make(chan string, 3)
```

- 发送数据：使用 `<-`

```go
ch <- 10 // 将 10 发送到 ch
```

- 接收数据：使用 `<-`

```go
value := <-ch // 从 ch 接收数据并赋值给 value
```

Channel 的阻塞特性很重要：

- 对无缓冲 Channel 来说，发送和接收必须配对，否则会阻塞
- 对缓冲 Channel 来说，发送在缓冲区满时阻塞，接收在缓冲区空时阻塞

```go
package main

import "fmt"

func main() {
    messages := make(chan string)

    go func() {
        // 发送消息到 channel
        messages <- "ping"
    }()

    // 从 channel 接收消息
    msg := <-messages
    fmt.Println(msg) // 输出: ping
}
```

- `close(ch)`：关闭 Channel，表示后续不会再发送数据
- `for...range`：持续接收数据，直到 Channel 被关闭

```go
func producer(ch chan int) {
    for i := 0; i < 5; i++ {
        ch <- i
    }
    close(ch) // 完成生产后关闭 channel
}

func main() {
    ch := make(chan int)
    go producer(ch)

    // for...range 会自动处理 channel 的接收，直到它被关闭
    for value := range ch {
        fmt.Println(value)
    }
}
```

关闭 Channel 时有两个常见规则：

- 应由发送方关闭 Channel，而不是接收方
- 不要重复关闭同一个 Channel，否则会触发 `panic`

#### `select`

`select` 可以同时监听多个 Channel 操作。它和 `switch` 很像，但每个 `case` 都是一次 Channel 收发

基本规则：

- 如果多个 `case` 都可以立即执行，`select` 会**随机选择一个**执行
- 如果没有 `case` 可以执行（即所有 Channel 操作都会阻塞），`select` 会阻塞，直到其中一个 `case` 可以执行
- 可以使用 `default` 子句来实现非阻塞的 `select`

示例：

```go
c1 := make(chan string)
c2 := make(chan string)

go func() {
    time.Sleep(1 * time.Second)
    c1 <- "one"
}()
go func() {
    time.Sleep(2 * time.Second)
    c2 <- "two"
}()

// select 会等待 c1 和 c2 中最先准备好的那个
for i := 0; i < 2; i++ {
    select {
    case msg1 := <-c1:
        fmt.Println("received", msg1)
    case msg2 := <-c2:
        fmt.Println("received", msg2)
    }
}
```

#### 超时处理

`select` 一个很常见的用途是做超时控制。配合 `time.After`，可以在等待结果的同时设置截止时间

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    ch := make(chan string, 1)

    go func() {
        // 模拟一个耗时2秒的操作
        time.Sleep(2 * time.Second)
        ch <- "操作完成"
    }()

    select {
    case res := <-ch:
        fmt.Println(res)
    case <-time.After(1 * time.Second): // 设置1秒的超时
        fmt.Println("超时！操作未在1秒内完成。")
    }
}
```

这个例子里，协程需要 2 秒才会返回结果，但超时时间只设置了 1 秒，所以最终会进入超时分支

### 并发安全与同步锁

并发带来性能和吞吐量的提升，但只要多个 Goroutine 同时访问同一份共享数据，就必须考虑并发安全问题

#### 竞态条件和并发安全

当多个 Goroutine 并发访问同一个共享资源，并且其中至少有一个在写，就可能出现竞态条件（Race Condition）

并发安全的意思是：同一段代码被多个 Goroutine 同时执行时，依然能得到正确、稳定、可预测的结果

下面这个并发计数器就有明显的竞态问题：

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    var wg sync.WaitGroup
    counter := 0

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            // 这里存在竞态条件！
            // 操作 "counter++" 并非原子操作，它包含三个步骤：
            // 1. 读取 counter 的值
            // 2. 将值加 1
            // 3. 将新值写回 counter
            counter++
        }()
    }

    wg.Wait()
    fmt.Println("最终计数:", counter)
}
```

`counter++` 不是原子操作，它至少包含这几个步骤：

- 读取 `counter`
- 计算 `counter + 1`
- 把新值写回去

多个 Goroutine 同时执行时，就可能互相覆盖结果，所以最终计数通常小于 `1000`

#### Go 竞态检测器

Go 自带竞态检测器，运行程序时加上 `-race` 即可：

```shell
go run -race your_program.go
```

对上面的例子使用竞态检测器，它会立刻报告检测到了数据竞争

#### 同步锁

要解决竞态条件，常见做法就是加锁，确保共享资源在同一时刻只被允许的协程访问

#### `sync.Mutex`

`sync.Mutex` 是最常用的互斥锁。它提供两个核心方法：

- `Lock()`：获取锁。如果锁已被占用，则调用此方法的 Goroutine 会被**阻塞**，直到可以获取锁为止
- `Unlock()`：释放锁

用 `Mutex` 修复上面的计数器：

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    var wg sync.WaitGroup
    var mu sync.Mutex // 声明一个互斥锁
    counter := 0

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()

            // 在访问共享资源前，先获取锁
            mu.Lock()
            counter++
            // 访问结束后，释放锁
            mu.Unlock()
        }()
    }

    wg.Wait()
    fmt.Println("最终计数:", counter) // 输出: 1000
}
```

如果 `Lock()` 和 `Unlock()` 之间有多条返回路径，或者中途发生 `panic`，手动释放锁就容易遗漏。更稳妥的写法是用 `defer`：

```go
go func() {
    defer wg.Done()
    mu.Lock()
    defer mu.Unlock() // 确保在函数退出时，锁一定会被释放

    // ... 执行受保护的操作 ...
}()
```

#### `sync.RWMutex`

如果场景是“读多写少”，`sync.Mutex` 就显得有些保守，因为它会让所有读操作也互斥执行

`sync.RWMutex` 对这种情况做了优化：

- 多个读操作可以同时持有读锁
- 写操作必须独占写锁
- 只要有写锁，读和写都会被阻塞

常用方法有：

- `RLock()` / `RUnlock()`：用于获取和释放**读锁**
- `Lock()` / `Unlock()`：用于获取和释放**写锁**

它适合读远多于写的场景，比如全局配置、缓存元数据等

### 线程安全的 Map

Go 内置的 `map` 不是线程安全的。多个 Goroutine 同时读写同一个 `map`，程序可能直接 `panic`

常见做法有两种

#### `map` + `sync.RWMutex`

这是最常见、最通用的方案：把 `map` 和读写锁封装到一个结构体里

```go
package main

import "sync"

// ConcurrentMap 是一个线程安全的 map[string]any
type ConcurrentMap struct {
    mu   sync.RWMutex
    data map[string]any
}

func NewConcurrentMap() *ConcurrentMap {
    return &ConcurrentMap{
        data: make(map[string]any),
    }
}

// Set 写入数据
func (m *ConcurrentMap) Set(key string, value any) {
    m.mu.Lock() // 使用写锁
    defer m.mu.Unlock()
    m.data[key] = value
}

// Get 读取数据
func (m *ConcurrentMap) Get(key string) (any, bool) {
    m.mu.RLock() // 使用读锁
    defer m.mu.RUnlock()
    value, ok := m.data[key]
    return value, ok
}
```

这种方式的优点：

- 简单直观，易于理解
- 性能在大多数通用场景下都很好
- 可以根据需要添加自定义的复杂逻辑

#### `sync.Map`

Go 1.9 之后，标准库提供了 `sync.Map`，它是一个专门面向并发场景设计的 Map 类型

但它不是 `map + RWMutex` 的通用替代品，主要针对两类场景做了优化：

1. 当一个 key 第一次被写入后，后续大部分是对该 key 的**读操作**或**更新操作**，很少有删除
2. 当多个 Goroutine 并发地读、写、修改**不相交**的 key 集合时

常用方法：

- `Store(key, value any)`：存储键值对
- `Load(key any) (value any, ok bool)`：读取键值对
- `Delete(key any)`：删除键
- `Range(f func(key, value any) bool)`：遍历 Map

**示例**：

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    var m sync.Map
    var wg sync.WaitGroup

    // 并发写入
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(n int) {
            defer wg.Done()
            m.Store(n, n*n)
        }(i)
    }
    wg.Wait()

    // 读取
    if val, ok := m.Load(5); ok {
        fmt.Printf("key=5, value=%d\n", val)
    }

    // 遍历
    m.Range(func(key, value any) bool {
        fmt.Printf("遍历: key=%v, value=%v\n", key, value)
        return true // 返回 true 以继续遍历
    })
}
```

- 如果不确定，或者你的使用场景是通用的读写，**优先使用 `map + sync.RWMutex`**，因为它的语义更清晰
- 如果你的场景完全符合 `sync.Map` 优化的那两种特定情况（如一次写入、多次读取的缓存），那么使用 `sync.Map` 可能会获得更好的性能

### 异常处理和 Panic 机制

Go 的错误处理和很多语言不一样。它没有把普通错误统一交给 `try-catch`，而是把错误当作返回值显式处理

一般可以这样理解：

- 可预期的失败：使用 `error`
- 真正异常的情况：使用 `panic`

#### `error` 接口

Go 内置了一个极其简单的 `error` 接口：

```go
type error interface {
    Error() string
}
```

任何实现了 `Error() string` 方法的类型，都可以作为 `error` 使用

#### 标准错误处理模式

Go 里的标准写法是把 `error` 放在返回值最后，然后立刻检查它是否为 `nil`

```go
if err != nil {
    return err
}
```

示例：

```go
package main

import (
    "errors"
    "fmt"
)

func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("除数不能为零")
    }
    return a / b, nil
}

func main() {
    result, err := divide(10, 0)
    if err != nil {
        fmt.Println("发生错误:", err)
        return
    }
    fmt.Println("结果是:", result)
}
```

#### 错误传递和包装

如果当前函数自己处理不了错误，最常见的做法就是把错误继续向上返回

- 直接返回：把原始错误继续返回给调用方
- 错误包装：补充上下文信息后再返回

`fmt.Errorf` 配合 `%w` 可以把底层错误包装起来，形成错误链

```go
package main

import (
    "errors"
    "fmt"
    "os"
)

func readConfig() ([]byte, error) {
    content, err := os.ReadFile("config.yaml")
    if err != nil {
        return nil, fmt.Errorf("读取配置文件失败: %w", err)
    }
    return content, nil
}

func main() {
    _, err := readConfig()
    if err != nil {
        fmt.Println(err)

        if errors.Is(err, os.ErrNotExist) {
            fmt.Println("提示：配置文件不存在。")
        }
    }
}
```

- `fmt.Errorf("...", %w, ...)`：包装错误
- `errors.Is(err, target)`：判断错误链中是否包含某个目标错误
- `errors.As(err, &target)`：判断错误链中是否包含某种具体错误类型

#### `panic` 和 `recover`

和普通的 `error` 不同，`panic` 表示程序遇到了不应该发生的异常情况

`panic` 的特点：

- 会立刻中断当前函数的正常执行
- 已经注册的 `defer` 仍然会执行
- 如果没有被恢复，最终会导致程序崩溃并打印堆栈

`recover` 用来拦截 `panic`，但只有在 `defer` 中直接调用才生效

常见模式如下：

```go
package main

import "fmt"

func safeDivide(a, b int) int {
    defer func() {
        if r := recover(); r != nil {
            fmt.Printf("捕获到 panic 并恢复: %v\n", r)
        }
    }()

    fmt.Println("准备执行除法...")
    result := a / b
    return result
}

func main() {
    result := safeDivide(10, 0)
    fmt.Println("safeDivide 执行完毕，返回值为:", result)
    fmt.Println("程序正常继续执行...")
}
```

**输出结果**：

```plain
准备执行除法...
捕获到 panic 并恢复: runtime error: integer divide by zero
safeDivide 执行完毕，返回值为: 0
程序正常继续执行...
```

`panic/recover` 常见于这类场景：

- 在一个包的内部，用于从灾难性的错误中恢复，但对外依然返回一个 `error`
- 在一个 Web 服务器或后台任务中，防止某个请求处理中的 Goroutine 意外崩溃而导致整个服务进程退出

#### `error` 和 `panic` 的区别

- `error`：用于处理可预期的失败，例如文件不存在、网络超时、参数不合法
- `panic`：用于处理程序内部的严重问题，例如越界、空指针、明显的逻辑错误
- 日常业务代码里，优先返回 `error`

### 泛型

泛型允许你把“类型”也当成参数传进去，这样一套逻辑就能复用到多种类型上

#### 基本泛型函数

最常见的用法就是写一个可以处理任意类型的函数：

```go
package main

import "fmt"

func PrintSlice[T any](s []T) {
    for _, v := range s {
        fmt.Printf("%v ", v)
    }
    fmt.Println()
}

func main() {
    intSlice := []int{1, 2, 3}
    stringSlice := []string{"hello", "world"}

    PrintSlice(intSlice)      // 输出: 1 2 3
    PrintSlice(stringSlice) // 输出: hello world
}
```

#### 带约束的泛型函数

有些泛型函数不是“任何类型都行”。比如要比较大小，那么类型参数就必须支持 `<` 或 `>`

```go
package main

import "fmt"

type Ordered interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64 |
        ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
        ~float32 | ~float64 |
        ~string
}

func Min[T Ordered](a, b T) T {
    if a < b {
        return a
    }
    return b
}

func main() {
    fmt.Println(Min(10, 20))       // 输出: 10
    fmt.Println(Min(3.14, 2.71))  // 输出: 2.71
    fmt.Println(Min("apple", "banana")) // 输出: apple
}
```

约束的作用可以简单理解为：先限制类型集合，再在这个集合上写通用逻辑

#### 泛型结构体

泛型也可以用于结构体，这样可以写出可复用的数据结构

```go
package main

import "fmt"

type Stack[T any] struct {
    items []T
}

// Push 将一个元素压入栈顶
func (s *Stack[T]) Push(item T) {
    s.items = append(s.items, item)
}

// Pop 从栈顶弹出一个元素
func (s *Stack[T]) Pop() (T, bool) {
    if len(s.items) == 0 {
        var zero T // T 类型的零值
        return zero, false
    }
    item := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return item, true
}

func main() {
    // 创建一个 int 类型的栈
    intStack := &Stack[int]{}
    intStack.Push(10)
    intStack.Push(20)
    val, _ := intStack.Pop()
    fmt.Println(val) // 输出: 20

    // 创建一个 string 类型的栈
    stringStack := &Stack[string]{}
    stringStack.Push("first")
    stringStack.Push("second")
    valStr, _ := stringStack.Pop()
    fmt.Println(valStr) // 输出: second
}
```

#### 泛型切片

`[]T` 本身就是泛型切片的表达方式。实际使用里，更多是写“能处理任意切片”的函数

```go
func Map[T, U any](s []T, f func(T) U) []U {
    result := make([]U, len(s))
    for i, v := range s {
        result[i] = f(v)
    }
    return result
}

func main() {
    // 将 int 切片转换为 string 切片
    nums := []int{1, 2, 3}
    strs := Map(nums, func(n int) string {
        return "v" + strconv.Itoa(n)
    })
    fmt.Println(strs) // 输出: [v1 v2 v3]
}
```

如果只是做常见切片操作，实际项目里优先考虑标准库 `slices` 包，例如：

- `slices.Index()`：查找元素索引
- `slices.Contains()`：检查是否包含某个元素
- `slices.Sort()`：排序
- `slices.Delete()`：删除元素

能直接用标准库时，通常没必要自己再造一套

#### 泛型 Map

和切片一样，`map[K]V` 天然就带有类型参数。泛型常见的用法是写一些通用辅助函数

```go
func Keys[K comparable, V any](m map[K]V) []K {
    keys := make([]K, 0, len(m))
    for k := range m {
        keys = append(keys, k)
    }
    return keys
}

func main() {
    ages := map[string]int{
        "Alice": 30,
        "Bob":   25,
    }
    names := Keys(ages)
    fmt.Println(names) // 输出: [Alice Bob] (顺序不保证)
}
```

常见 Map 工具也可以优先看标准库 `maps` 包，例如：

- `maps.Keys()`：获取所有键
- `maps.Values()`：获取所有值
- `maps.Clone()`：克隆 Map
- `maps.Copy()`：拷贝 Map
- `maps.Equal()`：比较两个 Map 是否相等

如果需求只是常规增删改查或简单转换，直接用这些现成能力会更省事

### 文件与目录操作

这一部分主要覆盖文件读写、目录管理和常见文件操作

#### 文件读取

##### 一次性读取

如果文件比较小，最简单的方式就是一次性读入内存。现在更推荐使用 `os.ReadFile`

```go
package main

import (
    "fmt"
    "os"
)

func main() {
    // Go 1.16+
    content, err := os.ReadFile("test.txt")
    if err != nil {
        panic(err)
    }
    fmt.Println(string(content))
}
```

##### 分片读取

如果文件很大，一次性读入内存不合适，更稳妥的方式是按块读取

```go
package main

import (
    "fmt"
    "io"
    "os"
)

func main() {
    file, err := os.Open("large.txt")
    if err != nil {
        panic(err)
    }
    defer file.Close()

    // 创建一个缓冲区（切片）
    buffer := make([]byte, 1024) // 每次读取 1KB

    for {
        // file.Read 将文件内容读入缓冲区
        n, err := file.Read(buffer)
        if err == io.EOF { // io.EOF 表示文件已读完
            break
        }
        if err != nil {
            panic(err)
        }
        // 只处理实际读取到的 n 个字节
        fmt.Print(string(buffer[:n]))
    }
}
```

##### 带缓冲读取

`bufio` 提供了带缓冲的读写方式，按行读取时通常更方便

```go
package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    file, err := os.Open("test.txt")
    if err != nil {
        panic(err)
    }
    defer file.Close()

    scanner := bufio.NewScanner(file)
    // scanner.Scan() 每次读取一行
    for scanner.Scan() {
        fmt.Println(scanner.Text()) // scanner.Text() 获取当前行的内容
    }

    if err := scanner.Err(); err != nil {
        panic(err)
    }
}
```

#### 获取当前 Go 文件的路径

有些场景下需要定位当前源文件的位置，比如推导项目根目录。这时通常会用到 `runtime` 和 `path/filepath`

```go
package main

import (
    "fmt"
    "path/filepath"
    "runtime"
)

func main() {
    // runtime.Caller(0) 返回当前 goroutine 的栈信息，包括文件名、行号等
    _, filename, _, ok := runtime.Caller(0)
    if !ok {
        panic("无法获取当前文件路径")
    }

    // filename 是包含文件名的完整路径
    fmt.Println("当前文件完整路径:", filename)

    // 获取文件所在的目录
    dir := filepath.Dir(filename)
    fmt.Println("当前文件所在目录:", dir)
}
```

#### 文件写入

##### 一次性写入

小文件写入一般直接用 `os.WriteFile`

文件权限使用八进制表示，常见值有：

- `0666`: 所有用户可读可写
- `0644`: 文件所有者可读可写，其他用户只读（Web 服务器常用）
- `0755`: 文件所有者可读可写可执行，其他用户可读可执行（脚本文件常用）

```go
package main

import (
    "os"
)

func main() {
    content := []byte("Hello, Go!")
    // 将 content 写入 test_write.txt 文件，如果文件不存在则创建，
    // 权限设置为 0644。
    err := os.WriteFile("test_write.txt", content, 0644)
    if err != nil {
        panic(err)
    }
}
```

##### 文件打开方式

如果要做追加、截断、只写等更细粒度控制，就用 `os.OpenFile`。它通过 `flag` 参数决定打开方式，多个标志可以用 `|` 组合

常见 `flag`：

- `os.O_WRONLY`: 只写模式
- `os.O_CREATE`: 如果文件不存在则创建
- `os.O_TRUNC`: 打开时清空文件内容
- `os.O_APPEND`: 追加内容到文件末尾

```go
package main

import (
    "os"
)

func main() {
    // 以追加模式打开文件，如果不存在则创建
    filePath := "log.txt"
    flag := os.O_WRONLY | os.O_CREATE | os.O_APPEND
    file, err := os.OpenFile(filePath, flag, 0644)
    if err != nil {
        panic(err)
    }
    defer file.Close()

    // 写入内容
    _, err = file.WriteString("这是一条新的日志记录\n")
    if err != nil {
        panic(err)
    }
}
```

#### 文件复制

复制文件最常见的写法是 `io.Copy`，它适合大文件，也不用自己手动循环搬运字节

```go
package main

import (
    "fmt"
    "io"
    "os"
)

func main() {
    // 1. 打开源文件
    srcFile, err := os.Open("source.txt")
    if err != nil {
        panic(err)
    }
    defer srcFile.Close()

    // 2. 创建目标文件
    dstFile, err := os.Create("destination.txt")
    if err != nil {
        panic(err)
    }
    defer dstFile.Close()

    // 3. 使用 io.Copy 进行复制
    bytesCopied, err := io.Copy(dstFile, srcFile)
    if err != nil {
        panic(err)
    }
    fmt.Printf("成功复制了 %d 字节\n", bytesCopied)
}
```

#### 目录操作

##### 创建目录

- `os.Mkdir(path, perm)`：创建单层目录，如果父目录不存在会报错
- `os.MkdirAll(path, perm)`：递归创建多层目录，目录已存在也不会报错

```go
// 创建单层目录
err := os.Mkdir("single_dir", 0755)

// 递归创建多层目录 (推荐)
err = os.MkdirAll("path/to/nested/dir", 0755)
```

##### 读取目录内容

`os.ReadDir` 可以读取目录下的文件和子目录列表，但不会递归深入子目录

```go
package main

import (
    "fmt"
    "os"
)

func main() {
    entries, err := os.ReadDir(".") // "." 表示当前目录
    if err != nil {
        panic(err)
    }

    for _, entry := range entries {
        fmt.Printf("名称: %s, 是否是目录: %v\n", entry.Name(), entry.IsDir())
    }
}
```

##### 删除文件和目录

- `os.Remove(path)`：删除一个文件或空目录
- `os.RemoveAll(path)`：递归删除目录及其内容，危险操作，要谨慎使用

```go
// 删除文件
err := os.Remove("file_to_delete.txt")

// 删除空目录
err = os.Remove("empty_dir")

// 递归删除目录和其所有内容 (危险操作！)
err = os.RemoveAll("dir_to_delete_recursively")
```

### 单元测试、子测试与 TestMain

Go 自带完整的测试工具链，最常见的入口就是 `go test` 和 `testing` 包

#### 单元测试

单元测试通常针对一个函数或一个方法，验证它在给定输入下是否得到预期结果

##### 基本规则

- 测试文件必须以 `_test.go` 结尾
- 测试函数必须以 `Test` 开头
- 测试函数参数固定为 `*testing.T`
- 测试文件通常和被测代码放在同一个包里

##### 一个简单的例子

假设我们有一个 `calculator.go` 文件：

```go
// calculator.go
package main

func Add(a, b int) int {
    return a + b
}
```

对应的测试文件 `calculator_test.go` 如下：

```go
// calculator_test.go
package main

import "testing"

func TestAdd(t *testing.T) {
    // 准备测试数据
    a := 10
    b := 20
    expected := 30

    // 调用被测试的函数
    result := Add(a, b)

    // 断言结果
    if result != expected {
        // t.Errorf 会报告测试失败，并打印格式化的错误信息
        // 测试会继续执行，不会立即停止
        t.Errorf("Add(%d, %d) = %d; expected %d", a, b, result, expected)
    }
}
```

##### 运行测试

在项目目录下，打开终端并运行：

```shell
go test
```

如果所有测试通过，你会看到 `ok`。如果测试失败，会显示详细的错误信息

常用的 `*testing.T` 方法有：

- `t.Logf(format, args...)`: 打印日志信息（只在测试失败或使用 `-v` 标志时显示）
- `t.Errorf(format, args...)`: 报告测试失败，但继续执行当前测试函数
- `t.Fatalf(format, args...)`: 报告测试失败，并**立即终止**当前测试函数的执行
- `t.SkipNow()`: 跳过当前测试

#### 子测试

一个函数往往有多组输入场景。如果每种场景都拆成独立测试函数，代码会越来越散。子测试适合把同类测试收在一起

子测试通过 `t.Run()` 创建，通常会和表驱动测试一起使用

##### 使用子测试重构 `TestAdd`

```go
// calculator_test.go
package main

import "testing"

func TestAddWithSubtests(t *testing.T) {
    // 定义测试用例的结构体
    testCases := []struct {
        name     string // 子测试的名称
        a, b     int    // 输入
        expected int    // 期望的输出
    }{
        {"正数相加", 1, 2, 3},
        {"负数相加", -1, -2, -3},
        {"正负数相加", -1, 2, 1},
        {"零值", 0, 0, 0},
    }

    // 遍历所有测试用例
    for _, tc := range testCases {
        // t.Run 会创建一个独立的子测试
        t.Run(tc.name, func(t *testing.T) {
            result := Add(tc.a, tc.b)
            if result != tc.expected {
                t.Errorf("expected %d, but got %d", tc.expected, result)
            }
        })
    }
}
```

##### 子测试的优势

- 结构更清晰，相关用例会集中在一起
- 测试输出更明确，失败时能直接看到具体子测试名
- 可以配合 `-run` 精准执行某个子测试

```shell
# 只运行 "正数相加" 这个子测试
go test -run TestAddWithSubtests/正数相加
```

还可以把共享初始化逻辑放在循环外层，减少重复代码

#### `TestMain`

`TestMain` 是测试入口的统一管理函数。定义了它之后，`go test` 会先执行 `TestMain`，再由 `TestMain` 决定何时运行其他测试

它适合做这类事情：

- 初始化数据库连接
- 创建临时目录或测试数据
- 在所有测试结束后统一清理资源

##### `TestMain` 的结构

```go
package main

import (
    "fmt"
    "os"
    "testing"
)

func TestMain(m *testing.M) {
    // --- 全局设置 (Setup) ---
    fmt.Println("在所有测试开始前执行：进行全局设置...")
    // 例如：连接数据库、创建临时文件或目录

    // --- 运行包内所有测试 ---
    // m.Run() 会触发包内所有 TestXxx 函数的执行。
    // 它的返回值是测试的结果码。
    exitCode := m.Run()

    // --- 全局清理 (Teardown) ---
    fmt.Println("在所有测试结束后执行：进行全局清理...")
    // 例如：断开数据库连接、删除临时文件

    // --- 退出 ---
    // os.Exit 会将 m.Run() 的结果码传递给系统，
    // 以便 CI/CD 等工具能识别测试是否通过。
    os.Exit(exitCode)
}

// 下面是普通的测试函数，它们会被 m.Run() 调用
func TestFirst(t *testing.T) {
    fmt.Println("  - 执行 TestFirst")
}

func TestSecond(t *testing.T) {
    fmt.Println("  - 执行 TestSecond")
}
```

##### 关键点

- 一个包只能有一个 `TestMain`
- 必须调用 `m.Run()`，否则真正的测试不会执行
- 最后通常要用 `os.Exit()` 把测试结果码传递出去

当测试依赖数据库、文件系统或外部服务时，`TestMain` 会很有用

### 反射

反射可以让程序在运行时检查一个值的类型、字段、方法，甚至动态修改值。它很强大，但也更容易写出脆弱代码

最常见的入口有两个：

- `reflect.TypeOf(x)`：获取类型信息
- `reflect.ValueOf(x)`：获取值信息

先看一个最简单的例子：

```go
v := reflect.ValueOf(123)
fmt.Println(v.Int()) // 输出: 123

// 如果对错误的类型调用方法，会引发 panic
// v.String() // 这里会 panic!
```

#### 通过反射修改值

如果想通过反射修改变量，最关键的一点是：这个值必须是可设置的，而可设置通常意味着你传入的是指针

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    var x float64 = 3.14

    // 1. 获取指向 x 的指针的反射值
    v := reflect.ValueOf(&x)

    // 2. 检查 v 是否可设置 (此时 v 是指针，不可设置)
    fmt.Println("v is settable?", v.CanSet()) // false

    // 3. 要想修改 x，我们需要获取指针所指向的元素
    e := v.Elem()

    // 4. 检查元素 e 是否可设置
    fmt.Println("e is settable?", e.CanSet()) // true

    // 5. 如果可设置，就可以修改它的值
    if e.CanSet() {
        e.SetFloat(7.77)
    }

    // 6. 原始变量 x 的值已经被改变
    fmt.Println("x 的新值:", x) // 输出: 7.77
}
```

修改值时可以按这个顺序理解：

1. 把变量地址传给 `reflect.ValueOf()`
2. 用 `.Elem()` 取到指针指向的实际值
3. 用 `.CanSet()` 判断能不能改
4. 再调用 `Set...()` 方法赋值

#### 结构体反射

结构体是反射里最常见的使用场景，因为很多框架都需要读取字段和标签

##### 遍历结构体字段

```go
type User struct {
    Name string `json:"name" db:"user_name"`
    Age  int    `json:"age" db:"user_age"`
}

func inspectStruct(s any) {
    t := reflect.TypeOf(s)
    v := reflect.ValueOf(s)

    for i := 0; i < t.NumField(); i++ {
        fieldT := t.Field(i) // 获取字段的类型信息
        fieldV := v.Field(i) // 获取字段的值信息

        fmt.Printf("字段名称: %s\n", fieldT.Name)
        fmt.Printf("字段类型: %s\n", fieldT.Type)
        fmt.Printf("字段值: %v\n", fieldV.Interface())
        fmt.Printf("JSON Tag: %s\n", fieldT.Tag.Get("json"))
        fmt.Println("--------------------")
    }
}

func main() {
    u := User{"Alice", 30}
    inspectStruct(u)
}
```

##### 修改结构体字段

修改结构体字段时，规则和修改普通变量一样：必须传入结构体指针

```go
func setStructField(s any, fieldName string, newValue any) {
    v := reflect.ValueOf(s)

    // 必须是指针类型，否则无法修改
    if v.Kind() != reflect.Ptr || v.Elem().Kind() != reflect.Struct {
        fmt.Println("错误：必须传入结构体指针")
        return
    }

    // 获取指针指向的结构体
    structVal := v.Elem()
    // 通过名称获取字段
    field := structVal.FieldByName(fieldName)

    if field.IsValid() && field.CanSet() {
        // 确保新值的类型匹配
        if reflect.TypeOf(newValue) == field.Type() {
            field.Set(reflect.ValueOf(newValue))
        } else {
            fmt.Println("类型不匹配")
        }
    }
}

func main() {
    u := &User{"Bob", 40}
    setStructField(u, "Age", 42)
    fmt.Printf("修改后的 User: %+v\n", *u) // {Name:Bob Age:42}
}
```

##### 调用结构体方法

```go
type Greeter struct {
    Name string
}

func (g Greeter) Greet(message string) string {
    return "Hello " + g.Name + ", " + message
}

func main() {
    g := Greeter{"World"}
    v := reflect.ValueOf(g)

    // 1. 通过名称获取方法
    method := v.MethodByName("Greet")

    // 2. 准备方法参数 (必须是 []reflect.Value)
    args := []reflect.Value{reflect.ValueOf("Go Reflection")}

    // 3. 调用方法
    results := method.Call(args)

    // 4. 处理返回值
    fmt.Println(results[0].String()) // 输出: Hello World, Go Reflection
}
```

#### ORM 的一个小案例

反射的典型场景之一就是 ORM。下面这个例子会根据结构体上的 `db` 标签生成一条简单的 `INSERT` SQL

```go
package main

import (
    "fmt"
    "reflect"
    "strings"
)

type Order struct {
    ID        int64  `db:"order_id"`
    Customer  string `db:"customer_name"`
    Amount    float64 `db:"amount"`
    IsPaid    bool   `db:"is_paid"`
    // 这个字段没有 db 标签，应该被忽略
    internalNotes string
}

func GenerateInsertSQL(s any) (string, error) {
    t := reflect.TypeOf(s)
    if t.Kind() != reflect.Struct {
        return "", fmt.Errorf("只支持结构体")
    }

    // 表名默认为结构体名的小写
    tableName := strings.ToLower(t.Name())

    var columns []string
    var placeholders []string

    for i := 0; i < t.NumField(); i++ {
        field := t.Field(i)
        // 读取 db 标签
        columnName := field.Tag.Get("db")
        // 如果没有 db 标签，或者字段是 unexported，则跳过
        if columnName != "" && field.PkgPath == "" {
            columns = append(columns, columnName)
            placeholders = append(placeholders, "?")
        }
    }

    if len(columns) == 0 {
        return "", fmt.Errorf("没有带 'db' 标签的有效字段")
    }

    query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)",
        tableName,
        strings.Join(columns, ", "),
        strings.Join(placeholders, ", "),
    )
    return query, nil
}

func main() {
    o := Order{}
    sql, err := GenerateInsertSQL(o)
    if err != nil {
        panic(err)
    }
    fmt.Println(sql)
}
```

**输出结果**：

```plain
INSERT INTO order (order_id, customer_name, amount, is_paid) VALUES (?, ?, ?, ?)
```

#### 对反射的一些建议

- 能不用就不用，优先考虑接口、泛型或代码生成
- 反射代码很容易 `panic`，调用方法前最好先判断类型和可设置性
- 想修改值时一定要传指针
- 反射更适合框架、库、工具层代码，不适合普通业务逻辑大量使用

### 网络编程

Go 的网络编程能力主要集中在标准库 `net` 和 `net/http` 中，常见协议包括 TCP、HTTP、RPC 和 WebSocket

#### TCP 编程

TCP 是一种面向连接、可靠、基于字节流的传输层协议

常见会被问到的问题是：TCP 为什么可靠？

可以先记住这几个关键点：

- 三次握手：确认双方都具备收发能力
- 四次挥手：确保连接能被完整关闭
- 序列号和确认应答：保证数据有序到达
- 超时重传：降低丢包带来的影响
- 流量控制和拥塞控制：避免发送过快导致问题

##### 服务端实现

下面这个 TCP 服务端会监听端口、接收连接，并把客户端发来的消息原样回写

```go
package main

import (
    "fmt"
    "io"
    "net"
)

// 处理客户端连接的函数
func handleConnection(conn net.Conn) {
    // 在函数退出时关闭连接
    defer conn.Close()

    // 获取客户端地址
    addr := conn.RemoteAddr().String()
    fmt.Printf("%s 连接成功\n", addr)

    // 循环读取客户端发送的数据
    buf := make([]byte, 1024)
    for {
        n, err := conn.Read(buf)
        if err == io.EOF {
            fmt.Printf("%s 客户端退出\n", addr)
            return // 客户端关闭了连接，结束该 Goroutine
        }
        if err != nil {
            fmt.Println("读取数据失败:", err)
            return
        }
        // 打印接收到的数据
        fmt.Printf("收到来自 %s 的数据: %s\n", addr, string(buf[:n]))

        // 将数据原样返回（回声服务）
        conn.Write(buf[:n])
    }
}

func main() {
    // 1. 创建监听地址
    listen, err := net.Listen("tcp", "127.0.0.1:8080")
    if err != nil {
        fmt.Println("监听失败:", err)
        return
    }
    defer listen.Close()
    fmt.Println("TCP 服务器正在监听 8080 端口...")

    // 2. 循环等待客户端连接
    for {
        conn, err := listen.Accept()
        if err != nil {
            fmt.Println("接受连接失败:", err)
            continue // 继续等待下一个连接
        }
        // 3. 为每个客户端连接启动一个独立的 Goroutine 进行处理
        go handleConnection(conn)
    }
}
```

##### 客户端实现

客户端连接服务端后，会从标准输入读取消息并发送出去

```go
package main

import (
    "bufio"
    "fmt"
    "net"
    "os"
)

func main() {
    // 1. 连接到 TCP 服务器
    conn, err := net.Dial("tcp", "127.0.0.1:8080")
    if err != nil {
        fmt.Println("连接服务器失败:", err)
        return
    }
    defer conn.Close()

    // 启动一个 goroutine 专门用于接收服务器的回显数据
    go func() {
        buf := make([]byte, 1024)
        for {
            n, err := conn.Read(buf)
            if err != nil {
                fmt.Println("接收服务器数据失败:", err)
                return
            }
            fmt.Printf("收到服务器回显: %s\n", string(buf[:n]))
        }
    }()

    // 2. 从标准输入读取数据并发送
    reader := bufio.NewReader(os.Stdin)
    for {
        fmt.Print("请输入要发送的消息 (输入q退出): ")
        input, _ := reader.ReadString('\n')
        if input == "q\n" {
            break
        }
        // 3. 发送数据到服务器
        _, err := conn.Write([]byte(input))
        if err != nil {
            fmt.Println("发送数据失败:", err)
            break
        }
    }
    fmt.Println("客户端退出")
}
```

#### HTTP 编程

HTTP（超文本传输协议）是构建 Web 应用的基础，它通常运行在 TCP 之上

##### 服务端实现

这个示例会根据请求方法和内容类型返回不同结果

```go
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

// User 结构体用于解析 JSON 数据
type User struct {
    Username string `json:"username"`
}

func IndexHandler(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case http.MethodGet:
        // 处理 GET 请求
        w.WriteHeader(http.StatusOK) // 设置状态码 200
        w.Write([]byte("<h1>Hello, 这是一个 GET 请求</h1>"))

    case http.MethodPost:
        // 处理 POST 请求
        // 1. 检查内容类型是否为 JSON
        if r.Header.Get("Content-Type") != "application/json" {
            w.WriteHeader(http.StatusBadRequest)
            w.Write([]byte("需要 application/json 类型的内容"))
            return
        }

        // 2. 读取请求体
        body, err := io.ReadAll(r.Body)
        if err != nil {
            w.WriteHeader(http.StatusInternalServerError)
            return
        }

        // 3. 解析 JSON
        var user User
        err = json.Unmarshal(body, &user)
        if err != nil {
            w.WriteHeader(http.StatusBadRequest)
            w.Write([]byte("无效的 JSON 数据"))
            return
        }

        fmt.Printf("收到 POST 请求, 用户名: %s\n", user.Username)

        // 4. 设置响应头并返回响应
        w.Header().Set("Content-Type", "application/json")
        w.Header().Set("X-Custom-Token", "some_secret_token")
        w.WriteHeader(http.StatusOK)
        response := map[string]string{"status": "success", "received": user.Username}
        json.NewEncoder(w).Encode(response)

    default:
        w.WriteHeader(http.StatusMethodNotAllowed)
    }
}

func main() {
    // 1. 注册路由和处理函数
    http.HandleFunc("/index", IndexHandler)

    // 2. 启动 HTTP 服务
    fmt.Println("HTTP 服务器正在监听 http://localhost:8080")
    err := http.ListenAndServe(":8080", nil)
    if err != nil {
        fmt.Println("服务器启动失败:", err)
    }
}
```

##### 客户端实现

Go 客户端发送 HTTP 请求通常就是构造 `http.Request`，再交给 `http.Client` 执行

```go
package main

import (
    "bytes"
    "fmt"
    "io"
    "net/http"
)

func main() {
    // --- 发送 GET 请求 ---
    fmt.Println("--- 发送 GET 请求 ---")
    getReq, _ := http.NewRequest(http.MethodGet, "http://localhost:8080/index", nil)
    resGet, err := http.DefaultClient.Do(getReq)
    if err != nil {
        fmt.Println("GET 请求失败:", err)
        return
    }
    defer resGet.Body.Close()
    bodyGet, _ := io.ReadAll(resGet.Body)
    fmt.Println("GET 响应:", string(bodyGet))

    // --- 发送 POST 请求 ---
    fmt.Println("\n--- 发送 POST 请求 ---")
    // 1. 准备 JSON 数据
    jsonData := []byte(`{"username": "枫枫"}`)
    postReq, _ := http.NewRequest(http.MethodPost, "http://localhost:8080/index", bytes.NewBuffer(jsonData))
    // 2. 设置请求头
    postReq.Header.Set("Content-Type", "application/json")

    // 3. 发送请求
    resPost, err := http.DefaultClient.Do(postReq)
    if err != nil {
        fmt.Println("POST 请求失败:", err)
        return
    }
    defer resPost.Body.Close()

    // 4. 读取响应
    fmt.Println("POST 响应状态码:", resPost.StatusCode)
    fmt.Println("POST 响应头 (Token):", resPost.Header.Get("X-Custom-Token"))
    bodyPost, _ := io.ReadAll(resPost.Body)
    fmt.Println("POST 响应体:", string(bodyPost))
}
```

#### RPC 编程

RPC（Remote Procedure Call，远程过程调用）允许你像调用本地函数一样调用远程服务器上的函数。Go 的 `net/rpc` 包提供了基础的 RPC 功能

##### 服务端实现

服务端需要定义符合规则的方法，然后把服务注册出去

```go
package main

import (
    "fmt"
    "net"
    "net/http"
    "net/rpc"
)

// ArithService 是我们的 RPC 服务
type ArithService struct{}

// Req 是请求结构体
type Req struct {
    Num1 int
    Num2 int
}

// Res 是响应结构体
type Res struct {
    Num int
}

// Add 方法必须是导出的，接收两个导出或内置类型的参数，
// 第二个参数必须是指针，返回值必须是 error 类型。
func (s *ArithService) Add(req Req, res *Res) error {
    res.Num = req.Num1 + req.Num2
    return nil
}

func main() {
    // 1. 注册 RPC 服务
    err := rpc.Register(new(ArithService))
    if err != nil {
        fmt.Println("注册 RPC 服务失败:", err)
        return
    }
    // 2. 将 RPC 服务绑定到 HTTP 协议上
    rpc.HandleHTTP()

    // 3. 启动监听
    listen, err := net.Listen("tcp", ":8080")
    if err != nil {
        fmt.Println("监听失败:", err)
        return
    }
    fmt.Println("RPC 服务器正在监听 8080 端口...")
    http.Serve(listen, nil)
}
```

##### 客户端实现

客户端通过网络连接 RPC 服务端，再调用远程方法

```go
package main

import (
    "fmt"
    "net/rpc"
)

// Req 和 Res 结构体需要与服务端保持一致
type Req struct {
    Num1 int
    Num2 int
}

type Res struct {
    Num int
}

func main() {
    // 1. 连接到 RPC 服务器
    client, err := rpc.DialHTTP("tcp", "127.0.0.1:8080")
    if err != nil {
        fmt.Println("连接 RPC 服务器失败:", err)
        return
    }

    // 2. 准备请求和响应
    req := Req{Num1: 10, Num2: 20}
    var res Res

    // 3. 调用远程方法
    // 参数格式为 "ServiceName.MethodName"
    err = client.Call("ArithService.Add", req, &res)
    if err != nil {
        fmt.Println("调用远程方法失败:", err)
        return
    }

    fmt.Printf("10 + 20 = %d\n", res.Num)
}
```

#### WebSocket 编程

WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议，它允许服务端主动向客户端推送信息，非常适合构建实时应用

如果要用下面这组示例，先安装 `gorilla/websocket`：

`go get github.com/gorilla/websocket`

##### 服务端实现

下面的服务端会把 HTTP 连接升级成 WebSocket，并把收到的消息广播给所有已连接客户端

```go
package main

import (
    "fmt"
    "net/http"
    "sync"

    "github.com/gorilla/websocket"
)

// Upgrader 将 HTTP 连接升级为 WebSocket 连接
var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    // 解决跨域问题
    CheckOrigin: func(r *http.Request) bool {
        return true
    },
}

// 使用一个结构体来安全地管理所有连接
type ConnectionManager struct {
    connections map[*websocket.Conn]bool
    mu          sync.Mutex
}

func (cm *ConnectionManager) Add(conn *websocket.Conn) {
    cm.mu.Lock()
    defer cm.mu.Unlock()
    cm.connections[conn] = true
}

func (cm *ConnectionManager) Remove(conn *websocket.Conn) {
    cm.mu.Lock()
    defer cm.mu.Unlock()
    delete(cm.connections, conn)
}

func (cm *ConnectionManager) Broadcast(message []byte) {
    cm.mu.Lock()
    defer cm.mu.Unlock()
    for conn := range cm.connections {
        if err := conn.WriteMessage(websocket.TextMessage, message); err != nil {
            fmt.Println("写入消息失败:", err)
            // 如果写入失败，可能是连接已断开，可以考虑在此处移除
        }
    }
}

var manager = ConnectionManager{
    connections: make(map[*websocket.Conn]bool),
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        fmt.Println("WebSocket 升级失败:", err)
        return
    }
    defer conn.Close()
    manager.Add(conn)
    defer manager.Remove(conn)

    fmt.Println("新客户端连接成功")

    for {
        // 读取消息
        _, message, err := conn.ReadMessage()
        if err != nil {
            fmt.Println("读取消息失败:", err)
            break
        }
        fmt.Printf("收到消息: %s\n", message)
        // 广播消息给所有客户端
        broadcastMsg := []byte(fmt.Sprintf("用户 %s 说: %s", conn.RemoteAddr(), message))
        manager.Broadcast(broadcastMsg)
    }
}

func main() {
    http.HandleFunc("/ws", wsHandler)
    fmt.Println("WebSocket 服务器正在监听 http://localhost:8080/ws")
    http.ListenAndServe(":8080", nil)
}
```

##### 客户端实现

客户端使用一个 Goroutine 负责接收消息，主流程负责发送消息

```go
package main

import (
    "bufio"
    "fmt"
    "os"
    "os/signal"
    "syscall"

    "github.com/gorilla/websocket"
)

func main() {
    // 连接到 WebSocket 服务器
    conn, _, err := websocket.DefaultDialer.Dial("ws://127.0.0.1:8080/ws", nil)
    if err != nil {
        fmt.Println("连接 WebSocket 失败:", err)
        return
    }
    defer conn.Close()
    fmt.Println("成功连接到 WebSocket 服务器")

    // 启动一个 goroutine 用于接收消息
    go func() {
        for {
            _, message, err := conn.ReadMessage()
            if err != nil {
                fmt.Println("接收消息失败:", err)
                return
            }
            fmt.Printf("\r收到消息: %s\n请输入要发送的消息: ", message)
        }
    }()

    // 处理中断信号，优雅退出
    interrupt := make(chan os.Signal, 1)
    signal.Notify(interrupt, syscall.SIGINT, syscall.SIGTERM)

    // 主 goroutine 用于发送消息
    reader := bufio.NewReader(os.Stdin)
    for {
        select {
        case <-interrupt:
            fmt.Println("\n收到中断信号，正在关闭连接...")
            // 优雅地关闭连接
            err := conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
            if err != nil {
                fmt.Println("写入关闭消息失败:", err)
            }
            return
        default:
            fmt.Print("请输入要发送的消息: ")
            line, _ := reader.ReadString('\n')
            err := conn.WriteMessage(websocket.TextMessage, []byte(line))
            if err != nil {
                fmt.Println("发送消息失败:", err)
                return
            }
        }
    }
}
```

#### 使用 Postman 作为客户端

Postman 是一个强大的 API 测试工具，它也可以作为 HTTP 和 WebSocket 的客户端

- 测试 HTTP 服务时，先选择请求方法，再输入 URL。发送 JSON 时，记得在 `Headers` 里设置 `Content-Type: application/json`，然后在 `Body` 里填写原始 JSON 数据
- 测试 WebSocket 服务时，新建一个 `WebSocket` 请求，输入 `ws://` 地址后点击连接，再在消息输入框里发送内容即可
