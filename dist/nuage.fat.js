Object.extend = function(dst, src) {
    if (typeof(src) != 'undefined') {
        for (var k in src) {
            dst[k] = src[k]
        }
    }
    return dst
}


Object.extend(Object, {
    clone: function(obj) {
        if (obj instanceof Array) {
            var rv = []
        }
        else {
            var rv = {}
        }
        for (var p in obj) {
            rv[p] = obj[p]
        }
        return rv
    }
})


Function.prototype.to_method =  function() {
    var __method = this
    var self = arguments[0]
    return function() {
        var args = [self], a = arguments
        for (var i = 0, len = a.length; i<len ; i++) { args.push(a[i]) }
        return __method.apply(self, args)
    }
}

Object.extend(window, {
    __type__: {'nuage.object': function(){}},

    $: function(q) {
        if (isinstance(q,String)) {
            return document.querySelector(q)
        }
        return q
    },

    len: function(obj){
        if (obj == null) {
            throw exc.TypeError('TypeError: null has no len()')
        }
        if (obj instanceof Function) { 
            throw exc.TypeError('TypeError: function has no len()')
        }
        if (obj.__class__ && isinstance(obj, list)) {
            return obj._values.length
        }
        if (obj.__class__ && isinstance(obj, dict)) {
            return len(obj.keys())
        }
        if (typeof(obj.length) != 'undefined') {
            return obj.length
        }
        return len(dict(obj).keys())
    },

    print: function() {
        msg = list()
        for (var i = 0, len = arguments.length; i < len; i++) {
            msg.append(arguments[i])
        }
        console.log('\xA0'.join(msg))
    },

    pprint: function() {
        msg = list()
        for (var i = 0, len = arguments.length; i < len; i++) {
            if (isinstance(arguments[i], Object)) {
                if (msg._values.length) {
                    console.log('\xA0'.join(msg))
                }
                console.log(arguments[i])
                msg = list()
            }
            else {
                msg.append(arguments[i])
            }
        }
        if (msg._values.length) {
            console.log('\xA0'.join(msg))
        }
    },

    callable:function(obj) {
        return nuage.isinstance(obj, Function)
    },

    isinstance: function(obj, cls) {
        return nuage.isinstance(obj, cls)
    },

    issubclass: function(subclass, class_) {
        return nuage.issubclass(subclass, class_)
    },

    type: function(obj) {
        if (obj instanceof Array) {
            return Array
        }
        return obj.__class__
    },

    hasattr: function(obj, attr) {
        // todo: raise NameError
        return (typeof(obj[attr]) != 'undefined')
    },

    getattr: function(obj, attr) {
        return obj[attr]
    },

    rand: function(min_, max_) {
        if (max_ == null) {
            max_ = min_
            min_ = 0
        }
        if (!max_) {
            max_ = 1
        }
        return min_ + Math.floor(Math.random() * max_)
    },

    range: function(start, stop, step) {
        if (arguments.length < 3) {
            step = 1
        }
        if (arguments.length < 2) {
            stop = start
            start = 0
        }
        if (step == 0) {
            throw exc.ValueError('ValueError: range() step argument must not be zero')
        }
        var rv = []
        if (step>0) {
            for (var i = start; i < stop; i+= step) {
                rv.push(i)
            }
        }
        else {
            for (var i = start; i > stop; i+= step) {
                rv.push(i)
            }
        }
        return rv
    },

    zip: function(args) {
        var rv = list()
        var i = 0
        var continue_ = true
        while (continue_) {
            var item = list()
            for (var j = 0; j < arguments.length; j++) {
                var k = arguments[j]
                continue_ = (len(k) < i) 
                if (!continue_) {
                    if (k instanceof list) {
                        item.append(k.get(i))
                    }    
                    else {
                        item.append(k[i])
                    }
                }
                else {
                    break
                }
            }
            if (continue_) {
                rv.append(item)
            }
            i+=1
        }
        return rv
    },

    map: function (callback, iterable) {
        var rv = list()
        var iterator = iterable.__iter__()
        try {
            while (true) {
                rv.append(callback(iterator.next()))
            }
        }
        catch(e){
            if (!nuage.isinstance(e, exc.StopIteration)){
                throw e
            }
        }
        return rv
    },

    str: function(s) {
        if (s == null) {
            return 'null'
        }
        return s.toString()
    },

    int_: function(s) {
        var rv = parseInt(s,10)
        if (isNaN(rv)) {
            throw exc.ValueError()
        }
        return rv
    },

    float_: function(s) {
        var rv = parseFloat(s,10)
        if (isNaN(rv)) {
            throw exc.ValueError()
        }
        return rv
    }
})

window.nuage = {
    _ancestors:{'nuage.object':[]},
    _static: {
        'nuage.object': {
            __lt__: function(self,other) {
                return (self < other)
            },
            __gt__: function(self,other) {
                return (other > self)
            },
            toString: function(){
                return "<class {0}>".format(this.__fullname__)
            }
        }        
    },
    _native_methods: {
        'window.String': ['replace']
    },
    _impl: {
        'nuage.object': {
            __init__: function(self){},
            __str__: function(){
                return '<{0} object>'.format(this.__class__.__fullname__)
            }
        }
    },
    create_module: function(params) {
        var p = {
            __name__: 'window',
            __impl__: {}
        }
        Object.extend(p,params)
        var m = this._create_module(p.__name__)
        Object.extend(m,p.__impl__)
    },
    create_class:function(params) {
        var p = {
            __module__: 'window',
            __name__:null,
            __static__: {},
            __parent__:[],
            __impl__: {},
        }
        params = Object.extend(p,params)
        if (params.__name__ == null) { throw "__name__ is missing" }
        if (params.__module__ == null) { 
            params.__module__ = window
        }
        var module = this._create_module(params.__module__)
        var fullname = params.__module__ + '.' + params.__name__
        this._static[fullname] = params.__static__
        this._impl[fullname] = params.__impl__
        this._ancestors[fullname] = []
        if(!(params.__parent__ instanceof Array)) {
            params.__parent__ = [params.__parent__]
        }
        if (params.__parent__.length == 0) {
            params.__parent__.push(nuage.object)
        }
        for (var i in params.__parent__) {
            var prt = params.__parent__[i]
            if (!prt) {
                throw exc.Exception(fullname + ' has undefined parent class')
            }
            for (var j in this._ancestors[prt.__fullname__]) {
                this._ancestors[fullname].push(
                    this._ancestors[prt.__fullname__][j])
            }
            this._ancestors[fullname].push(prt)
        }
        var obj = this
        // hidden constructor
        __type__[fullname] = function(args) {
            var self = this
            for (var a in obj._ancestors[fullname]) {
                var anc = obj._ancestors[fullname][a].__fullname__
                if (obj._native_methods[anc]) {
                    var nt = obj._impl[anc]
                    var nm = obj._native_methods[anc]
                    for (var i in nm) {
                        self[nm[i]] = nt[nm[i]].to_method(self)
                    }
                }
                var _impl = obj._impl[anc]
                
                if (_impl['__val__']) {
                    self['valueOf'] = _impl['__val__'].to_method(self)
                }
                if (_impl['__str__']) {
                    self['toString'] = _impl['__str__'].to_method(self)
                }
                for (var f in _impl) {
                    if (_impl[f] instanceof Function) {
                            if ((f != 'toString') &&
                            (f != 'valueOf')) {
                                self[f] = _impl[f].to_method(self)
                            }
                    }
                    else {
                        self[f] = _impl[f] 
                    }
                }
            }
            for (var f in params.__impl__) {
                if (params.__impl__[f] instanceof Function) {
                    if ((f !='toString') && (f !='valueOf')) {
                        self[f] = params.__impl__[f].to_method(self)
                    }
                }
                else {
                    self[f] = params.__impl__[f] 
                }
            }
            if (params.__impl__['__str__']) {
                self['toString'] = params.__impl__['__str__'].to_method(self)
                self['valueOf'] = params.__impl__['__str__'].to_method(self)
            }
            self.__class__ = module[params.__name__]
            self.__init__.apply(self,arguments[0])
            return self
        }
        // constructor
        var name = params.__name__
        module[name] = function(){
            return new __type__[fullname](arguments)
        }
        for (var a in this._ancestors[fullname]) {
            Object.extend(module[params.__name__], 
                this._static[this._ancestors[fullname][a].__fullname__])
        }
        Object.extend(module[name], params.__static__)
        module[name].__name__ = params.__name__
        module[name].__fullname__ = params.__module__ + '.' + name
        
        
        for (var f in params.__impl__) {
            if (params.__impl__[f] instanceof Function) {
                if ((f != 'toString') && (f != '__valueOf__')) {
                    module[name][f] = params.__impl__[f]
                }
            }
        }
        return module[params.__name__]
    },

    _create_module: function(name) {
        if (isinstance(name, Object)) {
            return name
        }
        var mods = name.split(/\./g)
        var rv = window
        for (var i = 0; i<mods.length; i++) {
            if (!hasattr(rv, mods[i])) { 
                rv[mods[i]] = {}
            }
            rv = rv[mods[i]]
        }
        return rv
    },

    isinstance: function(obj,cls){
        // native type
        if (cls == null) {
            throw exc.TypeError('TypeError: isinstance expected 2 arguments, got 1')
        }
        if (obj instanceof cls) {
            return true
        }
        if (obj == null) {
            return false
        }
        switch (typeof obj) {
            case 'boolean':
                return cls.__fullname__ == 'window.Boolean'
            case 'number':
                return cls.__fullname__ == 'window.Number'
            break
            case 'string':
                return cls.__fullname__ == 'window.String'
            break
        }
        // nuage types
        if (obj instanceof __type__[cls.__fullname__]) {
            return true
        }
        if (!obj.__class__) {
            return false
        }
        return (list(this._ancestors[obj.__class__.__fullname__]).index(cls)>=0)
    },

    issubclass: function(subcls, cls){
        //todo throw error if args are not classes
        if (subcls == cls) {
            return true
        }
        return (list(this._ancestors[subcls.__fullname__]).index(cls)>=0)
    },
}


nuage.object = function(){
    return new __type__['nuage.object']()
}


nuage.object.__name__ = 'object'
nuage.object.__fullname__ = 'nuage.object'


// JS Builtin type injection
nuage.builtin_proto = {
    __init__: function(self,value){
        self._value = value
    },
    __val__: function(self) {
        return self._value
    },
    __str__: function(self) {
        return self._value.toString()
    },
    __lt__: function(self,other) {
        if (arguments.length < 2) {
            return this < self
        }
        else {
            return (self._value < other._value)
        }
    },
    __gt__: function(self,other) {
        if (arguments.length < 2) {
            return this > self
        }
        else {
            return (self._value > other._value)
        }
    }
}


Object.extend(Date, {
    __name__: 'Date',
    __module__: 'window',
    __fullname__: 'window.Date'
})
Object.extend(Date.prototype, { __class__: Date })
Object.extend(Date.prototype, nuage.builtin_proto)


nuage._impl['window.Date'] = Date.prototype 
nuage._ancestors['window.Date'] = []


Object.extend(Boolean, {
    __name__: 'Boolean',
    __module__: 'window',
    __fullname__: 'window.Boolean'
})
Object.extend(Boolean.prototype, {__class__: Boolean})
Object.extend(Boolean.prototype, nuage.builtin_proto)

__type__['window.Boolean'] = Boolean
nuage._static['window.Boolean'] = Boolean 
nuage._impl['window.Boolean'] = Boolean.prototype 
nuage._ancestors['window.Boolean'] = []


Object.extend(Number, {
    __name__: 'Number',
    __module__: 'window',
    __fullname__: 'window.Number'
})
Object.extend(Number.prototype, {
    __class__: Number })
Object.extend(Number.prototype, nuage.builtin_proto)

__type__['window.Number'] = Number
nuage._static['window.Number'] = Number 
nuage._impl['window.Number'] = Number.prototype 
nuage._ancestors['window.Number'] = []


Object.extend(String, {
    __name__: 'String',
    __module__: 'window',
    __fullname__: 'window.String',
    /*
    whitespace: '\t\n\x0b\x0c\r ',
    lowercase:'abcdefghijklmnopqrstuvwxyz',
    lowercase:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    digit:'0123456789',
    punctuation:'!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
    printable: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~ \t\n\r\x0b\x0c',
    */
})
String.prototype.replace_ = String.prototype.replace 
String.prototype.split_ = String.prototype.split 
Object.extend(String.prototype, nuage.builtin_proto)
Object.extend(String.prototype, {
    __class__: String,

    strip: function(self,str) { 
        if (arguments.length < 2) {
            str = arguments[0]
            self = this
        }
        return self.replace(/^(\s|\xA0)+|(\s|\xA0)+$/g, '')
    },

    lstrip: function(self,str) {
        if (arguments.length < 2) {
            str = arguments[0]
            self = this
        }
        return self.replace(/^(\s|\xA0)+/, '') 
    },

    rstrip: function(self,str) { 
        if (arguments.length < 2) {
            str = arguments[0]
            self = this
        }
        return self.replace(/(\s|\xA0)+$/, '') 
    },

    join: function(self, list_) {
        if (arguments.length < 2) {
            list_ = arguments[0]
            self = this
        }
        var rv = ''
        if (len(list_) > 0) {
            var values
            if (list_ instanceof __type__['window.list']) {
                values = list_.values()
            }
            else {
                values = list_
            }
            for (var i = 0, length = values.length-1; i < length ;i++) {
                rv += values[i] + this
            }
            rv += values[values.length-1]
        }
        return rv
    },

    cut: function(self, start, stop) {
        if (self == this) {
            var value = self._value
        }
        else {
            var value = this
            stop = start
            start = self
        }
        if (stop == null) {
            if (start > 0) {
                stop = start
                start = 0
            }
            else {
                stop = value.length
            }
        }
        if (start < 0) {
            start = value.length + start
        }
        if (stop <= 0) {
            stop = value.length + stop
        }
        start = Math.max(start,0)
        stop = Math.min(stop,value.length)
        return value.substring(start,stop)
    },

    split: function(self, spliter) {
        if (arguments.length < 2) {
            spliter = arguments[0]
            self = this
        }
        if (!spliter) {
            spliter = /\s+|\xA0+/gim
        }
        return self.split_(spliter)
    },

    startswith: function(self, str) {
        if (arguments.length < 2) {
            str = arguments[0]
            self = this
        }
        return (self.index(str) == 0)
    },

    endswith: function(self, str) {
        if (arguments.length < 2) {
            str = arguments[0]
            self = this
        }
        return ((self.cut(-str.length)) == str)
    },

    index: function(self, str) {
        if (arguments.length < 2) {
            str = arguments[0]
            var value = this
        }
        else {
            var value = self._value
        }
        return value.indexOf(str) 
    },

    capitalize: function(self) {
        if (arguments.length < 1) {
            var str_ = this
        }
        else {
            var str_ = self._value
        }
        return str_.substring(0,1).toUpperCase() + str_.substring(1,str_.length-1)
    },

    format:function(self, values) {
        if (self === this) {
            if (isinstance(arguments[1],String)) {
                var values_ = []
                for (var i = 1; i < arguments.length; i++) {
                    values_.push(arguments[i])
                }
                values = values_
            }
            var str_ = self
        }
        else {
            if (isinstance(arguments[0],String)) {
                var values_ = []
                for (var i = 0; i < arguments.length; i++) {
                    values_.push(arguments[i])
                }
                values = values_
            }
            else {
                values = arguments[0]
            }
            var str_ = this
        }
        var v
        var rv = list()
        var m = str_.split(/\{|\}/gm)
        var intag = false
        if (isinstance(values,dict)) {
            values = values.to_object()
        }
        else if (isinstance(values,list)) {
          values = values.values()
        }
        for (var i = 0; i < m.length; i++) {
            
            if (intag) {
                v = values[m[i]]
                if (len(v)) {
                    rv.append(v)
                }
            }
            else {
                if (len(m[i])) {
                    rv.append(m[i])
                }
            }
            intag = !intag
        }
        
        return ''.join(rv)
    },

    lower: function(self) {
        if (arguments.length < 1) {
            var str_ = this
        }
        else {
            var str_ = self._value
        }
        return str_.toLowerCase() 
    },

    upper: function(self) {
        if (arguments.length < 1) {
            var str = this
        }
        else {
            var str = self._value
        }
        return str.toUpperCase() 
    },

    replace: function(self, search, repl) {
        if (arguments.length < 3) {
            var repl = arguments[1]
            var search = arguments[0]
            var val_ = this
        }
        else {
            var val_ = self._value
        }
        if (isinstance(search,String)) {
            search = new RegExp(search,'gm')
        }
        return val_.replace_(search,repl)
    },

    ljust: function(self, width, fillchar) {
        if (self == this) {
            if (arguments.length > 2) {
                fillchar = arguments[2]
            }
            else {
                fillchar = '\xA0'
            }
            width = arguments[1]
            var str_ = self
        }
        else {
            if (arguments.length > 1) {
                fillchar = arguments[1]
            }
            else {
                fillchar = '\xA0'
            }
            width = arguments[0]
            var str_ = this
        }
        while (len(str_) < width) {
            str_ = fillchar + str_
        }
        return str_
    },

    rjust: function(self, width, fillchar) {
        if (self == this) {
            if (arguments.length > 2) {
                fillchar = arguments[2]
            }
            else {
                fillchar = '\xA0'
            }
            width = arguments[1]
            var str_ = self
        }
        else {
            if (arguments.length > 1) {
                fillchar = arguments[1]
            }
            else {
                fillchar = '\xA0'
            }
            width = arguments[0]
            var str_ = this
        }
        while (len(str_) < width) {
            str_ = str_ + fillchar
        }
        return str_
    },

    zfill: function(self, width) {
        if (self !== this) {
            width = self
            var str_ = this
        }
        else {
            var str_ = self._value
        }
        return str_.ljust(str_, width, '0')
    }
})
__type__['window.String'] = String
nuage._impl['window.String'] =  String.prototype 
nuage._ancestors['window.String'] = []


