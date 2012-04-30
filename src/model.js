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

        get_model: function(schema, name) {
            return db._ms.get(schema, dict()).get(name)
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
                    return rv
                }
                catch(ee) {
                    print('restconnector:',ee.message)
                }
            }
            catch(e) {
                print(e.message)
            }
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
                rv = self._construct(model,o[model.__table__],false)
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
                    url: m + '/' + key,
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
                    url: m,
                    method: 'get'},f )
            return f.defer.add_callback(_parse,ref
                ).add_errback(function(failure) { print(failure.get_error_message()) })
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
            var url = self.rest_url(model)
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
            var url = self.rest_url(model)
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
            var el = db.ConstraintErrorlist()
            var fields = self.__class__.__fields__
            for ( var k in fields ) {
                var field = fields[k]
                try {
                    self.set(k, self[k])
                }
                catch(e) {
                    if ( isintance(exc, db.ConstraintError)) {
                        el.append(e)
                    }
                    else {
                        throw e
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
