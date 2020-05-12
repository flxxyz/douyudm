(function () {
    var room = null
    var isConn = false

    getId('s').onclick = async function () {
        let roomId = getId('roomId').value

        if (roomId && roomId > 0) {
            let isExit = await exit()
            if (!isExit) {
                getId('tips').innerText = ''
                newRoom(roomId)
            }
        } else {
            getId('tips').innerText = '请输入正确的房间号'
        }
    }

    getId('messages').style.height = (document.documentElement.clientHeight - 60) + 'px'

    function getId(el) {
        return document.getElementById(el)
    }

    function exit() {
        return new Promise((resolve, reject) => {
            if (isConn) {
                room.logout()
                isConn = false
                resolve(true)
            } else {
                resolve(false)
            }
        })
    }

    function insertNode(context) {
        var node = document.createElement('li')
        node.innerText = context
        getId('messages').appendChild(node, null)
        document.querySelectorAll('li')[document.querySelectorAll('li').length - 1].scrollIntoView()
    }

    function newRoom(roomId) {
        room = new douyudanmaku(roomId)
        room.on('connect', function () {
            console.log('[connect] roomId=%s', this.roomId)
            insertNode(`[connect] roomId=${this.roomId}`)
        })
        room.on('disconnect', function () {
            console.log('[disconnect] roomId=%s', this.roomId)
            insertNode(`[disconnect] roomId=${this.roomId}`)
        })
        room.on('error', function (err) {
            console.log('[error] roomId=%s', this.roomId)
        })
        room.on('chatmsg', function (res) {
            console.log('[chatmsg]', `<lv ${res.level}> [${res.nn}] ${res.txt}`)
            insertNode(`[chatmsg] <lv ${res.level}> [${res.nn}] ${res.txt}`)
        })
        room.on('loginres', function (res) {
            console.log('[loginres]', '登录成功')
            insertNode('[loginres] 登录成功')
        })
        // room.on('uenter', function (res) {
        //     console.log('[uenter]', `${res.nn}进入房间`)
        //     insertNode(`[uenter] ${res.nn}进入房间`)
        // })
        room.on('dgb', function (res) {
            //斗鱼的礼物过多无法全部记录，20000以后可以判断为鱼翅购买，其他为系统赠送
            const gifts = {
                20000: '鱼丸',
                20001: '弱鸡',
                20002: '办卡',
                20003: '飞机',
                20004: '火箭',
                20005: '超级火箭',
                20006: '赞',
                20008: '超大丸星',
                20234: '爱心飞机',
                20387: '心动火箭',
                20417: '福袋',
                20541: '大气',
                20542: '666',
                20618: '魔法戒指',
                20624: '魔法彩蛋',
                20642: '能量电池',
                20643: '能量水晶',
                20644: '能量戒指',
                20710: '金鲨鱼',
                20725: '宠爱卡',
                20726: '挚爱超火',
                20727: '乖乖戴口罩',
                20728: '勤洗手',
                192: '赞(系统)',
                193: '弱鸡(系统)',
                519: '呵呵(系统)',
                520: '稳(系统)',
                712: '棒棒哒(系统)',
                714: '怂(系统)',
                824: '应援棒(系统)',
            }
            const gift = gifts[res.gfid] || '其他礼物'
            console.log('[dgb]', `感谢${res.nn}送出${gift}`, `礼物id=${res.gfid}`)
            insertNode(`[dgb] 感谢${res.nn}送出${gift}  礼物id=${res.gfid}`)
        })
        room.run()
        isConn = true
    }
})()