Object.extend(RegExp, {
    __name__: 'RegExp',
    __module__: 'window',
    __fullname__: 'window.RegExp'
})
Object.extend(RegExp.prototype, nuage.builtin_proto)

Object.extend(RegExp.prototype, {
    __class__ : RegExp,
    __init__ : function(self){},
    __lt__: function(self,other) {
        return (self < other)
    },
    __gt__: function(self,other) {
        return (self > other)
    },
    match : function (self, str) {
        if (arguments.length < 2) {
            str = arguments[0]
            self = this
        }
        return self.test(str)
    },
    search: function (self, str) {
        if (arguments.length < 2) {
            str = arguments[0]
            self = this
        }
        return self.exec(str)
    },
    split: function (self, str) {
        if (arguments.length < 2) {
            str = arguments[0];
            self = this
        }
        return str.split(self)
    }
})
__type__['window.RegExp'] = RegExp
nuage._impl['window.RegExp'] =  RegExp.prototype 
nuage._ancestors['window.RegExp'] = []
nuage.create_module({
    __name__: 're',
    __impl__: {
        compile: function(str, opt) {
            return new RegExp(str, opt)
        }
    }
})


nuage.create_class({
    __name__: 'Exception',
    __module__: 'exc',
    __impl__: {

        __init__: function(self,message) {
            if (message && isinstance(message, String)) {
                self.message = message
            }
            else {
                self.message = 'Exception '+self.__class__.__name__+' occured'
            }
        },

        __str__: function(self) {
            return self.__class__.__name__+':'+self.message
        }
    }
})


nuage.create_class({
    __name__: 'StopIteration',
    __module__: 'exc',
    __parent__: exc.Exception
})

 
nuage.create_class({
    __name__: 'StandardError',
    __module__: 'exc',
    __parent__: exc.Exception,
    __impl__: {
        __init__: function(self,message) {
            exc.Exception.__init__(message || 'Error '+self.__class__.__name__+' occured')
        }
    }
})


nuage.create_class({
    __name__: 'LookupError',
    __module__: 'exc',
    __parent__: exc.StandardError
})


nuage.create_class({
    __name__: 'IndexError',
    __module__: 'exc',
    __parent__: exc.LookupError
})


nuage.create_class({
    __name__: 'KeyError',
    __module__: 'exc',
    __parent__: exc.LookupError
})


nuage.create_class({
    __name__: 'TypeError',
    __module__: 'exc',
    __parent__: exc.StandardError,
    __impl__: {
        __init__: function(self,message) {
            exc.StandardError.__init__(message || 'Error ' +
                self.__class__.__name__ + ' occured')
        }
    }
})


nuage.create_class({
    __name__: 'AttributeError',
    __module__: 'exc',
    __parent__: exc.StandardError
})


nuage.create_class({
    __name__: 'ValueError',
    __module__: 'exc',
    __parent__: exc.StandardError
})


nuage.create_class({
    __name__: 'datetime',
    __static__: {
        now: function() {
            return datetime(new Date())
        }
    },
    __impl__: {

        __init__: function(self,year, month, day, hour, minute, second,
                           microsecond) {
            if (year instanceof Date) {
                self._value = year
            }
            else {
                if (arguments.length < 4) {
                    throw exc.TypeError("year, month, day are required")
                }
                if (month) {
                    month--
                }
                hour = hour || 0
                minute = minute || 0
                second = second || 0
                microsecond = microsecond || 0
                self._value = new Date(year, month, day, hour, minute, second, microsecond)
            }
        },

        __str__: function(self) {
            var rv = self._value.getFullYear() + '-'
            rv += str(self._value.getMonth()+1).zfill(2) + '-'
            rv += str(self._value.getDate()).zfill(2) + ' '
            rv += str(self._value.getHours()).zfill(2) + ':'
            rv += str(self._value.getMinutes()).zfill(2) + ':'
            rv += str(self._value.getSeconds()).zfill(2) + '.'
            rv += str(self._value.getMilliseconds()).zfill(3)
            return rv
        },

        isoformat: function(self) {
            var rv = self._value.getFullYear() + '-'
            rv += str(self._value.getMonth() + 1).zfill(2) + '-'
            rv += str(self._value.getDate()).zfill(2) + 'T'
            rv += str(self._value.getHours()).zfill(2) + ':'
            rv += str(self._value.getMinutes()).zfill(2) + ':'
            rv += str(self._value.getSeconds()).zfill(2) + '.'
            rv += str(self._value.getMilliseconds()).zfill(3)
            return rv
        }
    }
})


nuage.create_class({
    __name__: 'list',
    __impl__: {

        __init__: function(self, values){
            if (values instanceof Array) {
                self._values = values
            }
            else {
                self._values = []
                for (var i = 1, len = arguments.length; i < len; i++) {
                    self._values.push(arguments[i])    
                }
            }
        },

        __iter__: function(self){
            return nuage.ListIterator(self)
        },

        get: function(self,pos) {
            if (pos < 0) {
                pos = self._values.length + pos
            }
            if ((pos < 0) || (pos > len(self))) {
                throw exc.IndexError('IndexError: list index out of range')
            }
            return self._values[pos]
        },

        set: function(self,pos,obj) {
            self._values[pos] = obj
        },

        values: function(self) {
            return self._values
        },

        clear: function(self){
            self._values.length = 0
            return self
        },

        insert: function(self,pos,obj) {
            var nv = []
            if (pos < 0)
                pos = self._values.length + pos
            if (pos < 0)
                pos = 0
            if (pos < self._values.length) {
                for (var i = 0, length = self._values.length; i < length; i++) {
                    if (i == pos) {
                        nv.push(obj)
                    }
                    nv.push(self._values[i])
                }
                self._values = nv
            }
            else {
                self._values.push(obj)
            }
        },

        append: function(self, obj) {
            self._values.push(obj)
        },

        pop: function(self, pos) {
            
            if ((len(arguments) == 1) || (len(self) == pos))
                return self._values.pop()
                
            if (pos == 0) { 
                return self._values.shift()
            }
            if (pos < 0)
                pos = len(self) + pos
            
            if ((pos < 0) || (pos > len(self)))
                throw exc.IndexError("pop index out of range")
            
            var rv = self._values[pos]

            var nv = []
            for (var i = 0, length = self._values.length; i < length; i++) {
                if (i != pos) {
                    nv.push(self._values[i])
                }
            }
            self._values = nv
            return rv
        },

        copy: function(self) {
            var rv = []
            for (var i = 0, len = self._values.length; i < len; i++) {
                rv.push(self._values[i])
            }
            return list(rv)
        },

        extend: function(self, list_){
            if (list_ instanceof __type__['window.list']) {
                for (var i = 0, length = len(list_); i < length; i++) {
                    self._values.push(list_.get(i))
                }
            }
            else {
                for (var i = 0, length = len(list_); i < length; i++) {
                    self._values.push(list_[i])
                }
            }
            return self
        },

        cut: function(self, start, stop) {
            if (start < 0) {
                start = self._values.length + start
            }
            start = Math.max(start,0)
            if (arguments.length == 1) {
                stop = self._values.length
            }
            else if (stop < 0) {
                stop = self._values.length + stop
            }
            stop = Math.min(stop,self._values.length)
            
            var rv = []
            for (var i = start; i < stop; i++) {
                rv.push(self._values[i])
            }
            return list(rv)
        },

        delete_: function(self, start, stop) {
            if (start < 0) {
                start = self._values.length + start
            }
            start = Math.max(start,0)
            if (arguments.length == 1) {
                stop = self._values.length
            }
            else if (stop < 0) {
                stop = self._values.length + stop
            }
            stop = Math.min(stop,self._values.length)
            
            var nv = []
            var i = 0
            var length = self._values.length
            for (var i = 0, length = start; i < length; i++) {
                nv.push(self._values[i])
            }
            for (var i = stop, length = self._values.length; i < length; i++) {
                nv.push(self._values[i])
            }
            self._values = nv
        },

        remove: function(self, val) {
            var nv = []
            var i = 0
            var length = self._values.length
            for (; i < length; i++) {
                if (self._values[i] !== val) {
                    nv.push(self._values[i])
                }
                else {
                    i++
                    break
                }
            }
            for (; i < length; i++) {
                nv.push(self._values[i])
            }
            self._values = nv
        },

        index: function(self, obj){
            for (var i = 0, length = self._values.length; i < length; i++) {
                if (self._values[i] === obj) {
                    return i
                }
            }
            return -1
        },

        reverse: function(self) {
            var nv = []
            for (var i = self._values.length-1; i >= 0; i--) {
                nv.push(self._values[i])
            }
            self._values = nv
        },

        sort: function(self, compare) {
            if (!(compare instanceof Function)) {
                compare = function(a,b) {
                    if (a.__lt__(b)) {
                        return -1
                    }
                    if (a.__gt__(b)) {
                        return 1
                    }
                    return 0
                }
                self._values.sort(compare)
            } 
            else {
                self._values.sort(compare)
            }
        },

        __str__: function(self) {
            return '[' + ', '.join(self) + ']'
        }
    } 
})


nuage.create_class({
    __name__: 'dict',
    __impl__: {

        __init__: function(self, values) {
            self.clear()
            if (values) {
                self.update(values)
            }
        },

        __iter__: function(self){
            var items = self.items()
            return nuage.ListIterator(list(items))
        },

        __str__: function(self) {
            var rv = "{"
            for (var i =0, l = len(self._keys); i<l; i++) {
                rv += '"'+self._keys[i]+'":'
                if (self._values[i] != null) {
                    var v = self._values[i]
                }
                else {
                    var v = self._defaults[i]
                }
                if (isinstance(self._values[i], String)) {
                    rv += '"' +v+ '"'

                }
                else {
                    rv += str(v)
                }
                if (i+1 < l) {
                    rv += ","
                } 
            }
            rv += "}"
            return rv
        },

        clear: function(self) {
            self._keys = []
            self._defaults = []
            self._values = []
        },

        keys: function(self) {
            return list(self._keys)
        },

        values: function(self) {
            var rv = list()
            for (var i = 0 in self._keys) {
                if (self._values[i] != null) {
                    rv.append(self._values[i])
                }
                else {
                    rv.append(self._defaults[i])
                }
            }
            return rv
        },

        items: function(self) {
            var rv = []
            for (var i = 0 in self._keys) {
                var _value = {}
                if (self._values[i] != null) {
                    _value[self._keys[i]] = self._values[i]
                }
                else {
                    _value[self._keys[i]] = self._defaults[i]
                }
                rv.push(_value)
            }
            return rv
        },

        to_object: function(self) {
            var rv = {}
            for (var i = 0 in self._keys) {
                if (self._values[i] != null) {
                    rv[self._keys[i]] = self._values[i]
                }
                else {
                    rv[self._keys[i]] = self._defaults[i]
                }
            }
            return rv
        },

        has_key: function(self, key) {
            return ((list(self._keys)).index(key)) >=0
        },

        get:function(self, key, default_) {
            var i =  (list(self._keys)).index(key)
            if (i < 0) {
                if (arguments.length > 2) {
                    return default_
                }
                throw exc.KeyError()
            }
            if (self._values[i] != null) {
                return self._values[i]
            }
            else {
                return self._defaults[i]
            }
        },

        set: function(self, key, value) {
            var i =  (list(self._keys)).index(key)
            if (i < 0) {
                self._keys.push(key)
                self._values.push(value)
                self._defaults.push(null)
            }
            else {
                self._values[i] = value
                self._defaults[i] = null
            }
            return self
        },

        setdefault:function(self, key, default_) {
            var i =  (list(self._keys)).index(key)
            if (i < 0) {
                self._keys.push(key)
                self._values.push(null)
                self._defaults.push(default_)
                return default_
            }
            else {
                self._defaults[i] = default_
                if (self._values[i] != null) {
                    default_ = self._values[i]
                }
                return default_
            }
        },

        delete_: function(self,key) {
            var i =  (list(self._keys)).index(key)
            if (i < 0) {
                return
            }
            self._keys.pop(i)
            self._values.pop(i)
            self._defaults.pop(i)
        },

        update: function(self, obj) {
            if (obj instanceof Array) {
                obj = list(obj)
            }
            if (obj instanceof __type__['window.dict']) {
                for (var k in obj._keys) {
                    if (self.has_key(obj._keys[k])) {
                        self._defaults[obj._keys[k]] = obj._defaults[obj._keys[k]]
                        self._values[obj._keys[k]] = obj._values[obj._keys[k]]
                    }
                    else {
                        self._keys.push(obj._keys[k])
                        var i = list(obj._keys).index(k)
                        self._defaults.push(obj._defaults[i])
                        self._values.push(obj._values[i])
                    }
                }
            }
            else if (obj instanceof list) {
                for (var i = 0, l = len(obj); i < l; i++) {
                    var oo = obj.get(i)
                    if (len(oo) != 2) {
                        throw exc.ValueError("dictionnary update")
                    }
                    if (obj instanceof list) {
                        self_values[oo.get(0)] = oo.get(1)
                        if (self.has_key(oo.get(0))) {
                            self._defaults[oo.get(0)] = null
                            self._values[oo.get(0)] = oo.get(1)
                        }
                        else {
                            self._keys.push(oo.get(0))
                            self._defaults.push(null)
                            self._values[k].push(oo.get(1))
                        }
                    }
                    else {
                        self_values[oo[0]] = oo[1]
                        if (self.has_key(oo[0])) {
                            self._defaults[oo[0]] = null
                            self._values[oo[0]] = oo[1]
                        }
                        else {
                            self._keys.push(oo[0])
                            self._defaults.push(null)
                            self._values[k].push(oo[1])
                        }
                    }
                }
            } 
            else {
                for (var k in obj) {
                    if (self.has_key(k)) {
                        self._defaults[k] = null
                        self._values[k] = obj[k]
                    }
                    else {
                        self._keys.push(k)
                        self._defaults.push(null)
                        self._values.push(obj[k])
                    }
                }
            }
        }
    }
})


