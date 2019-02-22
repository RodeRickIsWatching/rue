// [
//     [
//         {
//             key,
//             value,
//             next
//         },
//         {
//             key,
//             value,
//             next
//         },
//         {
//             key,
//             value,
//             next
//         },
//     ],
//     [],
//     [] 
// ]


class Map {
    constructor() {
        this.bucketQuantity = 8;

    }

    set() {

    }
    makeHash(_name) {
        let _code = 0,
            _temp;
        if (typeof _name == 'number') {
            return _name
        }
        if (Object.prototype.toString.call(_name) == '[object Object]') {
            _temp = [];
            Object.keys(_name).forEach(item => {
                _temp.push(item)
            })
        } else {
            _temp = Array.from(_name)
        }
        _temp.forEach((item) => {
            if (typeof item == 'number') {
                _code += item
            } else {
                _code += item.charCodeAt();
            }
        })
        return _code
    }

}




makeHash()