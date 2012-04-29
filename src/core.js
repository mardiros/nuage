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