nuage.create_class({
    __name__: 'ListIterator',
    __module__: 'nuage',
    __impl__: {

        __init__: function(self, list_) {
            self.idx = 0
            self.list = list_
        },

        next: function(self) {
            if (self.idx >= len(self.list)) {
                throw exc.StopIteration()
            }
            var rv = self.list.get(self.idx)
            self.idx++
            return rv
            
        }
    }
})

nuage.create_module({
    __name__: 'json',
    __impl__: {

        dumps: function(obj, options, done) {
            if (arguments.length == 3) {
                if (done.index(obj) >= 0) {
                    return '"__recurs__"'
                }
                var opt = options
            }
            else {
                var opt = Object.extend(options ||
                        {}, {
                        display_function: false,
                        display_null: true,
                        display_private: false})
                done = list()
            }
            done.append(obj)
            if (isinstance(obj, list)) {
                obj = obj._values
            }
            if (isinstance(obj, dict)) {
                obj = str(obj)
            }
            var obj_ =  !(obj instanceof Array)
            var rvlist = list() 
            var s = ''
            for (var p in obj) {
                
                if (!obj_ || (obj_ && opt.display_private ||
                        (!opt.display_private && (p.cut(1) != '_')))) {
                    var type = typeof(obj[p])//.lower()
                    s = ''
                    switch (type) {
                        case 'object':
                        if (obj[p] != null) {
                            if (obj[p] instanceof Date) {
                                if (obj_) {
                                    s += '"' + p + '":"'
                                }
                                s += obj[p].getFullYear() + '-'
                                s += str(obj[p].getMonth() + 1).zfill(2) + '-'
                                s += str(obj[p].getDay()).zfill(2) + 'T'
                                s += str(obj[p].getHours()).zfill(2) + ':'
                                s += str(obj[p].getMinutes()).zfill(2) + ':'
                                s += str(obj[p].getSeconds()).zfill(2) + '.'
                                s += str(obj[p].getMilliseconds()).zfill(3) + '"'
                            }
                            else {
                                if (obj_) {
                                    s += '"' + p + '":'
                                }
                                if (isinstance(obj[p],datetime)) {
                                    s += '"' + obj[p].isoformat() + '"'
                                }
                                else {
                                    s += json.dumps(obj[p], opt, done)
                                }
                            }
                        }
                        else {
                            if (opt.display_null) {
                                if (obj_) {
                                    s += '"' + p + '":'
                                }
                                s += 'null'
                            }
                        }
                        break
                        case 'function':
                        if (opt.displayFunction) {
                            if (obj_) {
                                s += '"' + p + '":'
                            }
                            s += obj[p]
                        }
                        break
                        case 'boolean':
                        case 'number':
                        if (obj_) {
                            s += '"' + p + '":'
                        }
                        s += obj[p]
                        break
                        default:
                        if (obj_) {
                            s += '"' + p + '":'
                        }
                        s += '"' + obj[p] + '"'
                        break
                    }
                    if (len(s)) {
                        rvlist.append(s)
                    }
                }
            }
                
            if (obj_) {
                var rv = '{' + ','.join(rvlist) + '}'
            }
            else {
                var rv = '[' + ','.join(rvlist) + ']'
            }
            return rv
        },

        load: function(str_) {
            return eval("("+str_+")")
        }
    }
})
nuage.create_module({
    __name__: 'base64',
    __impl__: {

        b64encode: function(str){
            // non standard
            //https://developer.mozilla.org/en/DOM/window.btoa
            return btoa(str)
        },

        b64decode: function(b64){
            // non standard
            //https://developer.mozilla.org/en/DOM/window.atob
            return atob(b64)
        },
    }
})

nuage.create_module({
    __name__: 'evt.dom',
    __impl__: {

        hooked: list(),

        hook: function(node, name, callback, args__) {
            var args = list()
            for ( var i = 3, l = len(arguments); i < l ; i++ ) {
                args.append(arguments[i])
            }
            function cb(evt) {
                var a = args.copy()
                evt = evt||window.event
                a.insert(0,evt)
                try {
                    callback.apply(window,a.values())
                }
                catch(e) {
                    print(e)
                    /*
                    throw e
                    */
                }
                evt.stopPropagation()
            }
            evt.dom.hooked.set(callback,cb)
            if ( isinstance(node,String) ) {
                node = $(node)
            }
            if (node.addEventListener) {
                node.addEventListener(name, cb, false)
            } 
            else {
                node.attachEvent("on" + name, cb)
            }
        },

        unhook: function(node, name, callback) {
            if (isinstance(node, String)) {
                node = $(node)
            }
            var cb = evt.dom.hooked.get(callback, null)
            if (cb) {
                evt.dom.hooked.delete_(callback)
                if (node.removeEventListener) {
                    node.removeEventListener(name, callback, false)
                } 
                else {
                    node.detachEvent("on" + name, callback)
                }
            }
        }
    }
})


nuage.create_class({
    __module__:'evt',
    __name__: 'Evt',
    __impl__: {

        __init__: function(self){
            self.enabled = true
            self._hooks = dict()
        },

        hook: function(self, name, callback, data__) {
            var data = list()
            for ( var i = 3, l = len(arguments); i < l; i++ ) {
                data.append(arguments[i])
            }
            var l = self._hooks.get(name,null)
            if (l == null) {
                l = list()
            }
            l.append([callback, data])
            self._hooks.set(name,l)
        },

        unhook: function(self, name, callback){
            callbacks = self._hooks.get(name,null)
            if (callbacks != null) {
                for ( var i = 0; i < len(callbacks); i++ ) {
                    if ( callbacks.get(i)[0] == callback ){
                        callbacks.delete_(callback)
                    }
                }
            }
        },

        emit: function(self, name, args__) {
            if (self.enabled) {
                callbacks = self._hooks.get(name,null)
                if ( callbacks != null ) {
                    for (var i = 0, l = len(callbacks); i < l ; i++) {
                        var callback = callbacks.get(i)
                        var args = list()
                        for (var j = 2, l2 = len(arguments); j < l2; j++) {
                            args.append(arguments[j])
                        }
                        args = args.extend(callback[1])
                        callback[0].apply(window, args.values());
                    }
                }
            }
        }
    }
})

nuage.create_module({
    __name__:'db',
    __impl__: {
        datastore: '/',
        format: 'json',
        _ms: dict(),
        _ds: dict(),

        create_db: function(name) {
            var ds = db._ds.get(name,null)
            if (!ds) {
                ds = dict()
                db._ds.set(name,ds)
            }
            return ds
        },

        _serializers: dict(),
        get_serializer: function(format) {
            var rv = db._serializers.get(format,null)
            if (rv == null) {
                rv = db[format.upper()+'Serializer']()
                db._serializers.set(format,rv)
            }
            return rv
        },

        _connector: null,
        get_connector: function() {
            if ( db._connector == null ) {
                db._connector = db.RestConnector()
            }
            return db._connector
        },

        register_model: function(class_) {
            db.create_db(class_.__db__)
            var ms = db._ms.get(class_.__db__,null)
            if (!ms) {
                ms = dict()
            }
            ms.set(class_.__table__, class_)
            db._ms.set(class_.__db__,ms)
        },

        get_model: function(schema,name) {
            return db._ms.get(schema,dict()).get(name)
        },

        find_by_id: function(class_,object_id) {
            return db.find_one(class_,{'object_id':object_id})
        },

        find_one: function(class_,filter) {
            var rv = db.find(class_,filter,1)
            if (len(rv)){
                return rv.pop(0)
            }
            else {
                return null
            }
        },

        find: function(model,filter,limit) {
            var rv = db.Request(model,filter,limit)
            return rv.get_result()
        },

        get: function(class_, key,ref) {
            function register(result) {
                db.set(result)
                return result
            }
            return db.get_connector().get(class_,key,ref).add_callback(register)
        },

        list: function(class_,ref,filter) {
            return db.get_connector().list(class_,ref,filter)
        },

        set: function(instance) {
            var class_ = instance.__class__
            var _ds = db._ds.get(class_.__db__,null)
            if (!_ds) {
                db.create_db(class_.__db__)
                _ds = db._ds.get(class_.__db__,null)
            }
            var c = _ds.get(class_,null)
            if ( !c ) {
                c = dict()
                _ds.set(class_,c)
            }
            c.set(instance.object_id,instance)
        },

        setdefault: function(instance) {
            var class_ = instance.__class__
            var _ds = db._ds.get(class_.__db__,null)
            if (!_ds) {
                db.create_db(class_.__db__)
                _ds = db._ds.get(class_.__db__,null)
            }
            var c = _ds.get(class_,null)
            if ( !c ) {
                c = dict()
                _ds.set(class_,c)
            }    
            c.setdefault(instance.object_id,instance)
        },

        uncache: function(instance) {
            var class_ = instance.__class__
            var _ds = db._ds.get(class_.__db__)
            if (!_ds) {
                return
            }
            var c = _ds.get(class_,null)
            if ( !c ) {
                return
            }    
            c.delete_(instance.object_id)
        },

        create: function(instance) {
            db.set(instance)
            return db.get_connector().create(instance)
        },

        update: function(instance) {
            db.set(instance)
            return db.get_connector().update(instance)
        },

        delete_: function(instance) {
            db.uncache(instance)
            return db.get_connector().delete_(instance)
        }
    }
})

nuage.create_module({
    __name__:'db.error',
    __impl__: {
        invalid: '{{name}} is invalid',
        required: '{{name}} is missing',
        choices: '{{name}} must be one of ({% for value in choices %}' +
            '{{value}}{%if not for.last %},{%endif%}{%endfor%})',
        reg_ex: '{{name}} has an invalid format',
        'int':'{{name}} must be numeric',
        'float':'{{name}} must be float',
        'bool':'{{name}} must be a boolean',
        min_len:'{{name}} is too short',
        max_len:'{{name}} is too long',
        min_size:'{{name}} is too short',
        max_size:'{{name}} is too long',
        singleline: '{{name}} is not multiline',
        regex: '{{name}} has an invalid format'
    }
})

nuage.create_class({
    __module__:'db',
    __name__: 'Request',
    __impl__: {

        __init__: function(self,model,filter,limit) {
            self.model = model
            self.filter = filter
            self.limit = limit
        },

        get_instances: function(self) {
            var rv = db._ds.get(self.model.__db__,null) //ds
            if (rv) {
                rv = rv.get(self.model,null) // instances
            }
            return rv
        },

        get_result: function(self) {
            var rv = list()
            var key = null
            if ( self.limit != null ) {
                if ( self.limit <= 0 ) {
                    return rv
                }
            }
            if ( isinstance(self.filter,String)) {
                key = self.filter
            }
            var c = self.get_instances()
            if (c) {
                if ( key ) {
                    key = c.get(key)
                    if ( key ) { // key is now an instance...
                        rv.append(key)
                    }
                }
                else {
                    self.query_filter(rv,c)
                }
            }
            return rv
        },

        match_: function(self, key, model, filter) {
            function match_filter(f, o) {
                try{
                    if (isinstance(f, RegExp)) {
                        return f.match(o)
                    }
                    else {
                        return o == f
                        //assume object for operation < >,...
                    }
                }
                catch(e) {
                    print('db.Request.match_:', e.message, '\n',
                          json.dumps(f), '\n\n', json.dumps(o))
                    return false
                }
            }
            if (key.index('.')>=0) {
                var s = key.split('.')
                var o = model
                for ( var i = 0, l = len(s); i < l; i++ ) {
                    try {
                        o = o[s[i]]
                    }
                    catch(e){
                        return false
                    }
                }
                return match_filter(filter.get(key),o)
            }
            else {
                return match_filter(filter.get(key),model[key])
            }
        },
        query_filter: function(self, result, collection) {
            var filter = dict(self.filter)
            key = filter.keys().values()
            var model = collection.values().values()
            for (var i in model) { // model is object
                var match_ = true
                for (var j in key) {
                    match_ = self.match_(key[j],model[i],filter)
                    if (!match_) {
                        break
                    }
                }
                if (match_) {
                    if (self.limit == null) {
                        result.append(model[i])
                    }
                    else {
                        if (len(result) <= self.limit) {
                            result.append(model[i])
                        }
                        if (len(result) == self.limit) {
                            break
                        }        
                    }
                }
            }
        }
    }
})


nuage.create_class({
    __module__:'db',
    __name__: 'RestConnector',
    __impl__: {

        __init__: function(self) {
            self.root = db.datastore
            self.format = db.format
        },

        _construct: function(self, model_, data, default_) {
            try {
                if ( data['object_id'] ) {
                    data['object_id'] = data['object_id']['$oid']
                }
                for ( var f in model_.__fields__ ) {
                    if ( isinstance(model_.__fields__[f],db.Ref) ) {
                        var field = model_.__fields__[f]
                        if ( data[f] && !isinstance(data[f],field.ref) ) {
                            var refi = self._construct(field.ref,data[f],true)
                            if ( refi ) {
                                data[f] = refi
                            }
                            else {
                                print('error construct '+f,"\n",refi, json.dumps(data[f]) )
                                //delete data[f]
                            }
                        }
                    }
                }
                try {
                    var rv = model_(data)
                    if (default_) {
                        db.setdefault(rv)
                    }
                    else {
                        db.set(rv)
                    }
                    var ref = db.find(schema.Field,{'reference':model_})
                    for ( var i=0, l = len(ref); i < l; i++ ) {
                        if ( data[ref.get(i).ref.name+'_list'] ) {
                            var mn = ref.get(i).ref.name
                            var kl = mn+'_list'
                            for ( var k in data[kl] ) {
                                data[kl][k][mn][ref.get(i)['ref'].split('.')[0]] = rv
                                var class_ = db.get_model('schema',mn)
                                self._construct(class_,data[kl][k][mn],true)
                            }
                        }
                    }            
                    return rv
                }
                catch(ee) {
                    //print('restconnector:',ee.message)
                }
            }
            catch(e) {
                print(e.message)
            }
        },

        _load_schema: function(self, data) {
            if ( data['object_id'] ) {
                data['object_id'] = data['object_id']['$oid']
            }
            var s = schema.Schema(data)
            for ( var m in data.model_list ) {
                var md = data.model_list[m]['model']
                if ( md['object_id'] ) {
                    md['object_id'] = md['object_id']['$oid']
                }
                md['schema'] = s
                var model = schema.Model(md)
                for ( var f in md.field_list ) {
                    var fd = md.field_list[f]['field']
                    if ( fd['object_id'] ) {
                        fd['object_id'] = fd['object_id']['$oid']
                    }
                    fd['model'] = model
                    if (fd['reference']) {  
                        id = fd['reference']["object_id"]["$oid"]
                        fd['reference'] = db.find_by_id(schema.Model,id)
                    }
                    var field = schema.Field(fd)
                }
            }
            return s
        },

        get: function(self, model, key, ref) {
            function _parse(result) {
                var o = json.load(result.responseText.replace(/"_id"/g,'"object_id"'))
                if ( ref ) {
                    for ( var f in model.__fields__ ) {
                        if (isinstance(model.__fields__[f],db.Ref) && model.__fields__[f].key ) {
                            var ref_key = f
                            o[model.__table__][ref_key] = ref
                            break
                        }
                    }
                }
                if ( model == schema.Schema ) {
                    rv = self._load_schema(o[model.__table__])
                }
                else {
                    rv = self._construct(model,o[model.__table__],false)
                }
                return rv
            }
            var f = defer.HTTPClientFactory()
            var m = self.root + model.__db__ + '/' + model.__table__
            if ( ref ) {
                var m = self.rest_url(ref) + '/' + model.__table__
            }
            else {
                var m = self.root + model.__db__ + '/' + model.__table__
            }
            reactor.connect_http({
                    url: m + '/' + key + '.' + self.format,
                    method: 'get'
                    },f )
            return f.defer.add_callback(_parse)
        },

        list: function(self, model, ref, filter) {
            function _parse(result) {
                result = json.load(result.responseText.replace(
                                /"_id"/g,'"object_id"'))
                var rv = list()
                if ( ref ) {
                    for ( var f in model.__fields__ ) {
                        if (isinstance(model.__fields__[f],db.Ref) && model.__fields__[f].key ) {
                            var ref_key = f
                            break
                        }
                    }
                }
                for ( var i in result ) {
                    var data = result[i][model.__table__]
                    try {
                        if ( ref ) {
                            data[ref_key] = ref
                        }
                        var m = self._construct(model,data,false)
                        rv.append(m)
                    }
                    catch(e) {
                        print(e)
                        //print(json.dumps(result[i][model.__table__]))
                        //print('Exc: '+ json.dumps(e))
                    }

                }
                return rv
            }
            if ( ref ) {
                var m = self.rest_url(ref) + '/' + model.__table__
            }
            else {
                var m = self.root + model.__db__ + '/' + model.__table__
            }
            var f = defer.HTTPClientFactory()
            reactor.connect_http({
                    url: m  + '.' + self.format,
                    method: 'get'},f )
            return f.defer.add_callback(_parse,ref
                ).add_errback(function(failure) { print(failure.get_errormessage()) })
        },

        rest_url: function(self, model) {

            function impl(m, parent) {
                var key = m.__key__()
                if ( isinstance(key,list) ) {
                    var ref = ''
                    var lkey = list()
                    var k = key.values()
                    var keyname = m.__keyname__().values()
                    var rv = list()
                    for ( var i = 0, l = len(key); i<l; i++ ) {
                        if ( isinstance(k[i],db.Model) ) {
                            rv.append('/'.join(impl(k[i],true)))
                            //rv.append(keyname[i])
                        }
                        else {
                            lkey.append(k[i])
                        }
                    }
                    if ( len(ref) ) {
                        rv.append(ref)
                    }
                    if ( parent ) {
                       rv.append(m.__class__.__table__)
                    }
                    rv.append(','.join(lkey))
                    return rv
                }
                else {
                    var rv = list()
                    rv.append(m.__class__.__table__)
                    rv.append(key)
                    return rv
                }
            }
            return self.root + model.__class__.__db__ + '/' +
                '/'.join(impl(model,true)) 
        },

        drop_ref: function(self, model) {
            var key = model.__key__()
            if ( isinstance(key, list) ) {
                var keyname = model.__keyname__().values()
                for ( var i = 0, l = len(key); i<l; i++ ) {
                    if ( isinstance(key.get(i),db.Model) ) {
                        var field = keyname[i]
                        delete model[field]
                    }
                }
            }
            return model
        },

        create: function(self, model) {
            model.validate() //throw an error if model is not valid
            var url = self.rest_url(model)+ '.' + self.format
            self.drop_ref(model)
            var data = db.get_serializer(self.format).serialize(model)
            var f = defer.HTTPClientFactory()
            reactor.connect_http({
                url: url,
                method: 'post',
                postdata: data,
                headers: {
                    'Content-type':'text/'+self.format+'; charset=utf-8'
                }
            }, f)
            return f.defer.add_callback(function (){db.uncache(model)})
        },

        update: function(self, model){
            // throw an exc if model if invalid
            var data = db.get_serializer(self.format).serialize(model)
            var f = defer.HTTPClientFactory()
            var url = self.rest_url(model)+ '.' + self.format
            reactor.connect_http({
                url: url,
                method: 'put',
                postdata: data,
                headers: {
                    'Content-type':'text/'+self.format+'; charset=utf-8'
                }
            }, f)
            return f.defer
        },

        delete_: function(self, model){
            var f = defer.HTTPClientFactory()
            var url = self.rest_url(model)+ '.' + self.format
            var key = model.__key__()
            reactor.connect_http({
                url: url,
                method: 'delete'
            }, f)
            return f.defer
        }
    }
})


