# douyudanmu
实时获取斗鱼弹幕

## 安装(命令行)
```shell
npm i -g douyudm
```

## 使用(命令行)
通过命令行监听，默认显示
```shell
douyudm -i 房间号
```
更多命令查看 `douyudm --help`

## 安装(API)
```shell
npm i douyudm
or
yarn add douyudm
```

## 使用(API)
通过库调用自行封装
```javascript
//引入类库
const douyu = require('douyudm')

//设置房间号，初始化
const roomId = 102965
const room = new douyu(roomId)

//系统事件
room.on('connect', function () {
    console.log('[connect] roomId=%s', this.roomId)
})
room.on('disconnect', function () {
    console.log('[disconnect] roomId=%s', this.roomId)
})
room.on('error', function(err) {
    console.log('[error] roomId=%s', this.roomId)
})

//消息事件
room.on('chatmsg', function(res) {
    console.log('[chatmsg]', `<lv ${res.level}> [${res.nn}] ${res.txt}`)
})
room.on('loginres', function(res) {
    console.log('[loginres]', '登录成功')
})
room.on('uenter', function(res) {
    console.log('[uenter]', `${res.nn}进入房间`)
})

//开始监听
room.run()
```

## 事件列表
|  系统事件  |   描述   |
|:----------:|:--------:|
|  connect   |   连接   |
| disconnect |   断开   |
|   error    | 错误监听 |

- - -

|    消息事件    |        描述         |
|:--------------:|:-------------------:|
|    loginres    |        登入         |
|    chatmsg     |      弹幕消息       |
|     uenter     |      进入房间       |
|    upgrade     |    用户等级提升     |
|      rss       |    房间开播提醒     |
| bc_buy_deserve |    赠送酬勤通知     |
|      ssd       |      超级弹幕       |
|      spbc      |   房间内礼物广播    |
|      dgb       |      赠送礼物       |
|   onlinegift   |    领取在线鱼丸     |
|      ggbb      |   房间用户抢红包    |
|     rankup     | 房间内top10变化消息 |
|    ranklist    |   广播排行榜消息    |

## 斗鱼STT序列化反序列化库
```javascript
//引入类库
const douyu = require('douyudm')

//序列化测试数据
const obj = {
    'type': 'loginreq',
    'room_id': '102965',
    'dfl': {
        sn: 105,
        ss: 1,
    },
    'username': 'visitor9986987',
    'uid': '1167614891',
    'ver': '20190610',
    'aver': '218101901',
    'ct': '0'
}
console.log(douyu.stt.serialize(obj))
// 输出: type@=loginreq/room_id@=102965/dfl@=sn@A=105@Sss@A=1@S/username@=visitor9986987/uid@=1167614891/ver@=20190610/aver@=218101901/ct@=0/

//反序列化测试数据
const str = 'uid@=1167614891/rid@=102965/cate_id@=15/rid@=-1/ri@=sc@A=4555100@Sidx@A=42@S/type@=rri/'
console.log(douyu.stt.deserialize(str))
// 输出: 
// {
//     type: 'rri',
//     ri: {
//         idx: '42',
//         sc: '4555100'
//     },
//     rid: '102965',
//     cate_id: '15',
//     uid: '1167614891'
// }
```

## 提醒
- 使用yarn全局安装可能会无法使用

## 后话
坑太多了，github上的库大部分都是不能使用的，如果近期更新的可以判断使用的新接口，review了几乎所有相关的库，都是依据斗鱼自己官方平台的方法发起tcp连接？但根本连不上，一直拒绝...

看了下能使用的库，都是通过websocket建立的连接，立马修改，不出片刻撸完，发现发送数据的格式有点难搞，虽说示意图挺清楚的，但是用Buffer传输死活没有相应的消息，调试太磨人心性了，玛德，直接去把斗鱼网页上的方法扒下来。

通过webpack打包混淆代码乍一眼看去很混乱，其实仔细观察还是有规律寻找的。

文档中编码的几个固定参数均为数字，在webpack中数字的混淆我还没见过，按这个思路精准的找到这段代码。经过我十几分钟的理解，提取出 [**bufferCoder.js**](src/bufferCoder.js)

斗鱼自有的序列化，反序列化方法可以查看 [**stt.js**](src/stt.js)
