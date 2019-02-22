class rue {
    constructor(options) {
        let {
            el: _el,
            data: _data,
            methods: _methods,
            computed: _computed
        } = options

        let __data = JSON.parse(JSON.stringify(_data))

        rue.initProxy.call(this, __data)
        // rue.init.call(this, __data)

        let res = this.createVNode(document.querySelectorAll(options.el)[0]);
        let _res = this.searchValTemplate(res);
        console.log(_res)
    }


    createVNode(_dom) {
        let _node = new VNode(_dom);
        let _domLists = _dom.childNodes,
            _domListsLength = _dom.childNodes.length;
        for (let i = 0; i < _domListsLength; i++) {
            if (_domLists[i].nodeType == 1 || _domLists[i].nodeType == 3) {
                // 文本节点和元素节点
                // 向下继续遍历
                let childNode = this.createVNode(_domLists[i])
                _node.appendChild(childNode)
            } else {
                continue
            }
        }
        return _node
    }


    searchValTemplate(_nodeList) {
        // 遍历nodes，查找{{}}，进行值的替换
        let nodeType = _nodeList.type,
            childNodeList = _nodeList.childNodes,
            len = _nodeList.childNodes.length;
        if (nodeType == 1) {
            for (let i = 0; i < len; i++) {
                if (childNodeList[i]) {
                    this.searchValTemplate(childNodeList[i])
                }
            }
        } else { //文本节点，直接替换值
            let res;
            if (_nodeList.value && _nodeList.value.trim()) {
                let text = _nodeList.value.trim()
                let indexTemplate = this.searchTemplateIndex(text)
                // let reg = new RegExp(indexTemplate,'g')
                let temp = this.replaceVal(this.$data, indexTemplate)
                res = _nodeList.value.replace(/{{[a-zA-Z_]+[a-zA-Z0-9_.]*}}/g, temp)
            }
            // 将值渲染回node
            // 有个bug，对象无法渲染只能是[object Object]
            _nodeList.dom.nodeValue = res
        }
        // return
    }

    searchTemplateIndex(_val) {
        // 先匹配出{{}}，再将{{}}中的值替换掉
        let reg1 = new RegExp('{{[a-zA-Z_]+[a-zA-Z0-9_.]*}}', 'g');
        let res = _val.match(reg1)[0].split("{{")[1].split("}}")[0];
        // console.log(res)
        return res
    }

    replaceVal(data, indexTemplate) {
        // 为了拆分a.b.c，使得他能依次通过索引查找值
        let indexArr = indexTemplate.split('.');
        let res = data;
        for (let i = 0; i < indexArr.length; i++) {
            res = res[indexArr[i]]
        }
        console.log(res)
        return res
    }


    static initProxy(_params) {
        let tempProxy = this.goThroughObj(_params);
        this.$data = tempProxy
        this.proxyOnTop(tempProxy);
    }
    proxyOnTop(_proxyObj) {
        // 强行实现暴露在顶层,通过rw.a来调用
        let temp = this.$data;
        Object.keys(_proxyObj).forEach(item => {
            Object.defineProperty(this, item, {
                enumerable: true,
                configurable: true,
                set(_val) {
                    // console.log("setset");
                    temp[item] = _val
                },
                get() {
                    // console.log("getget")
                    return temp[item]
                }
            })
            this[item] = temp[item]
        })

    }
    goThroughObj(_params) {
        // 遍历对象，每一层添加代理
        // 能进入该函数说明你是对象，既然是对象就添加代理
        let tempProxy;
        tempProxy = rue.createProxy(_params);
        for (let i in _params) {
            if (typeof _params[i] == 'object') {
                let temp = this.goThroughObj(_params[i])
                _params[i] = temp;
            }
        }
        return tempProxy
    }

    static createProxy(_obj) {
        // 创建代理
        return new Proxy(_obj, {
            set(target, key, value) {
                console.log('sset')
                return Reflect.set(target, key, value)
            },
            get(target, key) {
                console.log('gget')
                return Reflect.get(target, key)
            }
        })
    }

    /**
     * 写成static的原因:
     *  由于多层级，后续多层级递归时改变了this，内层并没有init方法，因此写成static，方便调用该方法
     */
    static init(_params) {
        // 为每一个原始值重写get和set方法，只为添加赋值，暂不考虑重写push等方法
        let tempObj = rue.goCycleObj.call(this, _params)
        this.$data = tempObj
        // 与下面define功能相同，暴露到对象顶层，便于rw.a直接调用
        // Object.keys(tempObj).forEach(item => {
        //     this[item] = tempObj[item]
        // })
    }
    static goCycleObj(_params) {
        let tempObj = new Object()
        for (let item in _params) {
            let childTemp;
            // 这里只对第一层属性添加了setget
            // 若属性有引用值，则只能触发其上一次的get而不能触发set，注意需要触发的是自己的set
            // 因此需要递归判断是否为原始值并添加getset
            if (typeof _params[item] == 'object') {
                childTemp = {};
                if (Array.isArray(_params[item])) {
                    childTemp = [];
                }
                //为什么要call，为了使得最后面的this指向改变，使得this每次都指向自己这一层，而不是指向顶层
                // 如：rw：{a:{b:{c:1}}}
                // 改变指向，分别指向a,b,c  即将值归位到各个索引
                // 若不改变则统统指向rw,最后就会导致是 rw:{a:{},b:{},c:{}}
                rue.goCycleObj.call(childTemp, _params[item])
            } else {
                childTemp = _params[item];
            }
            // 进行代理
            rue.createProperty.call(this, tempObj, item, childTemp)
        }
        return tempObj
    }
    static createProperty(_obj, _key, _ele) {
        Object.defineProperty(_obj, _key, {
            enumerable: true,
            configurable: true,
            set(_val) {
                _ele = _val
                console.log("setset");
            },
            get() {
                console.log("getget")
                return _ele
            }
        })

        // 将值绑定在rw对象的顶层，便于rw.a直接调用
        // 利用了defineProperty是遍历元素添加get/set的特点，也可以在最外面写
        Object.defineProperty(this, _key, {
            enumerable: true,
            configurable: true,
            set(_val) {
                _ele = _val
                console.log("setset");
            },
            get() {
                console.log("getget")
                return _ele
            }
        })
    }


}

class VNode {
    constructor(dom) {
        this.dom = dom;
        this.type = dom.nodeType;
        this.value = dom.nodeValue;
        //只有文本节点才有value,如<div>aaa</div>，aaa就是文本节点
        // 且文本节点就是最底层节点了
        this.childNodes = [];
        // console.log(this.value)
    }

    appendChild(_node) {
        if (_node instanceof VNode) {
            this.childNodes.push(_node)
        }
    }



}