nuage.create_class({
    __module__:'db',
    __parent__: exc.Exception,
    __name__: 'ConstraintError',
    __impl__: {

        __init__: function(self, message){
            print('ConstraintError:', message)
            exc.Exception.__init__(self, message)
        }
    }
})


nuage.create_class({
    __module__:'db',
    __parent__: exc.Exception,
    __name__: 'ConstraintErrorlist',
    __impl__: {

        __init__: function() {
            self.errors = list()
        },

        append: function(self,error) {
            self.errors.append(error)
        },

        check: function(self) {
            if (len(self.errors)) {
                throw self
            }
        }
    }
})


nuage.create_class({
    __module__: 'db.constraint',
    __name__: 'Constraint',
    __impl__: {

        __init__: function(self,key) {
            self.key = key || 'invalid'
        },

        raise: function(self,field, key) {
            key = key || self.key || 'invalid'
            throw db.ConstraintError(self.compile_error(field,key))
        },

        compile_error: function(self,field,key,context) {
            var tpl = nuage.Template(db.error[key]||db.error['invalid'])
            return tpl.render(nuage.Context(Object.extend(
                {name:field.name},context||{})))
        }
    }
})


nuage.create_class({
    __module__:'db.constraint',
    __parent__: db.constraint.Constraint,
    __name__: 'Required',
    __impl__: {

        __init__: function(self, key) {
            self.key = key || 'required'
        },

        check: function(self, field, value){
            if (field.empty(value)) {
                self.raise(field)
            }
            return value
        }
    }
})


nuage.create_class({
    __module__:'db.constraint',
    __parent__: db.constraint.Constraint,
    __name__: 'Choices',
    __impl__: {

        __init__: function(self, key) {
            self.key = key || 'choices'
        },

        check: function(self, field, value) {
            if (!field.empty(value)) {
                if ( field.choices.index(value) < 0 ) {
                    self.raise(field)
                }
            }
            return value
        }
    }
})
nuage.create_class({
    __module__:'db.constraint',
    __parent__: db.constraint.Constraint,
    __name__: 'Int',
    __impl__: {

        __init__: function(self, key) {
            self.key = key || 'int'
        },

        check: function(self, field, value) {
            if (!field.empty(value)) {
                try {
                    value = parseInt(value, 10)
                } 
                catch (e) {
                    self.raise(field)
                }
                if (value > field.min) {
                    self.raise(field, 'min')
                }
                if (value > field.max) {
                    self.raise(field, 'max')
                }
            }
            return value
        }
    }
})

nuage.create_class({
    __module__:'db.constraint',
    __parent__: db.constraint.Constraint,
    __name__: 'Float',
    __impl__: {

        __init__: function(self, key) {
            self.key = key || 'float'
        },

        check: function(self, field, value) {
            if (!field.empty(value)) {
                try {
                    value = parseFloat(value, 10)
                } 
                catch (e) {
                    self.raise(field)
                }
                if (value > field.min) {
                    self.raise(field, 'min')
                }
                if (value > field.max) {
                    self.raise(field, 'max')
                }
            }
            return value
        }
    }
})


nuage.create_class({
    __module__:'db.constraint',
    __parent__: db.constraint.Constraint,
    __name__: 'Str',
    __impl__: {

        __init__: function(self, key) {
            self.key = key || 'invalid'
        },

        check: function(self, field, value) {
            if ( !field.empty( value) ) {
                value = str(value)
                if ( field.strip ) {
                    value = value.strip()
                }
                if ( len(value) < field.min_len ) {
                    self.raise(field,'min_len')
                }
                if ( len(value) > field.max_len ) {
                    self.raise(field,'max_len')
                }
                if ( !field.multiline && (value.index('\n') >= 0) ) {
                    self.raise(field)
                }
            }
            return value
        }
    }
})

nuage.create_class({
    __module__:'db.constraint',
    __parent__: db.constraint.Constraint,
    __name__: 'Bool',
    __impl__: {

        __init__: function(self, key){
            self.key = key || 'bool'
        },

        check: function(self, value) {
            if (!field.empty(value)) {
                if (isinstance(value, Boolean)) {
                    return value
                }
                value = str(value)
                if (!(/^(true|false|0|1|yes|no)+$/gi).match(value)) {
                    self.raise(field)
                }
                value = ((list('T', '1', 'Y')).index(value.cut(1).upper()) >= 0)
            }
            return value
        }
    }
})


nuage.create_class({
    __module__:'db.constraint',
    __parent__: db.constraint.Constraint,
    __name__: 'RegEx',
    __impl__: {
        __init__: function(self, regex, key) {
            self.key = key || 'regex'
            self.regex = regex
        },
        check: function(self, field, value) {
            if (!field.empty(value)) {
                if (!regex.match(value)) {
                    self.raise(field)
                }
            }
            return value
        }
    }
})


nuage.create_class({
    __module__:'db',
    __name__: 'Field',
    __impl__: {
        __init__: function(self, options) {
            self.key=false
            self.default_=null
            self.required=false
            self.choices=null
            self._constraints=[]
            //self.indexed=false
            Object.extend(self,options||{})
            if ( self.key ) {
                 self.required = true
            }
            if ( self.required ) {
                self._constraints.push(db.constraint.Required(self))
            }
            if ( self.choices != null ) {
                self._constraints.push(db.constraint.Choices(self))
            }
        },

        set: function(self, value){
            return self.validate(value)
        },

        empty: function(self, value) {
            if ( value == null ) {
                return true
            }
            return ( len(value) == 0 )
        },

        validate: function(self, value) {
            for ( var i = 0, l = len(self._constraints); i < l; i ++ ) {
                value = self._constraints[i].check(self,value)
            }
            return value
        }
    }
})


nuage.create_class({
    __module__:'db',
    __parent__: db.Field,
    __name__: 'Str',
    __impl__: {
        __init__: function(self, options){
            var options = Object.extend({
                multiline: false,
                strip: true,
                min_len: 0,
                max_len: 8000,
                reg_ex:null,
                constraints: [db.constraint.Str()]
            }, options || {})
            
            db.Field.__init__(self, options)
            if ( options.reg_ex ) {
                constraints.push(db.constraint.RegEx(option.reg_ex))
            }
        }
    }
})


nuage.create_class({
    __module__:'db',
    __parent__: db.Field,
    __name__: 'Int',
    __impl__: {
        __init__: function(self, options){
            var options = Object.extend({
                multiline: false,
                min_value: -2147483648,
                max_value: 2147483647
            }, options || {})
            db.Field.__init__(self, options)
        }
    }
})


nuage.create_class({
    __module__:'db',
    __parent__: db.Field,
    __name__: 'Bool',
    __impl__: {
        __init__: function(self, options){
            var options = Object.extend({
                constraints: [db.constraint.Bool()]
            }, options || {})
            db.Field.__init__(self, options)
        }
    }
})


nuage.create_class({
    __module__:'db',
    __parent__: db.Str,
    __name__: 'ObjectId',
    __impl__: {
        __init__: function(self, options){
            options = Object.extend({key:true}, options)
            options.default_ = function(){
                var rv="_js"
                var str = 'abcdefghijklmnopqrstuvwxyz0123456789'
                for ( var i in range(22) ) {
                    rv += str[rand(36)]
                }
                return rv
            }
            db.Field.__init__(self, options)
        }
    }
})


nuage.create_class({
    __module__:'db',
    __parent__: db.Str,
    __name__: 'Password'
})


nuage.create_class({
    __module__:'db',
    __parent__: db.Field,
    __name__: 'DateTime',
    __impl__: {
        __init__: function(self, opt) {
            
            if (opt.now) {
                opt.default_ = function(){
                    return datetime.now()
                } 
            }
            db.Field.__init__(self, opt)
        },
        set: function(self, value){
            if ( isinstance(value, String) ) {
                var v = re.compile('([0-9]{4})-([0-9]{2})-([0-9]{2})(\\s|T)?'+
                            '([0-9]{2})?:?([0-9]{2})?:?([0-9]{2})?.?([0-9]{3})?','g')
                var m = v.search(value)
                
                if (m != null) {
                    value = datetime(int_(m[1]||0),int_(m[2]||0),int_(m[3]||0),
                            int_(m[5]||0),int_(m[6]||0),int_(m[7]||0),int_(m[8]||0))
                }
                else {
                    value = datetime(value)
                }
            }
            return db.Field.validate(self,value)
        }
    }
})


nuage.create_class({
    __module__:'db',
    __name__: 'Ref',
    __parent__: db.Field,
    __impl__: {
        __init__: function(self, opt) {
            self.ref = opt.ref
            db.Field.__init__(self, opt)
        }
    }
})


nuage.create_class({
    __module__:'db',
    __name__: 'Model',
    __static__: {
        __db__:'default',
        __table__: null
    },
    __impl__: {
        __init__: function(self, values) {
            //db.register_model(self.__class__)
            self._evt = evt.Evt()
            self._key = list()
            var fields = self.__class__.__fields__
            for ( var k in fields ) {
                var field = fields[k]
                field.name = k
                if (field.key) {
                    self._key.append(field)
                }
                if ( values[k] != null ) {
                    if (isinstance(fields[k],db.Ref)) {
                        if ( isinstance(values[k],fields[k].ref)) {
                            self.set(k,values[k])
                        }
                        else {
                            self.set(k,fields[k].ref(values[k]))
                        }
                    }
                    else {
                        self.set(k,values[k])
                    }
                }
                else {
                    var d = field.default_
                    if (callable(d)) {
                        self.set(k, d())
                    }
                    else {
                        self.set(k, d)
                    }
                }
            }
            if (len(self._key) < 1) {
                var _id = db.ObjectId()
                _id.name = 'object_id'
                self.__class__.__fields__['object_id'] = _id
                if ( values['object_id'] ) {
                    self.set('object_id', values['object_id'])
                }
                else {
                    self.set('object_id', _id.default_())
                }
                self._key.append(self.__class__.__fields__['object_id'])
            }
            else {
                var _id = db.ObjectId({key: false})
                _id.name = 'object_id'
                self.__class__.__fields__['object_id'] = _id
                if ( values['object_id'] ) {
                    self.set('object_id', values['object_id'])
                }
                else {
                    self.set('object_id', _id.default_())
                }
            }
            if (len(self._key) == 1) {
                self._key = self._key.get(0)
            }
            db.set(self)
        },

        set: function(self, name, value) {
            var k = dict(self.__class__.__fields__).keys()
            if (k.index(name) >= 0) {
                self._evt.emit('field-changing',name,value)
                self[name] = self.__class__.__fields__[name].set(value)
            }
            else {
                throw exc.AttributeError()
            }
            self._evt.emit('field-changed',name,self[name])
        },

        __key__: function(self, with_ref) {
            if (arguments.length == 1) {
                with_ref=true
            }
            if (isinstance(self._key, list)) {
                var rv = list()
                var k = self._key.values()
                for ( i in k ) {
                    if ( with_ref || (!with_ref && 
                            !isinstance(self[k[i].name],db.Model) )) {
                        rv.append(self[k[i].name])
                    }
                }
                if ( !with_ref ) {
                    if (len(rv)==1){
                        rv = rv.get(0)
                    }
                }
                return rv
            }
            else {
                return self[self._key.name]
            }
        },

        __keyname__: function(self) {
            if (isinstance(self._key, list)) {
                var rv = list()
                var k = self._key.values()
                for ( i in k ) {
                    rv.append(k[i].name)
                }
                return rv
            }
            else {
                return self._key.name
            }
        },

        validate: function(self) {
            var e = db.ConstraintErrorlist()
            var fields = self.__class__.__fields__
            for ( var k in fields ) {
                var field = fields[k]
                try {
                    self.set(k,self[k])
                }
                catch(exc) {
                    if ( isintance(exc,db.ConstraintError)) {
                        e.append(exc)
                    }
                    else {
                        throw exc
                    }
                }
            }
        }
    }
})

