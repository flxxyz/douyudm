//引入类库
const douyudanmaku = require('../src/index')

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
console.log(douyudanmaku.stt.serialize(obj))
// 输出: type@=loginreq/room_id@=102965/dfl@=sn@A=105@Sss@A=1@S/username@=visitor9986987/uid@=1167614891/ver@=20190610/aver@=218101901/ct@=0/

//反序列化测试数据
const str = 'uid@=1167614891/rid@=102965/cate_id@=15/rid@=-1/ri@=sc@A=4555100@Sidx@A=42@S/type@=rri/'
console.log(douyudanmaku.stt.deserialize(str))
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