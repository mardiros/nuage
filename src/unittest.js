nuage.create_module({
    __name__ : 'unittest', 
    __impl__: {

        run: function(config) {
            config = config || {}
            var suite = unittest._getSuite(config)
            return unittest.Runner().run(suite)
        },

        _getSuite: function(config) {
            var t = unittest.TestLoader()
            return t.load()
        }
    }
})


nuage.create_class({
    __name__: 'FailTest', 
    __module__ : 'unittest', 
    __parent__: exc.Exception
})


nuage.create_class({
    __name__: 'TestLoader', 
    __module__ : 'unittest', 
    __impl__: {

        __init__: function(self, config) {},

        load: function(self) {
            var rv = list()
            for (var i in nuage._ancestors) {
                var class_ = eval(i)
                try {
                    if (class_ != unittest.TestCase && issubclass(class_, unittest.TestCase)) {
                        rv.append(class_)
                    }
                }
                catch(e) {pprint("TestLoader failed", i, class_, e)}
            }
            return unittest.TestSuite(rv)
        }
        
    }
})


nuage.create_class({
    __name__: 'Runner', 
    __module__ : 'unittest', 
    __impl__: {

        __init__: function(self, config) {
            
        },

        run: function(self, suite) {
            function _cb(result) {
                $('#body').appendChild(document.createElement('hr'))
                $('#body').appendChild(document.createTextNode('end.'))
                $('#body').appendChild(document.createElement('br'))
                $('#body').appendChild(document.createTextNode(
                    '#ok: '+ str(result.get(0)).ljust(4) + 
                    '    #ko:' + str(result.get(1)).ljust(4)))
                $('#body').appendChild(document.createElement('br'))
            }
            return suite.run().add_callback(_cb)
        }
    }
})


nuage.create_class({
    __name__: 'TestSuite', 
    __module__ : 'unittest', 
    __impl__: {

        __init__: function(self, tests) {
            self.tests = tests
        },

        run: function(self) {
            var stats = list(0, 0)
            var d = defer.Deferred()
            function _run(result, tests) {
                if (result) {
                    stats.set(0, result.get(0))
                    stats.set(1, result.get(1))
                }
                if (len(tests)) {
                    var test = tests.pop(0)
                    $('#body').appendChild(document.createElement('hr'))
                    $('#body').appendChild(document.createTextNode(test.__name__))
                    test().run().add_both(_run, tests)
                }
                else {
                    d.callback(stats)
                }
            }
            _run(null, self.tests.copy())
            return d
        }
    }
})

nuage.create_class({
    __name__: 'TestCase', 
    __module__ : 'unittest', 
    __impl__: {

        __init__: function(self) {
            self.failure_exc = unittest.FailTest
            
        },

        setup:function(self) {},

        teardown: function(self) {},

        _run: function(self, result, stats) {
            var d = defer.Deferred()
            function _run(result, tests) {
                
                function printOk(result) {
                    stats.set(0, stats.get(0)+1)
                    var d= document
                    var span = d.createElement('span')
                    span.setAttribute('style', 'color:green')
                    span.appendChild(document.createTextNode('[ok]'))
                    $('#body').appendChild(span)
                    pprint('[ok]')
                    //return result
                }
                function printKo(failure) {
                    stats.set(1, stats.get(1)+1)
                    var d= document
                    var span = d.createElement('span')
                    span.setAttribute('style', 'color:red')
                    span.appendChild(d.createTextNode('[ko]'))
                    
                    var span2 = d.createElement('span')
                    span2.setAttribute('style', 'color:red')
                    span2.appendChild(d.createTextNode(
                        failure.get_error_message()))
                    $('#body').appendChild(span)
                    $('#body').appendChild(d.createElement('br'))
                    $('#body').appendChild(span2)
                    pprint('[ko]', failure)
                    //return result
                }
                
                if (len(tests)) {
                    var test = tests.pop(0)
                    $('#body').appendChild(document.createElement('br'))
                    var txt = (test[0]+' ').rjust(75, '.') + ' '
                    pprint(txt)
                    $('#body').appendChild(document.createTextNode(txt))
                    defer.maybe(test[1]).add_callbacks(printOk, printKo
                        ).add_both(_run, tests)
                }
                else {
                    d.callback('done')
                }
            }
            tests = list()
            for (var i in self) {
                if (i.substring(0, 4) == 'test' && callable(self[i])) {
                    tests.append([i, self[i]])
                }
            }
            _run(null, tests)
            return d
        },
        run: function(self) {
            var stats = list(0, 0)
            function _return (result) {
                return stats
            }
            return defer.maybe(self.setup 
                ).add_callback(self._run, stats
                ).add_both(self.teardown 
                ).add_callback(_return)
        },

        fail: function(self, msg) {
            throw self.failure_exc(msg)
        },

        fail_if: function(self, condition, msg) {
            if (condition) {
                throw self.failure_exc(msg)
            }
        },

        fail_unless: function(self, condition, msg) {
            if (!condition) {
                throw self.failure_exc(msg)
            }
        },

        fail_if_equals: function(self, val0, val1, msg) {
            if (val0 == val1) {
                throw self.failure_exc(msg || val0 + ' == ' + val1)
            }
        },

        fail_unless_equals: function(self, val0, val1, msg) {
            if (val0 != val1) {
                throw self.failure_exc(msg || val0 + ' != ' + val1)
            }
        },

        fail_if_identical: function(self, val0, val1, msg) {
            if (val0 === val1) {
                throw self.failure_exc(msg || val0 + ' === ' + val1)
            }
        },

        fail_unless_identical: function(self, val0, val1, msg) {
            if (val0 !== val1) {
                throw self.failure_exc(msg || val0 + ' !== ' + val1)
            }
        }
    }
})


nuage.create_class({
    __name__: 'TestView', 
    __module__: 'unittest', 
    __parent__: nuage.View, 
    __impl__: {

        do_start: function(self) {
            unittest.run()
        }
    }
})