nuage.create_class({
    __module__:'db',
    __name__: 'JSONSerializer',
    __impl__: {

        serialize: function(self, model, serialization_info) {
            m = {}
            m[model.__class__.__table__] = model
            return self.dumps(m)
        },

        dumps: function(self, model, done) {
            if (arguments.length == 3) {
                if (done.index(model) >= 0) {
                    if ( model['object_id'] ) {
                        return '{"_id":{"$oid":"'+
                            model['object_id']+
                            '"}}'
                    }
                    else {
                        return '{}'
                    }
                }
            }
            else {
                done = list()
            }
            done.append(model)
            if (isinstance(model, list)) {
                model = model._values
            }
            if ( isinstance(model, dict)) {
                model = str(model)
            }
            var obj_ =  !(model instanceof Array)
            var rvlist = list() 
            var s = ''
            for (var p in model) {
                if (model[p] == null) {
                    continue;
                }
                if ( p.cut(1) == '_') {
                    continue;
                }
                s = ''
                var type = typeof(model[p])
                switch (type) {
                    case 'object':
                    if (model[p] instanceof Date) {
                        if (obj_) {
                            s += '"' + p + '":"'
                        }
                        s += model[p].getFullYear() + '-'
                        s += str(model[p].getMonth() + 1).zfill(2) + '-'
                        s += str(model[p].getDay()).zfill(2) + 'T'
                        s += str(model[p].getHours()).zfill(2) + ':'
                        s += str(model[p].getMinutes()).zfill(2) + ':'
                        s += str(model[p].getSeconds()).zfill(2) + '.'
                        s += str(model[p].getMilliseconds()).zfill(3) + '"'
                    }
                    else {
                        if (obj_) {
                            s += '"' + p + '":'
                        }
                        if ( isinstance(model[p],datetime) ) {
                            s += '"' + model[p].isoformat() + '"'
                        }
                        else {
                            s += self.dumps(model[p], done)
                        }
                    }
                    break
                    case 'function':
                    break
                    case 'boolean':
                    case 'number':
                    if (obj_) {
                        s += '"' + p + '":'
                    }
                    s += model[p]
                    break
                    default:
                    if ( p == 'object_id') {
                        if ( model[p].cut(1) != '_') {
                            if (obj_) {
                                s += '"_id":{"$oid":'
                            }
                            s += '"' + model[p] + '"}'
                        }
                    }
                    else {
                        if (model[p]) {
                            if (obj_) {
                                s += '"' + p + '":'
                            }
                            s += '"' + model[p] + '"'
                        }
                    }
                    break
                }
                if (len(s)) {
                    rvlist.append(s)
                }
            }
            if (obj_) {
                rv = '{' + ','.join(rvlist) + '}'
            }
            else {
                rv = '[' + ','.join(rvlist) + ']'
            }
            return rv
        }
    }
})

nuage.create_module({
    __name__: 'route', __impl__: {
        _views: dict(), _maps: list(), register: function(name, view) {
            route._views.set(name, view)
        },

        connect: function(routepath, defaults_) {
            route._maps.append(route.Route(routepath, defaults_))
        },

        render: function(data) {
            try {
                var maps = route._maps
                for (var i = 0, l = len(maps); i<l; i++) {
                    var c = maps.get(i)
                    if (c.rev_match(data)) {
                        var hash = str(c.routepath)
                        hash = hash.replace(re.compile(':[^}]+}', 'g'), '}')
                        var k = data.keys().values()
                        for (var i = 0, l = len(k); i<l; i++) {
                            try {
                                hash = hash.replace(re.compile('{'+k[i]+'}',
                                    'g'), data.get(k[i]))
                            }
                            catch(exc) {
                                print('--- '+ json.dumps(exc))
                            }
                        }
                        //dispatch
                        return '#'+hash
                    }
                }
            }
            catch(e) {
                print("error building route:", e.message)
                return '#'
            }
        },

        redirect: function(data) {
            window.location=route.render(data)
        },

        parse_hash: function(hash) {
            hash = hash || window.location.hash
            var m
            var maps = route._maps
            for (var i = 0, l = len(maps); i<l; i++) {
                var croute = maps.get(i)
                m = croute.match(hash)
                if (m) {
                    return m
                }
            }
            return null
        },

        dispatch: function(hash) {
            var m = route.parse_hash(hash)
            print('dispaching route ' + hash)
            if (m) {
                //print(m)
                route._views.get(m.get('view'))['do_'+m.get('action')](m)
            }
            else {
                print('no route found')
            }
        }
    }
})


nuage.create_class({
    __module__:'route', __name__: 'Route', __impl__: {

        __init__: function(self, routepath, defaults_){
            self.routepath = routepath
            var path_re = '^#?'
            var routelist = dict()
            var r = routepath.split(/\{|\}/g)
            var intag = false
            var pos = 1
            //var reg
            for (var i in r) {
                if (intag) {
                    var s = r[i].split(':')
                    if (len(s) > 1) {
                        path_re += '('+s[1]+')'
                    }
                    else {
                        path_re += '([a-z0-9_\\-]*)'
                    }
                    //path_re += reg
                    routelist.set(s[0], pos)
                    pos++
                }
                else {
                    path_re += r[i]
                }
               intag = !intag
            }
            self.defaults_ = defaults_
            self.path_re = path_re + '$'
            self.routelist = routelist
        },

        match: function(self, hash) {
            var path_re = re.compile(self.path_re, 'gi')
            var r = path_re.search(hash)
            if (!r) {
                return false
            }
            var v = self.routelist.keys().values()
            var rv = dict()
            rv.update(self.defaults_)
            for (var i in v) {
                rv.set(v[i], r[self.routelist.get(v[i])])
            }
            return rv
        },

        rev_match: function(self, m) {
            /* match in reverse
            */
            var k1 = m.keys().copy().values()
            k1.sort()
            var k2 = self.routelist.keys().copy().values()
            k2.sort()
            return ','.join(k1) == ','.join(k2)
        }
    }
})

nuage.create_class({
    __module__:'defer',
    __name__: 'AlreadyCalled',
    __parent__:exc.ValueError
})


nuage.create_class({
    __module__:'defer',
    __name__: 'AlreadyCancelled',
    __parent__:exc.ValueError
})


nuage.create_class({
    __module__:'defer',
    __name__: 'TimeoutError',
    __parent__:exc.ValueError
})


nuage.create_class({
    __module__:'defer',
    __name__: 'ServerError',
    __parent__:exc.Exception,
    __impl__: {

        __init__: function(self, transport) {
            exc.Exception.__init__(self, '{0}\n{1}'.format(transport.status, 
                transport.responseText))
            self.transport = transport
        },

        __str__: function(self) {
            return self.message
        }
    }
})


defer.passthru =  function(arg) {
    return arg
}


defer.succeed = function(result) {
    var d = defer.Deferred()
    d.callback(result)
    return d
}


defer.fail = function(failure) {
    var d = defer.Deferred()
    d.errback(failure)
    return d
}


defer.maybe = function(f, args) {
    try {
        result = f.apply(window, args)
    }
    catch(e) {
        return defer.fail(defer.Failure(e))
    }
    if (isinstance(result, defer.Deferred)){
        return result
    }
    else if ( isinstance(result, defer.Failure)) {
        return defer.fail(result)
    }
    else {
        print(result)
        return defer.succeed(result)
    }
}


nuage.create_class({
    __module__:'defer',
    __name__: 'Failure',
    __impl__: {

        __init__: function(self, exc_value, exc_type){
            self.value = exc_value
            if (exc_type) {
                self.type = exc_type;
            }
            else {
                self.type = exc_value.__class__
            }
        },

        get_error_message: function(self) {
            return self.value.message
        },

        raiseException: function(self) {
            throw self.value
        },

        check: function(self,args__) {
            print('todo')
        },

        trap: function(self,args__) {
            print('todo')
        }
    }
})


nuage.create_class({
    __module__:'defer',
    __name__: 'Deferred',
    __impl__: {

        __init__: function(self){
            self.callbacks = list()
            self.called = false
            self._running_cb = false
            self.result = null
            self.paused = 0
        },

        add_callbacks: function(self, callback, errback, cbargs, ebargs) {
            params = {
                callback: callback || defer.passthru,
                cbargs: cbargs || list(),
                errback: errback || defer.passthru,
                ebargs: ebargs || list()
            }
            self.callbacks.append(params)
            if (self.called) {
                self._run_cb(params)
            }
            return self    
        },

        _build_params: function(self, func, args__) {
            var rv = {
                func: null,
                args:[]
            }
            rv.func = func
            var args = list(arguments)
            args.pop(0)
            rv.args = args
            return rv
        },

        add_callback: function(self,callback, args__) {
            var args = list()
            for (var i = 2, len = arguments.length; i < len; i++) {
                args.append(arguments[i])
            }
            return self.add_callbacks(callback,null,args)
        },

        add_errback: function(self, errback,args__) {
            var args = list()
            for (var i = 2, len = arguments.length; i < len; i++) {
                args.append(arguments[i])
            }
            return self.add_callbacks(null, errback, null, args)
        },

        add_both: function(self, callback, args__) {
            var args = list()
            for (var i = 2, len = arguments.length; i < len; i++) {
                args.append(arguments[i])
            }
            return self.add_callbacks(callback, callback, args, args)
        },

        callback:function(self, result) {
            // todo raise instanceof
            self._start_run_cb(result)
        },

        errback:function(self, fail) {
            // todo raise instanceof
            self._start_run_cb(fail)
        },

        pause: function(self){
            self.paused = self.paused + 1
        },

        unpause: function(self){
            self.paused = self.paused - 1
            if (self.paused) {
                return
            }
            if (self.called) {
                self._run_cb()
            }
        },

        _continue: function(self, result) {
            self.result = result
            self.unpause()
        },

        _start_run_cb: function(self, result) {
            if (self.called) {
                throw defer.AlreadyCalled()
            }
            self.called = true
            self.result = result
            self._run_cb()
        },

        _run_cb: function(self) {
            if (self._running_cb){
                return
            }
            if (self.paused == 0) {
                while (len(self.callbacks) > 0) {
                    var item = self.callbacks.pop(0)
                    if (isinstance(self.result,defer.Failure)) {
                        callback = item.errback
                        args = item.ebargs
                    }
                    else {
                        callback = item.callback
                        args = item.cbargs
                    }
                    args.insert(0, self.result)
                    try {
                        self._running_cb = true
                        try {
                            self.result = callback.apply(window, args.values())
                        }
                        catch (exc) {
                            self.result = defer.Failure(exc)
                        }
                        finally {
                            self._running_cb = false
                        }
                        if (isinstance(self.result, defer.Deferred)) {
                            self.pause()
                            self.result.add_both(self._continue)
                            break
                        }
                    } 
                    catch (exc) {
                        self.result = defer.Failure(exc)
                    }
                }
            }
        }
    }
})


nuage.create_class({
    __module__:'defer',
    __name__: 'DeferredList',
    __parent__: defer.Deferred,
    __impl__: {

        __init__: function(self, deferred_list, options){
            defer.Deferred.__init__(self)
            var options = Object.extend({
                fire_one_callback: false,
                fire_one_errback: false,
                consume_errors: false
            },options)
            self.fire_one_cb = options.fire_one_callback
            self.fire_one_eb = options.fire_one_errback
            self.consume_errors = options.consume_errors
            self.result_list = list()
            self.finished_cnt = 0 
            for (var i = 0, l = len(deferred_list); i<l; i++) {
                self.result_list.append(null)
            }
            for (var i = 0, l = len(self.result_list); i<l; i++) {
                deferred_list.get(i).add_callbacks(
                    self._cb,
                    self._cb,
                    list([i,true]),
                    list([i,false]))
            }
        },

        _cb: function(self, result, index, succeeded) {
            self.finished_cnt++
            self.result_list.set(index,result)
            if (!self.called) {
                if (succeeded && self.fire_one_cb) {
                    self.callback(list(result, index))
                }
                else if (!succeeded && self.fire_one_eb) {
                    //TODO: self.errback(failure.Failure(FirstError(result, index)))
                    self.errback(list(result, index))
                }
                else if (self.finished_cnt == len(self.result_list)) {
                    self.callback(self.result_list)
                }
                if (!succeeded && self.consume_errors) {
                    result = null
                }
            }
            return result
        }
    }
})


nuage.create_class({
    __module__: 'defer',
    __name__: 'Protocol',
    __impl__: {

        __init__: function(self) {
            self.factory = null
        },

        make_connection: function(self, fransport) {},
        connection_made: function(self) {},
        connection_lost: function(self, failure) {}
    }
})


nuage.create_class({
    __module__: 'defer',
    __name__: 'HttpRequest',
    __parent__: defer.Protocol,
    __impl__: {

        __init__: function(self, context) {
            var default_context = {
                url:null,
                method:'get',
                postdata:null,
                headers: {
                    'Content-type':'text/plain; charset=utf-8',
                    'connection':'close',
                    'agent':'nuage'
                },
                cookies: {}
            }
            Object.extend(default_context.headers, context.headers)
            Object.extend(default_context.cookies, context.cookies)
            context = Object.extend(default_context, context)
            if (context.postdata && !context.headers) {
                context.headers['content-length'] = len(postdata)
            }
            Object.extend(self,context)
        },

        make_connection:function(self, transport) {
            transport.open(self.method, self.url, true)
        },

        connection_made: function(self, transport) {
            for (var k in self.headers) {
                transport.setRequestHeader(k, self.headers[k])
            }
            if (self.method == 'post' || self.method == 'put') {
                transport.send(self.postdata)
            }
            else {
                transport.send(null)
            }
        }
    }
})


nuage.create_class({
    __module__:'defer',
    __name__:'ClientFactory',
    __impl__: {

        __init__: function(self) {
            self.protocol = null
        },

        build_protocol: function(self, context) {
            var rv = self.protocol(context)
            rv.factory = self
            return rv
        },

        started_connecting: function(self, connector) {},
        client_connection_failed: function(self, connector,failure) {},
        client_connection_lost: function(self, connector,failure) {}
    }
})


nuage.create_class({
    __module__:'defer',
    __name__:'HTTPClientFactory',
    __parent__: defer.ClientFactory,
    __impl__: {

        __init__: function(self) {
            self.waiting = false
            self.defer = defer.Deferred()
            self.protocol = defer.HttpRequest
        },

        build_protocol: function(self, context) {
            var p = defer.ClientFactory.build_protocol(self, context)
            if (context.timeout) {
                var tc = reactor.call_later(context.timeout, self, self._timeout)
                self.defer.add_both(self, self._cancel_timeout,tc)
            }
            return p
        },

        started_connecting: function(self, connector){
            var t = connector.transport
            self.transport = t
            var p = connector.build_protocol()
            self.waiting = true
            try {
                p.make_connection(t)
            }
            catch(exc) {
                self.client_connection_failed(defer.Failure(exc))
            }

            if (self.waiting) {
                t.onreadystatechange = function(){
                    if (t.readyState == 4) {
                        if (t.status < 400) {
                            self.page(t)
                        }
                        else {
                            self.no_page(defer.Failure(defer.ServerError(t)))
                        }
                    }
                }
                p.connection_made(t)
            }
        },

        _timeout: function(self, result) {
            self.waiting = false
            self.transport.abort()
            self.no_page(defer.Failure(TimeoutError()))
        },

        _cancel_timeout: function(self, result, timeout_call) {
            if (timeout_call.active()) {
                timeout_call.cancel()
            }
            return result
        },

        page: function(self, result) {
            if (self.waiting) {
                self.waiting = false
                self.defer.callback(result)
            }
        },

        no_page: function(self, failure) {
            if (self.waiting) {
                self.waiting = false
                self.defer.errback(failure)
            }
        },

        client_connection_failed: function(self, failure) {
            if (self.waiting) {
                self.waiting = false
                self.defer.errback(failure)
            }
        }
    }
})


nuage.create_class({
    __module__: 'defer',
    __name__: 'HttpConnector',
    __impl__: {

        __init__: function(self, context, factory, reactor) {
            self.state = 'disconnected'
            self.transport = null
            self.context = context
            self.factory = factory
            self.reactor = reactor
        },

        connect: function(self) {
            self.transport = self._make_transport()
            self.factory.started_connecting(self)
        },

        build_protocol: function(self) {
            return self.factory.build_protocol(self.context)
        },

        _make_transport:function(self) {
            try {
                return new ActiveXObject("Msxml2.XMLHTTP")
            } 
            catch (e) {} 
            try {
                return new ActiveXObject("Microsoft.XMLHTTP")
            } 
            catch (e) {}
            return new XMLHttpRequest()
        }
    }
})


