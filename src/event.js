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
