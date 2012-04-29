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