nuage.create_class({
    __module__: 'defer',
    __name__: 'DelayedCall',
    __static__ : {
        __lt__: function(self, a, b) {
            return (a.time < b.time)
        },
        __gt__: function(self, a, b) {
            return (a.time > b.time)
        }
    },

    __impl__: {

        __init__ :function(self, time, func, args) {
            self.time = time
            self.func = func
            self.args = args || []

            self.cancelled = false
            self.called = false
        },

        cancel: function(self) {
            if (self.cancelled) {
                throw defer.AlreadyCancelled()
            }
            if (self.called) {
                throw defer.AlreadyCalled()
            }
            self.cancelled = true
            self.object = null
            self.func = null
        },

        active: function(self) {
            return !(self.cancelled || self.called)
        }
    }
})


nuage.create_class({
    __module__:'defer',
    __name__: 'Reactor',
    __impl__: {

        __init__: function(self){
            self._started = false
            self._pending_dc = list()
            self._new_dc = list()
        },

        seconds: function(self) {
            var d = new Date()
            d.setMilliseconds(0)
            return d.getTime() / 1000
        },

        _insert_new_dc: function(self) {
            while(len(self._new_dc) > 0) {
                o = self._new_dc.pop(0)
                if (!o.cancelled) {
                    self._pending_dc.append(o)
                }
            }
            self._pending_dc.sort()
        },
        run_until_current:function(self) {
            self._insert_new_dc()
            var now = self.seconds()

            while (len(self._pending_dc) && self._pending_dc.get(0).time <= now) {
                var dc = self._pending_dc.pop(0)
                if (!dc.cancelled) {
                    dc.called = true
                    window.setTimeout(function(){
                        dc.func.apply(window,dc.args)
                    },0)
                }
            }

        },

        run: function(self) {
            self._started = true
            evt.dom.hook(window,'load', function() {
                evt.dom.hook(window,'hashchange', self.on_hashchanged)
                try {
                    route.dispatch()
                }
                catch(e) {
                    //var hash = window.location.hash
                    route.redirect(dict())
                    //route.dispatch(hash)
                }
            })
            evt.dom.hook(window,'unload',self.stop)
            self.main_loop()
        },

        on_hashchanged: function(self, evt) {
            route.dispatch()
        },

        main_loop : function(self){
            if (self._started) {
                self.run_until_current()
                //self.do_iteration()
                window.setTimeout(function(){ self.main_loop() },1000)
            }
        },

        stop: function(self) {
            self._started = false
        },

        call_later:function(self, second, func, args__) {
            var args = []
            for (var i = 3, l = arguments.length; i < l; i++) {
                args.push(arguments[i])
            }
            var rv = defer.DelayedCall((self.seconds() + second),
                    func, args)
            
            self._new_dc.append(rv)
            return rv
        },

        connect_http: function(self, context, factory) {
            if (!factory) {
                factory = defer.HTTPClientFactory()
            }
            var c = defer.HttpConnector(context, factory, self)
            c.connect()
            return c
        },

        connect_websocket: function(self, contect, factory) {
            throw Exception("Unimplemented feature")
        }
    }
})


window.reactor = defer.Reactor()

nuage.create_class({
    __name__: 'View',
    __module__: 'nuage',
    __impl__: {

        __init__: function() {},

        dispatch: function(self, data) {
            var method = 'do_'+data.get('action')
            if (hasattr(self, method)) {
                f = getattr(self, method)
                f(data)
            }
            else {
                throw exc.Exception("View action's not implemented: " + method)
            }
        }
    }
})

