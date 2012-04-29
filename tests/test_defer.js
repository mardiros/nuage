nuage.create_class({
    __name__: 'DeferTestCase',
    __module__: 'test_defer',
    __parent__: unittest.TestCase,
    __impl__: {
        
        test_callback_noargs: function(self) {
            var d = defer.Deferred()
            d.add_callback(
                function(result) {
                    self.fail_unless_equals( arguments.length, 1 )
                    self.fail_unless_equals( result, "ok" )
                }
            )
            d.callback("ok")
            return d
        },
        test_callback_args: function(self) {
            var d = defer.Deferred()
            d.add_callback(
                function(result,one,two,three) {
                    self.fail_unless_equals( arguments.length, 4 )
                    self.fail_unless_equals( result, "ok" )
                    self.fail_unless_equals( one, 1 )
                    self.fail_unless_equals( two, 2 )
                    self.fail_unless_equals( three, 3 )
                },1,2,3
            )
            d.callback("ok")
            return d
        },
        test_two_callback: function(self) {
            var d = defer.Deferred()
            d.add_callback(
                function(result) {
                    return result * 2
                }
            ).add_callback(
                function(result) {
                    self.fail_unless_equals( result, 4 )
                }
            )
            d.callback(2)
            return d
        },
        /*
        test_deferredlist: function(self) {

        },
        test_deferredlist_empty: function(self) {

        },
        test_deferredlist_fireonerror: function(self) {

        },
        test_deferredlist_consumeerrors: function(self) {

        },
        test_defer_succeed: function(self) {

        },
        test_defer_failed: function(self) {

        },
    */
        test_delayedcall_noargs: function(self) {
            var d = defer.Deferred()
            var d1 = datetime()
            function _func() {
                self.fail_unless_equals( arguments.length, 0 )
                 d1 = datetime() - d1
                self.fail_if( (d1 < 1000 ), "delay is 2 seconds" )
                self.fail_if( (d1 > 3000 ), "delay is 2 seconds" )
                d.callback('done')
            }
            reactor.call_later(2,_func)
            return d
        },
        test_delayedcall_args: function(self) {
            var d = defer.Deferred()
            var d1 = datetime()
            function _func(param1,param2) {
                self.fail_unless_equals( arguments.length, 2 )
                 d1 = datetime() - d1
                self.fail_unless( (d1 < 1000 ), "delay is 0 seconds" )
                self.fail_unless_equals( param1,"param1" )
                self.fail_unless_equals( param2,"param2" )
                d.callback('done')
            }
            reactor.call_later(0,_func,"param1","param2")
            return d
        },
    }
})