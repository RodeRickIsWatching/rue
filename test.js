var _arr=[ [1, 2, 2], [3, 4, 5, 5], [6, 7, 8, 9, [11, 12, [12, 13, [14] ] ] ], 10];
let newArr = Array.from(new Set(_arr.concat([]).toString().split(',').map( item => +item))).sort((a,b)=>a-b)
console.log(newArr)