nuage.create_module({
    __name__:'nuage.tpl',
    __impl__: {
        TEMPLATE_DIRS:'/templates/',
        BLOCK_TAG_START:'{%',
        BLOCK_TAG_END:'%}',
        VAR_TAG_START:'{{',
        VAR_TAG_END:'}}',
        VAR_ATTR_SEP: '.',
        COMMENT_TAG_START:'{#',
        COMMENT_TAG_END:'#}',
        tag_re: /(\{%[^%]*%\}|\{\{[^\}]*\}\}|\{#[^#]*#\})/gim,

        BLOCK_CONTEXT_KEY: 'block_context',

        TOKEN_TEXT: 0,
        TOKEN_VAR: 1,
        TOKEN_BLOCK: 2,
        TOKEN_COMMENT: 3,

        FILTER_SEP : '|',
        FILTER_ARG_SEP : ':',
        
        filter_re: /([a-z][^\|]*)+(\|(([a-z][^\|\:]*)?(:"?\s*"?)?)+)*/ig,
        smart_split_re:/[^\s"]*("[^"\\]*(\\.[^"\\]*)*")\S*|[^\s']*('[^'\\]*(\\.[^'\\]*)*')\S*|(\S+)/gim,
        
        compile_string: function(str) {
            lexer = nuage.tpl.Lexer(str)
            parser = nuage.tpl.Parser(lexer.tokenize())
            return parser.parse()
        },

        smart_split: function(str) {
            var rv = list()
            var m
            var splitting
            var str2
            str = str.strip()
            do {
                //print('smart_split_re', str)
                m = this.smart_split_re.search(str)
                splitting = m != null
                if (splitting) {
                    str2 = m[5] || m[1] || m[3]
                    rv.append(str2)
                }
            } while (splitting)
            return rv
        },

        mark_safe: function(str) {
            return nuage.tpl.SafeString(str)
        },

        escape: function(str_) {
            if (!isinstance(str_,String)) {
                str_ = str(str_)
            }
            return nuage.tpl.mark_safe(str_.replace('&', '&amp;'
                ).replace('<', '&lt;'
                ).replace('>', '&gt;'
                ).replace('"', '&quot;'
                ).replace("'", '&#39;'))
        },

        templates: dict(),
        get_template:function(name, headers) {
            /**
            * Args:
            *       name: the name ot the template
            *       headers: extra http headers
            * Returns: a nuage.tpl compiled template
            */
            var t = nuage.tpl.templates.get(name,null)
            if (t) {
                return defer.succeed(t)
            }
            var t = document.getElementById(name)
            if (t) {
                var tpl = nuage.tpl.Template(t.text, name)
                nuage.tpl.templates.set(name, tpl)
                // template compiled now, 
                // remove it source from the dom, not needed anymore
                t.parentNode.removeChild(t) 
                return defer.succeed(tpl)
            }
            function _parse(result) {
                var tpl = nuage.tpl.Template(result.responseText, name);
                nuage.tpl.templates.set(name, tpl)
                return tpl
            }
            function _err(err) {
                throw nuage.tpl.TemplateDoesNotExist(name)
            }
            var f = defer.HTTPClientFactory()
            var ctx = {
                url: nuage.tpl.TEMPLATE_DIRS + name,
                method: 'get'
            }
            if (headers) {
                ctx.headers = headers
            }
            reactor.connect_http(ctx,f);
            return f.defer.add_both(_parse, _err)
        },

        helpers: {
            'route_url': function(view, kw) {
                kw["view"] = view
                return route.render(dict(kw))
            },
            'super': function(context) {
                return context.get('block').super_()
            }
        },

        filters: {
            'capitalize': function(s) {return s.capitalize()},
            'length': function(o) { return len(o) },
            'safe': function(s) { return nuage.tpl.mark_safe(str(s)) },
            'escape': function(s) { return nuage.tpl.EscapeString(str(s)) }
        },

        tags: {
            'if': function(parser, token) {
                var bits = token.split_contents()
                bits.pop(0)
                var var_ = nuage.tpl.TemplateIfParser(parser, bits).parse()

                var nodelist_true = parser.parse(list('else','endif'))
                var token = parser.next_token()
                if (token.contents == 'else') {
                    var nodelist_false = parser.parse(list('endif'))
                    parser.delete_first_token()
                }
                else {
                    var nodelist_false = nuage.tpl.NodeList()
                }
                return nuage.tpl.IfNode(var_, nodelist_true, nodelist_false)
            },
            'for': function(parser, token) {
                var bits = list(token.contents.split())
                if (len(bits) < 4) {
                    throw nuage.tpl.TemplateSyntaxError(
                "'for' statements should have at least four words: {0}".format(token.contents))
                }
                var is_reversed = bits.get(-1) == 'reversed'
                var in_index = is_reversed && -3 || -2
                if (bits.get(in_index) != 'in') {
                    throw nuage.tpl.TemplateSyntaxError(
                        "'for' statements should use the format 'for x in y': {0}".format(token.contents))
                }
                var loopvars = bits.get(1,in_index).split(',')
                for (var i = 0, len_ = len(loopvars); i < len_; i++) {
                    loopvars[i] = loopvars[i].strip() 
                    var  var_ = loopvars[i]
                    if (!var_ || (var_.index(' ') >= 0)) {
                        throw nuage.tpl.TemplateSyntaxError(
                            "'for' tag received an invalid argument: {0}".format(
                                                   token.contents))
                    }
                }
                var sequence = parser.compile_filter(bits.get(in_index+1))
                var nodelist_loop = parser.parse(list('empty', 'endfor'))
                var token = parser.next_token()
                if (token.contents == 'empty') {
                    var nodelist_empty = parser.parse(list('endfor'))
                    parser.delete_first_token()
                }
                else {
                    var nodelist_empty = null
                }
                return nuage.tpl.ForNode(loopvars, sequence, is_reversed, 
                    nodelist_loop, nodelist_empty)
            },
            'block': function(parser, token) {
                var bits = token.contents.split()
                if (len(bits) != 2) {
                    throw nuage.tpl.TemplateSyntaxError(
                        "'{0}' tag takes only one argument".format(bits[0]))
                }
                var block_name = bits[1]
                // Keep track of the names of BlockNodes found in this template, so we can
                // check for duplication.
                try {
                    if (parser.loaded_tags.index(block_name) >= 0) {
                        throw nuage.tpl.TemplateSyntaxError(
                            "'{0}' tag with name '{1}' appears "+
                            "more than once".format(bits[0], block_name))
                    }
                    parser.loaded_tags.append(block_name)
                }
                catch(e) { 
                    throw e
                }
                var nodelist = parser.parse(list('endblock', 'endblock ' + block_name))
                parser.delete_first_token()
                return nuage.tpl.BlockNode(block_name, nodelist)
            },
            'extends': function(parser, token) {
                var bits = token.split_contents()
                if (len(bits) != 2) {
                    throw nuage.tpl.TemplateSyntaxError(
                        "'{0}' takes one argument".format(bits[0]))
                }
                var parent_name = null
                var parent_name_expr = null
                var path = bits.get(1)
                if ((list('"', "'")).index(path.cut(0,1) >= 0) && 
                        (path.cut(-1) == path.cut(0,1))) {
                    parent_name = path.cut(1,-1)
                }
                else {
                    parent_name_expr = parser.compile_filter(bits[1])
                }
                var nodelist = parser.parse()
                if (len(nodelist.get_nodes_by_type(nuage.tpl.ExtendsNode)) > 0) {
                    throw nuage.tpl.TemplateSyntaxError(
                        "'{0}' cannot appear more than once in the same template".format(bits[0]))
                }
                return nuage.tpl.ExtendsNode(nodelist, parent_name, parent_name_expr)
            },
            'include': function(parser, token) {
                var bits = token.split_contents()
                if (len(bits) != 2) {
                    throw nuage.tpl.TemplateSyntaxError(
                        "{0} tag takes one argument: the name of the template to be included".format(bits[0]))
                }
                var path = bits.get(1)
                if ((list('"', "'")).index(path.cut(0,1) >= 0) && 
                        (path.cut(-1) == path.cut(0,1))) {
                    return nuage.tpl.ConstantIncludeNode(path.cut(1,-1))
                }
                return nuage.tpl.IncludeNode(bits.get(1))
            }
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'TemplateDoesNotExist',
    __parent__:exc.Exception
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'TemplateNotFound',
    __parent__:exc.Exception
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'TemplateSyntaxError',
    __parent__:exc.Exception
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'SafeData'
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'SafeString',
    __parent__:[nuage.tpl.SafeData,String],
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'EscapeData'
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'EscapeString',
    __parent__:[nuage.tpl.EscapeData,String]
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'Lexer',
    __impl__: {

        __init__: function(self, template_string){
            self.template_string = template_string || ''
            //print('create template ', self.template_string.cut(20))
        },

        tokenize: function(self){
            var rv = list()
            var in_tag = false
            var bits = nuage.tpl.tag_re.split(self.template_string)
            for (var i = 0, length = len(bits); i < length; i++) {
                if (bits[i]) {
                    rv.append(self.create_token(bits[i], in_tag))
                }
                in_tag = !in_tag
            }
            return rv
        },

        create_token: function(self, token, in_tag) {
            if (in_tag) {    
                if (token.startswith(nuage.tpl.VAR_TAG_START)) {
                    //print('token var' + token)
                    return nuage.tpl.Token(nuage.tpl.TOKEN_VAR,
                        token.cut(len(nuage.tpl.VAR_TAG_START), 
                            -len(nuage.tpl.VAR_TAG_END)).strip()
)
                }
                if (token.startswith(nuage.tpl.BLOCK_TAG_START)) {
                    return nuage.tpl.Token(nuage.tpl.TOKEN_BLOCK, 
                        token.cut(len(nuage.tpl.BLOCK_TAG_START),
                            - len(nuage.tpl.BLOCK_TAG_END)).strip()
)
                }
                if (token.startswith(nuage.tpl.COMMENT_TAG_START)) {
                    return nuage.tpl.Token(nuage.tpl.TOKEN_COMMENT, '')
                }
            }
            //print('token text',token)
            return  nuage.tpl.Token(nuage.tpl.TOKEN_TEXT, token)
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'Parser',
    __impl__:{

        __init__: function(self, tokens){
            self.tokens = tokens || list()
            self.tags = dict(nuage.tpl.tags)
            self.filters = dict(nuage.tpl.filters)
            self.loaded_tags = list()
        },

        parse: function(self, parse_until){
            parse_until = parse_until || list()
            var nodelist = nuage.tpl.NodeList()
            while (len(self.tokens)>0) {
                var token = self.next_token()
                switch(token.token_type) {
                    case nuage.tpl.TOKEN_TEXT:
                        self.extend_nodelist(nodelist, 
                            nuage.tpl.TextNode(token.contents), 
                            token)
                    break
                    case nuage.tpl.TOKEN_VAR:
                        if (!token.contents) {
                            self.empty_variable(token)
                        }
                        var filter_expression = self.compile_filter(token.contents)
                        var var_node = self.create_variable_node(filter_expression)
                        self.extend_nodelist(nodelist, var_node,token)
                    
                    break
                    case nuage.tpl.TOKEN_BLOCK:
                        if (parse_until.index(token.contents) >= 0) {
                            self.prepend_token(token)
                            return nodelist
                        }

                        try {
                            var command = token.contents.split()[0]
                            //print('command ' + command)
                        }
                        catch(e) {
                            // todo: vérifier le type de l'exception
                            self.empty_block_tag(token)
                        }
                        // execute callback function for self tag and append resulting node
                        self.enter_command(command, token)
                        try {
                            compile_func = self.tags.get(command)
                        }
                        catch(e) {
                            pprint(e)
                            // todo: vérifier le type de l'exception
                            self.invalid_block_tag(token, command)
                        }
                        try {
                            compiled_result = compile_func(self, token)
                        }
                        catch(e) {
                            pprint(e)
                            // todo: vérifier le type de l'exception
                            if (!self.compile_function_error(token, e)) {
                                throw e
                            }
                        }
                        self.extend_nodelist(nodelist, compiled_result, token)
                        self.exit_command()
                    break
                }
            }
            return nodelist
        },

        skip_past: function(self, endtag) {
            while (len(self.tokens)>0){
                token = self.next_token()
                if ((token.token_type == TOKEN_BLOCK) && (token.contents == endtag)) {
                    return
                }
            }
            self.unclosed_block_tag(list({values:[endtag]}))
        },

        create_variable_node: function(self, filter_expr) {
            return nuage.tpl.VariableNode(filter_expr)
        },

        extend_nodelist: function(self, nodelist, node, token) {
            if (node.must_be_first && (len(nodelist)>0)) {
                throw nuage.tpl.TemplateSyntaxError(
                    "{0} must be the first tag in the template.".format(node))
            }
            if (isinstance(nodelist, nuage.tpl.NodeList) && !isinstance(node, nuage.tpl.TextNode)) {
                nodelist.contains_nontext = true
            }
            nodelist.append(node)
        },

        enter_command: function(self, command,token) {},

        exit_command: function(self, command,token) {},

        error: function(self, token,msg) {
            return nuage.tpl.TemplateSyntaxError(msg)
        },

        empty_variable: function(self, token) {
            throw self.error(token, "Empty variable tag")
        },

        empty_block_tag: function(self, token) {
            throw self.error(token, "Empty block tag")
        },

        invalid_block_tag: function(self, token,command) {
            throw self.error(token, "Invalid block tag '{0}'".format(command))
        },

        unclosed_block_tag: function(self, parse_until) {
            throw self.error(null, "Unclosed tags: {0}".format(', '.join(parse_until)))
        },

        compile_function_error: function(self, token,e) {},

        next_token: function(self) {
            return self.tokens.pop(0)
        },

        prepend_token: function(self, token) {
            self.tokens.insert(0,token)
        },

        delete_first_token: function(self) {
            self.tokens.delete_(0,1)
        },

        add_library: function(self,lib) {
            self.tags.update(lib.tags)
            self.filters.update(lib.filters)
        },

        compile_filter:function(self, token) {
            return nuage.tpl.FilterExpression(token, self)
        },

        find_filter: function(self, filter_name) {
            if (self.filters.keys().index(filter_name) >= 0) {
                return self.filters.get(filter_name)
            }
            throw self.error(null,"Invalid filter: '{0}'".format(filter_name))
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'Template',
    __impl__:  {

        __init__: function(self, template_str, name){
            self.template_str = template_str
            self.name = name || '<Unknown template>'
            self.nodelist = nuage.tpl.compile_string(template_str)
        },

        get_block: function(self,name) {
            var nl = self.nodelist.get_nodes_by_type(nuage.tpl.BlockNode)
            for (var i = 0, l = len(nl); i < l; i++) {
                if (nl.get(i).name == name) {
                    return nl.get(i)
                }
            }
            return null // throw ??
        },

        render: function(self, context) {
            context.render_context.push()
            try {
                return self.nodelist.render(context)
            }
            catch(e) {
                pprint('template.render exception', e)
            }
            finally {
                context.render_context.pop()
            }
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'Token',
    __impl__: {

        __init__: function(self,token_type, contents) {
            self.token_type = token_type
            self.contents = contents
        },

        split_contents: function(self) {
            //print('split_contents', self.contents)
            return nuage.tpl.smart_split(self.contents)
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'Variable',
    __impl__: {

        __init__: function(self, var_) {
            //print('create var ',var_)
            self.literal = null
            self.lookups = null
            self.translate = false
            try {
                self.literal = float_(var_)
            }
            catch(e) {
                self.var_ = var_
                /*
                if (self.var_.startswith('_(') && self.var_.endswith(')')) {
                    self.translate = true
                    self.var_ = self.var_.cut(2,-1)
                }
                */
                //print(self.var_,self.var_.cut(0,1),self.var_.cut(-1,1))

                if ((self.var_.startswith('"') || self.var_.startswith("'")) && 
                    (self.var_.cut(1) == self.var_.cut(-1))) {
                    self.literal = nuage.tpl.mark_safe(self.var_.cut(1,-1))
                }
                else {
                    self.lookups = self.var_.split(nuage.tpl.VAR_ATTR_SEP)
                }
            }
        },

        resolve: function(self, context) {
            var value
            if (self.lookups != null) {
                value = self._resolve_lookup(context)
            }
            else {
                value = self.literal
            }
            if (self.translate) {
                // todo
            }
            return defer.succeed(value)
        },

        _resolve_lookup: function(self, context) {
            var current = null
            try {
                current = context
                for (var i = 0, length = len(self.lookups); i < length; i++) {
                    if (isinstance(current,dict) || isinstance(current,nuage.tpl.Context)) {
                        current = current.get(self.lookups[i])
                    }
                    else {
                        current = current[self.lookups[i]]
                    }
                }
            }
            catch(e) {
                pprint(e)
                current=''
            }
            if (current == null) {
                current = ''
            }
            return current
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'Helper',
    __impl__: {

        __init__: function(self,helper) {
            // helper is an array (a regex search result)
            helper = list(helper)
            self.helper = helper.get(1)
            self.helper_args = helper.get(2,null)
            if (self.helper_args) {
                self.helper_args =  self.helper_args.split(',')
            }
            else {
                self.helper_args = []
            } 
        },

        resolve: function(self, context) {
            if (nuage.tpl.helpers[self.helper]) {
                var asynclist = list()
                var args = []
                var kw = {}
                for (var i = 0, l = len(self.helper_args); i<l; i++) {
                    var arg = self.helper_args[i].strip()
                    if ((list('"', "'")).index(arg.cut(0,1) >= 0) && 
                            (arg.cut(-1) == arg.cut(0,1))) {
                        asynclist.append(defer.succeed(arg.cut(1,-1)
                        ).add_callback(function(result) {
                                    args[i] = result
                                }))
                    }
                    else {
                        if (arg.index('=') > 0) {
                            var d = arg.split('=')
                            d[0] = d[0].strip()
                            d[1] = d[1].strip()
                            if ((list('"', "'")).index(d[1].cut(0,1) >= 0) && 
                                    (d[1].cut(-1) == d[1].cut(0,1))) {
                                asynclist.append(defer.succeed(d[1].cut(1,-1)
                                    ).add_callback(function(result) {
                                            kw[d[0]] = result;
                                        }))
                            }
                            else {
                                var v = nuage.tpl.Variable(d[1])
                                asynclist.append(v.resolve(context
                                    ).add_callback(function(result) {
                                            kw[d[0]] = result;
                                        }))
                            }
                        }
                        else {
                            var v = nuage.tpl.Variable(arg)
                            asynclist.append(v.resolve(context
                                ).add_callback(function(result) {
                                    args[i] = result
                                }))
                        }
                    }
                }
                if (len(asynclist) == 0) {
                    asynclist.append(defer.succeed(1))
                }
                return defer.DeferredList(asynclist).add_callback(function(result) {
                    if (len(kw)) {
                        args.push(kw)
                    }
                    args.push(context)
                    return nuage.tpl.helpers[self.helper].apply(window,args)
                    })
            }
            return defer.succeed("")
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'FilterExpression',
    __impl__: {

        __init__:function(self, token, parser) {
            //print('create filter expression',token)
            self.token = token
            self.parser = parser
            var helper_re = /([^\(]+)\(([^\)]*)?\)/gim
            var g = self.token.split(nuage.tpl.FILTER_SEP)
            var helper = helper_re.search(g[0])
            if (helper) {
                self.var_ = nuage.tpl.Helper(helper)
            }
            else {
                self.var_ = nuage.tpl.Variable(g[0])
            }
            self.filters = list()
            for (var i = 1, length = g.length; i < length;i++) {
                var filter = g[i].split(nuage.tpl.FILTER_ARG_SEP)
                var filter_func = self.parser.find_filter(filter[0])
                var filter_args = list()
                for (var j = 1, len2 = filter.length; j < len2 ;j++) {
                    if (filter[j].startswith('"') && filter[j].endswith('"')) {
                        //constant
                        filter_args.append([false,filter[j].cut(1,-1)])
                    }
                    else {
                        //var
                        filter_args.append(true,filter[j])
                    }
                }
                var f = [filter[0], filter_func, filter_args]
                self.filters.append(f)
            }
        },

        resolve: function(self, context, ignore_failures){
            return self.var_.resolve(context).add_callback(function(result) {
                for (var i = 0,l = len(self.filters); i < l; i++) {
                    var f = self.filters.get(i)
                    f[2].insert(0,result)
                    result = f[1].apply(window,f[2].values())
                }
                return result
            }).add_errback(function(err) {
                pprint(err)
                return ""
            })
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'ContextPopException',
    __parent__:exc.Exception
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'BaseContext',
    __impl__: {

        __init__:function(self, dict_, autoescape) {
            dict_ = dict(dict_||{})
            self.dicts = list([dict_])
        },

        push: function(self) {
            var rv = dict()
            self.dicts.append(rv)
            return rv
        },

        pop: function(self) {
            if ( len(self.dicts) == 1 ) {
                throw nuage.tpl.ContextPopException()
            }
            return self.dicts.pop()
        },

        has_key:function(self, key) {
            for(var i = len(self.dicts)-1; i >= 0; i-- ) {
                if (self.dicts.get(i).has_key(key)) {
                    return true
                }
            }
            return false
        },

        get:function(self, key, default_) {
            for(var i = len(self.dicts)-1; i >= 0; i-- ) {
                if (self.dicts.get(i).has_key(key)) {
                    return self.dicts.get(i).get(key)
                }
            }
            return default_
        },

        set:function(self, key, value) {
            return self.dicts.get(-1).set(key,value)
        },

        delete_: function(self, key) {
            return self.dicts.get(-1).delete_(key)
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'Context',
    __parent__:nuage.tpl.BaseContext,
    __impl__: {

        __init__: function(self, dict_, autoescape){
            self.autoescape = autoescape || true
            self.render_context = nuage.tpl.RenderContext()
            nuage.tpl.BaseContext.__init__(self, dict_)
        },

        update: function(self, other){
            var d = self.dicts.get(-1)
            d.update(other)
            return self
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'RenderContext',
    __parent__:nuage.tpl.BaseContext,
    __impl__: {

        __init__: function(self, dict_){
            nuage.tpl.BaseContext.__init__(self, dict_)
        },

        has_key:function(self,k) {
            return self.dicts.get(-1).has_key(k)
        },

        get: function(self,k, otherwise){
            var d = self.dicts.get(-1)
            if ( self.dicts.get(-1).has_key(k) ) {
                return d.get(k)
            }
            return otherwise
        }
    }
})

nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'VariableDoesNotExist',
    __parent__:exc.Exception
});


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'Node',
    __impl__: {

        __init__: function(self, must_be_first) {
            self.must_be_first = must_be_first || false
        },

        __iter__: function(self) {
            return self
        },

        next: function(self){
            return self
        },

        render:function(self, context){
            return defer.succeed('')
        },

        get_nodes_by_type: function(self,  node_type ) {
            var nodes = list()
            if (isinstance(self, node_type)) {
                nodes.append(self)
            }
            if ( hasattr(self, 'nodelist')) {
                nodes.extend(self.nodelist.get_nodes_by_type(node_type))
            }
            return nodes
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'TextNode',
    __parent__:nuage.tpl.Node,
    __impl__: {

        __init__: function(self, s){
            //print('TextNode',s.cut(5)+'...')
            self.s = s
        },

        render:function(self, context){
            return defer.succeed(self.s)
        }
    }
})

nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'VariableNode',
    __parent__: nuage.tpl.Node,
    __impl__: {

        __init__: function(self, filter_expression) {
            self.filter_expression = filter_expression
        },

        render: function(self, context) {
            return self.filter_expression.resolve(context).add_callback( 
                        function(result) {
                            if ((context.autoescape && 
                                 !isinstance(result, nuage.tpl.SafeData)) ||
                                  isinstance(result, nuage.tpl.EscapeData)) {
                                return nuage.tpl.escape(result)
                            }
                            return result
                        })
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'CommentNode',
    __parent__:nuage.tpl.Node,
    __impl__: {

        render:function(self, context){
            return defer.succeed('')
        }
    }
})

nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'IfNode',
    __parent__:nuage.tpl.Node,
    __impl__: {

        __init__: function(self, var_, nodelist_true, nodelist_false){
            self.var_ = var_
            self.nodelist_true = nodelist_true
            self.nodelist_true.debug = true
            self.nodelist_false = nodelist_false
            self._next_pos = 0
            self._treat_true = true
        },

        __iter__: function(self) {
            return self
        },

        next: function(self) {
            if (self._treat_true) {
                if ( self._next_pos < len(self.nodelist_true)  ) {
                    return self.nodelist_true.get(self._next_pos)
                }
                else {
                    self._next_pos = [0]
                    self._treat_true = false
                }
            }
            if (!self._treat_true) {
                if (self._next_pos < len(self.nodelist_false)) {
                    return self.nodelist_false.get(self._next_pos)
                }
                else {
                    //
                }
            }
            self._next_pos++
        },

        get_nodes_by_type: function(self, node_type) {
            nodes = list()
            if (isinstance(self, node_type)) {
                nodes.append(self)
            }
            nodes.extend(self.nodelist_true.get_nodes_by_type(node_type))
            nodes.extend(self.nodelist_false.get_nodes_by_type(node_type))
            return nodes
        },

        render: function(self, context){
            return self.var_.eval(context).add_callback( function(result) {
                if ( result ) {
                    return self.nodelist_true.render(context)
                }
                else {
                    return self.nodelist_false.render(context)
                }
            })
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'ForNode',
    __parent__:nuage.tpl.Node,
    __impl__: {

        __init__: function(self, loopvars, sequence, is_reversed, 
                    nodelist_loop, nodelist_empty ) {
            nuage.tpl.Node.__init__(self,false)
            self.loopvars = loopvars
            self.sequence = sequence
            self.is_reversed = is_reversed            
            self.nodelist_loop = nodelist_loop
            self.nodelist_empty = nodelist_empty || nuage.tpl.NodeList()

            self._next_pos = 0
            self._treat_for = true
        },

        __iter__: function(self) {
            return self
        },

        next: function(self) {
            print('fornode.next')
            // todo: correct function return <=> yeld, 
            //        iterator on list,not array
            if (self._treat_true) {
                if ( self._next_pos < len(self.nodelist_loop)  ) {
                    return self.nodelist_loop.get(self._next_pos)
                }
                else {
                    self._next_pos = [0]
                    self._treat_true = false
                }
            }
            if (!self._treat_true) {
                if (self._next_pos < len(self.nodelist_empty)) {
                    return self.nodelist_empty.get(self._next_pos)
                }
                else {
                    //
                }
            }
            self._next_pos++
        },

        get_nodes_by_type: function(self, nodetype) {
            nodes = list()
            if (isinstance(self, nodetype)) {
                nodes.append(self)
            }
            nodes.extend(self.nodelist_loop.get_nodes_by_type(nodetype))
            nodes.extend(self.nodelist_empty.get_nodes_by_type(nodetype))
            return nodes
        },

        render: function(self, context){
            
            var values = null
            if (context.has_key('forloop')) {
                var parentloop = context.get('forloop')
            }
            else {
                var parentloop = dict() 
            }
            context.push()
            return self.sequence.resolve(context, true).add_callback( function( values ) {

                if (values == null) {
                    values = []
                }
                if (!isinstance(values, dict) && !isinstance(values, list)) {
                    values = list(values)
                }
                var len_values = len(values)
                if (len_values < 1) {
                    context.pop()
                    return self.nodelist_empty.render(context)
                }
                var nodelist = nuage.tpl.NodeList()
                if (self.is_reversed) {
                    print('todo: is_reversed ForNode')
                    //values = reversed(values)
                }
                var unpack = len(self.loopvars) > 1
                // Create a forloop value in the context.  We'll update counters on each
                // iteration just below.
                var loop_dict = {'parentloop': parentloop}
                for (var i = 0; i < len_values; i++) {
                    var item = values.get(i)
                    loop_dict['counter0'] = i
                    loop_dict['counter'] = i + 1
                    loop_dict['revcounter'] = len_values - i
                    loop_dict['revcounter0'] = len_values - i - 1
                    loop_dict['first'] = (i == 0)
                    loop_dict['last'] = (i == len_values - 1)
                    context.set('forloop', loop_dict) 
                    if (unpack) {
                        // If there are multiple loop variables, unpack the item into
                        // them.
                        context.push()
                        for ( var j = 0, l = len(self.loopvars); j < l; j++) {
                            context.set(self.loopvars[j], item[self.loopvars[j]])
                        }
                        //context.update(dict(zip(self.loopvars, item)))
                    }
                    else {
                        context.set(self.loopvars[0], item)
                    }
                    for (var j = 0, len_ = len(self.nodelist_loop); j < len_; j++) {
                        var node = self.nodelist_loop.get(j)
                        nodelist.append(node.render(context))
                    }
                    if (unpack) {
                        // The loop variables were pushed on to the context so pop them
                        // off again. This is necessary because the tag lets the length
                        // of loopvars differ to the length of each set of items and we
                        // don't want to leave any vars from the previous loop on the
                        // context.
                        context.pop()
                    }
                }
                context.pop()
                return nodelist.render(context)
            }).add_errback(function(err) {
                pprint(err)
                return ""
            })
            
        }
    }
})

nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'NodeList',
    __parent__: list,
    __impl__: {

        __init__: function(self) {
            list.__init__(self,[])
            self.contains_nontext = false
            self.debug = false
        },

        render: function(self, context) {
            function _cb(result) {
                return ''.join(result)
            }
            function _eb(fail) {
                print('NodeList.render: {0}'.format(fail.get_error_message()))
            }
            var length = len(self._values)
            if ( length ) {
                var bits = list()
                for ( var i = 0; i < length; i++ ) {
                    if ( isinstance(self._values[i], nuage.tpl.Node)) {
                        bits.append(self.render_node(self._values[i], context))
                    }
                    else {
                        bits.append(self._values[i])
                    }
                }
                return defer.DeferredList(bits).add_callback(_cb).add_errback(_eb)
            }
            else {
                return defer.succeed('')
            }
        },

        get_nodes_by_type: function(self, nodetype) {
            var nodes = list()
            for ( var i = 0, length = len(self._values); i < length; i++ ) {
                   nodes.extend(self._values[i].get_nodes_by_type(nodetype))
            }
            return nodes
        },

        render_node: function(self, node, context) {
            return node.render(context)
        }
    }
})

nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'TokenBase',
    __impl__: {
 
       __init__: function(self){
            self.id = null
            self.value = null
            self.first = null
            self.second = null
        },

        ned: function(self) {},

        led:function(self) {},

        display: function(self) {
            return self.id
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'Literal',
    __parent__: nuage.tpl.TokenBase,
    __impl__: {

        __init__: function(self,value) {
            nuage.tpl.TokenBase.__init__(self)
            self.id = "literal"
            self.lbp = 0
            self.value = value
        },

        display: function(self) {
            return self.value.toString()
        },

        nud: function (self, parser) {
            return self
        },

        eval: function (self, context) {
            //pprint('Literal.eval')
            return defer.succeed(self.value)
        }
    }
})

nuage.create_class({
    __module__:'nuage.tpl.smartif',
    __name__: 'EndToken',
    __parent__: nuage.tpl.TokenBase,
    __impl__: {

        __init__: function(self) {
            nuage.tpl.TokenBase.__init__(self)
            self.lbp = 0
        },

        nud: function(self, parser){
            throw parser.error_class("Unexpected end of expression in if tag.")
        }
    }
})

nuage.create_module({
    __name__: 'nuage.tpl.smartif',
    __impl__: {
        EndToken: nuage.tpl.smartif.EndToken(),
        
        infix: function(op,bp, func) {
            nuage.create_class({
                __module__:'nuage.tpl.smartif',
                __name__: 'Operator_'+op,
                __parent__: nuage.tpl.TokenBase,
                __impl__ : {

                    __init__: function(self){
                        self.lbp = bp
                    },

                    led: function(self, left, parser) {
                        self.first = left
                        self.second = parser.expression(bp)
                        return self
                    },

                    eval: function(self, context){
                        try {
                            return defer.DeferredList(list([self.first.eval(context), 
                                self.second.eval(context)])).add_callback(
                                    function(result) {
                                        //pprint("operator result", result)
                                        return func(result.get(0),result.get(1))
                                    }
                                )
                            //return func(self.first.eval(context), 
                            //    self.second.eval(context))
                        }
                        catch(exc) {
                            pprint('Operator_'+op, 'eval exception',exc)
                            return defer.succed('')
                        }
                    }
                }    
            })
            return nuage.tpl.smartif['Operator_'+op]
        },
        prefix: function(op,bp, func) {
            nuage.create_class({
                __module__: 'nuage.tpl.smartif',
                __name__: 'Operator_'+op,
                __parent__: nuage.tpl.TokenBase,
                __impl__ : {

                    __init__: function(self){
                        self.lbp = bp
                    },

                    nud: function(self, parser) {
                        self.first = parser.expression(bp)
                        self.second = null
                        return self
                    },

                    eval: function(self, context){
                        try {
                            return self.first.eval(context
                                            ).add_callback(func
                                            ).add_errback(
                                                function(err) { 
                                                    pprint(err) })
                            //return func(self.first.eval(context))
                        }
                        catch(exc) {
                            pprint(exc)
                            return false
                        }
                    }
                }    
            })
            return nuage.tpl.smartif['Operator_'+ op]
        }

    }
})


nuage.tpl.smartif.OPERATORS = dict({
    'or': nuage.tpl.smartif.infix('or',6, function(x, y) { return x || y }),
    'and': nuage.tpl.smartif.infix('and',7, function(x, y) { return x && y }),
    'not': nuage.tpl.smartif.prefix('not',8, function(x) { return !x }),
    'in': nuage.tpl.smartif.infix('in',9, function(x, y) { return y.index(x)>=0 }),
    '=': nuage.tpl.smartif.infix('eq',10, function(x, y) { return x == y }),
    '==': nuage.tpl.smartif.infix('eq',10, function(x, y) { return x == y }),
    '!=': nuage.tpl.smartif.infix('neq',10, function(x, y) { return x != y }),
    '>': nuage.tpl.smartif.infix('gt',10, function(x, y) { return x > y }),
    '>=': nuage.tpl.smartif.infix('gte',10, function(x, y) { return x >= y }),
    '<': nuage.tpl.smartif.infix('lt',10, function(x, y) { return x < y }),
    '<=': nuage.tpl.smartif.infix('tle',10, function(x, y) { return x <= y })
});


nuage.create_class({
    __name__:'IfParser',
    __module__: 'nuage.tpl.smartif',
    __impl__: {

        __init__: function(self, tokens, __args) {
            self.error_class = exc.ValueError
            self.tokens = map(self.translate_token, tokens)
            self.pos = 0
            self.current_token = self.next()
        },

        translate_token: function(self, token) {
            try {
                var op = nuage.tpl.smartif.OPERATORS.get(token)
            }
            catch(e) {
                if ( isinstance(e,exc.KeyError) ||
                    isinstance(e,exc.TypeError)) {
                    return self.create_var(token)
                }
            }
            return op()
        },

        next: function(self) {
            if (self.pos >= len(self.tokens)) {
                return nuage.tpl.smartif.EndToken
            }
            else {
                var retval = self.tokens.get(self.pos)
                self.pos += 1
                return retval
            }
        },

        parse: function(self) {
            var retval = self.expression()
            // Check that we have exhausted all the tokens
            if ( self.current_token !== nuage.tpl.smartif.EndToken) {
                throw self.error_class("Unused '{0}' at end of if expression.".format(self.current_token.display()))
            }
            return retval
        },

        expression: function(self, rbp) {
            rbp = rbp || 0
            var t = self.current_token
            self.current_token = self.next()
            var left = t.nud(self)
            while (rbp < self.current_token.lbp) {
                t = self.current_token
                self.current_token = self.next()
                left = t.led(left, self)
            }
            return left
        },

        create_var: function(self, value) {
            return nuage.tpl.Literal(value)
        }
    }
})


nuage.create_class({
    __name__: 'TemplateLiteral',
    __parent__: nuage.tpl.Literal,
    __module__: 'nuage.tpl',
    __impl__: {

        __init__: function(self, value, text) {
            self.value = value
            self.text = text //for better error messages
        },

        display: function(self) {
            return self.text
        },

        eval: function(self, context) {
            //print('TemplateLiteral.eval')
            return self.value.resolve(context, true)
        }
    }
})

nuage.create_class({
    __name__:'TemplateIfParser',
    __module__: 'nuage.tpl',
    __parent__:nuage.tpl.smartif.IfParser,
    __impl__: {

        __init__: function(self, parser,tokens, __args) {
            self.template_parser = parser
            nuage.tpl.smartif.IfParser.__init__(self,tokens)
            self.error_class = nuage.tpl.TemplateSyntaxError
        },

        create_var: function (self, value) {
            return nuage.tpl.TemplateLiteral(self.template_parser.compile_filter(value), value)
        }

    }
})

nuage.create_class( {
    __module__:'nuage.tpl',
    __name__: 'ExtendsError',
    __parent__:exc.Exception
})


nuage.create_class( {
    __module__:'nuage.tpl',
    __name__: 'BlockContext',
    __impl__: {

        __init__: function(self) {
            // dictionary of FIFO queues.
            self.blocks = dict()
        },

        add_blocks: function(self, blocks) {
            var k = blocks.keys()
            for (var i=0, l=len(k); i < l; i++ ) {
                var name = k.get(i)
                var block = blocks.get(name)
                if (self.blocks.keys().index(name)>=0) {
                    self.blocks.get(name).insert(0, block)
                    self.blocks.set(name,self.blocks.get(name))
                }
                else {
                    self.blocks.set(name,list([block])) 
                }
            }
        },

        pop: function(self, name) {
            try {
                return self.blocks.get(name).pop()
            }
            catch(e) {
                if ( isinstance(e,exc.IndexError) || 
                    isinstance(e,exc.KeyError)) {
                        return null
                }
                throw e    
            }
        },

        push:function(self, name, block) {
            var l = self.blocks.get(name)
            if ( l == null ) {
                l = list()
            }
            self.blocks.set(name, l.append(block))
        },

        get_block: function(self, name) {
            try {
                return self.blocks.get(name).get(-1)
            } 
            catch (e) {
                if (isinstance(e, exc.IndexError) ||
                isinstance(e, exc.KeyError)) {
                    return null
                }
                throw e
            }
        }
    }
})


nuage.create_class( {
    __module__:'nuage.tpl',
    __name__: 'BlockNode',
    __parent__: nuage.tpl.Node,
    __impl__: {

        __init__: function(self, name, nodelist, parent) {
            self.name = name
            self.nodelist = nodelist 
            self.parent = parent || null
        },

        __repr__: function(self) {
            return "<BlockNode {0}>".format(self.name)
        },

        render: function(self, context) {
            var result = ""
            var block_context = context.render_context.get(nuage.tpl.BLOCK_CONTEXT_KEY)
            context.push()
            if (block_context == null ) {
                //root template block
                context.set('block',self)
                result = self.nodelist.render(context)
            }
            else {
                var push = block_context.pop(self.name)
                var block = push
                if (block == null ) {
                    block = self
                }
                //clone
                block = nuage.tpl.BlockNode(block.name, push.nodelist)
                block.context = context
                context.set('block',block)
                result = block.nodelist.render(context).add_callback(
                    function(result) {
                        if (push != null ) {
                            block_context.push(self.name, push)
                        }
                        return result
                    })
            }
            
            return result.add_callback(function(result) {
                    context.pop()
                    return result
                })
        },

        super_: function(self) {
            var render_context = self.context.render_context
            if ( render_context.has_key(nuage.tpl.BLOCK_CONTEXT_KEY)  &&
                render_context.get(nuage.tpl.BLOCK_CONTEXT_KEY).get_block(self.name) != null ) {
                return self.render(self.context).add_callback( function(result) {
                        return nuage.tpl.mark_safe(result)
                    })
            }
            return defer.suceed('')
        }
    }
})


nuage.create_class( {
    __module__:'nuage.tpl',
    __name__: 'ExtendsNode',
    __parent__:nuage.tpl.Node,
    __static__: {
        must_be_first: true
    },
    __impl__: {

        __init__: function(self, nodelist, parent_name, parent_name_expr) {
            self.nodelist = nodelist
            self.parent_name = parent_name
            self.parent_name_expr = parent_name_expr
            self.blocks = dict()
            var nl = nodelist.get_nodes_by_type(nuage.tpl.BlockNode)
            for ( var i = 0, l = len(nl); i < l; i++  ) {
                self.blocks.set(nl.get(i).name, nl.get(i))
            }
        },

        __repr__: function(self) {
            if (self.parent_name_expr) {
                return "<ExtendsNode {0}>".format(self.parent_name_expr.token)
            }
            return "<ExtendsNode {0}>".format(self.parent_name)
        },

        get_parent: function(self, context) {
            if (self.parent_name_expr) {
                var d = self.parent_name_expr.resolve(context)
            }
            else {
                var d = defer.succeed(self.parent_name)
            }
            return d.add_callback( function(parent) {
                if (!parent) {
                    var error_msg = "Invalid template name in 'extends' tag {0} ".format( parent  )
                    if (self.parent_name_expr) {
                        error_msg += " Got this from the '{0}' variable.".format(self.parent_name_expr.token)
                    }
                    throw TemplateSyntaxError(error_msg)
                }
                if (hasattr(parent, 'render')) {
                    return defer.succeed(parent) // parent is a Template object
                }
                return nuage.tpl.get_template(parent)
            })
        },

        render: function(self, context) {
            var r = self.get_parent(context).add_callback( 
                function(compiled_parent) {
                    if ( !context.render_context.has_key(nuage.tpl.BLOCK_CONTEXT_KEY)  ) {
                        context.render_context.set(nuage.tpl.BLOCK_CONTEXT_KEY,nuage.tpl.BlockContext())
                    }
                    var block_context = context.render_context.get(nuage.tpl.BLOCK_CONTEXT_KEY)
                    // Add the block nodes from this node to the block context
                    block_context.add_blocks(self.blocks)
                    // if this block's parent doesn't have an extends node it is the root,
                    // and its block nodes also need to be added to the block context.
                    for ( var i = 0, l = len(compiled_parent.nodelist); i < l; i++ ) {
                        var node = compiled_parent.nodelist.get(i)
                        // The ExtendsNode has to be the first non-text node.
                        if ( !isinstance(node, nuage.tpl.TextNode) ) {
                            if (!isinstance(node, nuage.tpl.ExtendsNode) ) {
                                var blocks = dict()
                                var nl = compiled_parent.nodelist.get_nodes_by_type(nuage.tpl.BlockNode)
                                for ( var j = 0, l2 = len(nl); j < l2; j++ ) {
                                    blocks.set(nl.get(j).name,nl.get(j))
                                }
                                block_context.add_blocks(blocks)
                            }
                            break
                        }
                    }
                    return compiled_parent.nodelist.render(context)
                }).add_errback(function(failure) {
                                        pprint('eb get_parent.render', failure)
                                    })
            return r
        }
    }
})


nuage.create_class( {
    __module__:'nuage.tpl',
    __name__: 'ConstantIncludeNode',
    __parent__:nuage.tpl.Node,
    __impl__: {

        __init__: function(self, name) {
            try {
                self.template_name = name
            }
            catch(e) {
                self.template_name = null
            }
        },

        render: function(self, context) {
            if (self.template_name) {
                return nuage.tpl.get_template(self.template_name
                        ).add_callback( function(result) {
                            return result.render(context) 
                        })
            }
            else {
                return defer.succeed('')
            }
        }
    }
})

nuage.create_class( {
    __module__:'nuage.tpl',
    __name__: 'IncludeNode',
    __parent__:nuage.tpl.Node,
    __impl__: {

        __init__: function(self, template_name) {
            self.template_name = nuage.tpl.Variable(template_name)
        },

        render: function(self, context) {
            return self.template_name.resolve(context
                        ).add_callback(nuage.tpl.get_template
                        ).add_callback( function(result) {
                    return result.render(context)
                }).add_errback( function(err) {
                    pprint(err)
                    return ''
                })
        }
    }
})
