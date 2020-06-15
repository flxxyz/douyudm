//引入类库
const stt = require('../src/index').stt

//序列化测试数据
const obj = {
    type: 'chatmsg',
    nn: '河马（￣。。￣）',
    ic: 'avatar_v3/201912/b99d77251eb643b5a88bb81863afea4e',
    cst: '1592152272402',
    brid: '0',
    lk: '',
    list: [{
        lev: '1',
        num: '2'
    }, {
        lev: '7',
        num: '3'
    }]
}

//反序列化测试数据
const str = 'type@=chatmsg/nn@=河马（￣。。￣）/ic@=avatar_v3@S201912@Sb99d77251eb643b5a88bb81863afea4e/cst@=1592152272402/brid@=0/lk@=/list@=lev@AA=1@ASnum@AA=2@AS@Slev@AA=7@ASnum@AA=3@AS@S/'

console.log('1.序列化')
console.log('原始: ')
console.log(obj)
console.log('输出: ')
console.log(stt.serialize(obj))

console.log('\n-------------------------------------------')

console.log('2.反序列化')
console.log('原始: ')
console.log(str)
console.log('输出: ')
console.log(stt.deserialize(str))
