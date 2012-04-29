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
        __lt__: function(cls, a, b) {
            return (a.time < b.time)
        },
        __gt__: function(cls, a, b) {
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
