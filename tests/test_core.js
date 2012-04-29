nuage.create_class({
    __name__: 'CoreTestCase',
    __module__: 'test_nuage',
    __parent__: unittest.TestCase,
    __impl__: {

        test_object_extend: function(self) {
            var o1 = {
                a: '1'
            }
            var o2 = {
                b: '2'
            }
            Object.extend(o2, o1)
            self.fail_unless_equals(o2.a, '1',
                "Object.extend should copy property a: '1'")
            self.fail_unless_equals(o2.b, '2',
                "Object.extend should still have property b: '2'")
        },

        test_object_clone: function(self) {
            var o1 = {
                a: 1
            }
            var o2 = Object.clone(o1)
            self.fail_unless_equals(typeof o1, typeof o2, "Object.clone should not modify type")
            self.fail_unless_equals(o1.a, o2.a, "Object.clone should copy property")
            self.fail_if_equals(o1, o2, "Object.clone should clone object not the reference")
            o1 = [1, 2, 3]
            o2 = Object.clone(o1)
            
            self.fail_unless_equals(typeof o1, typeof o2, "Object.clone should not modify type")
            self.fail_unless_equals(len(o1), len(o2), "Object.clone should copy property" )
            self.fail_unless_equals(o1[0], o2[0], "Object.clone should copy property")
            
            o1 = dict({
                    k1: '1'
               })
            o2 = Object.clone(o1)
            self.fail_unless_equals(typeof o1, typeof o2, "Object.clone should not modify type")
            self.fail_if_equals(o1, o2, "Object.clone should clone object not the reference")
            self.fail_unless_equals(o1.get('k1'), o2.get('k1'), "Object.clone should copy property")
        },

        test_len: function(self) {
            
            this.fail_unless_equals(len({}), 0, "len({}) should be 0")
            
            this.fail_unless_equals(len([]), 0, "len([]) should be 0")
            this.fail_unless_equals(len(''), 0, "len('') should be 0 ")
            
            var raised = false
            try {
                len(null)
            } 
            catch (e) {
                raised = true
                this.fail_unless(isinstance(e, exc.TypeError), "len(null) should throw TypeError, but " + e.__class__.__name__+ " thrown")
            }
            this.fail_unless(raised, "len(null) should throw TypeError but no exception thrown ")
            
        },
        test_range: function(self) {
            var r = range(4)
            this.fail_unless_equals(len(r),4, "range(4) =>[0,1,2,3] but" + r)
            this.fail_unless_equals(r[0], 0, "range(4) =>[0,1,2,3]")
            this.fail_unless_equals(r[1],1, "range(4) =>[0,1,2,3]")
            this.fail_unless_equals(r[2],2, "range(4) =>[0,1,2,3]")
            this.fail_unless_equals(r[3],3, "range(4) =>[0,1,2,3]")
            
            var r = range(1,3)
            this.fail_unless_equals(len(r),2, "range(1,3) =>[1,2] but " + r)
            this.fail_unless_equals(r[0],1, "range(1,3) =>[1,2]")
            this.fail_unless_equals(r[1],2, "range(1,3) =>[1,2]")
            
            var r = range(1,5,-1)
            this.fail_unless_equals(len(r), 0, "range(1,5,-1) =>[]")

            var r = range(5,1,1)
            this.fail_unless_equals(len(r), 0, "range(5,1,1) =>[]")

            var r = range(1,-2,-1)
            this.fail_unless_equals( len(r),3, "range(1,-2,-1) =>[1, 0,-1] but " + r )
            this.fail_unless_equals( r[0],1, "range(1,-2,-1) =>[1, 0,-1]")
            this.fail_unless_equals( r[1], 0, "range(1,-2,-1) =>[1, 0,-1]")
            this.fail_unless_equals( r[2],-1, "range(1,-2,-1) =>[1, 0,-1]")
            
        },
        test_sort: function(self){
            l = list(1,22,2)
            l.sort()
            self.fail_unless_equals(len(l), 3, "len(l) should be 3 ")
            self.fail_unless_equals(l.get(2), 22, "l.get(2) should be 22")

            nuage.create_class({
                __name__: 'Integer',
                __parent__: Number
            })
            var t = Integer(25)
            l = list(Integer(200),t,Integer(2),Integer(1))
            l.sort()
            self.fail_unless_equals(len(l), 4, "len(l) should be 4 ")
            self.fail_unless_equals(l.get(2), t, "l.get(2) should be Integer(25)")
        },
        test_string: function(self) {
            self.fail_unless_equals( '|'.join([1, 2, 3]), '1|2|3', "'|'.join([1,2,3]) ")

            nuage.create_class({
                __name__: 'MyStr',
                __parent__: String
            })
            
            var str = MyStr('mystring')
            
            self.fail_if('mystring' === str, "MyStr('mystring')")
            self.fail_unless('mystring' == str, "MyStr('mystring')")
            
            self.fail_unless('mystring'.startswith('my'), "mystring starts my")
            self.fail_unless('mystring'.endswith('string'), "mystring ends string")

            self.fail_unless(str.startswith('my'), "mystring starts my")
            self.fail_unless(str.endswith('string'), "mystring ends string")


            self.fail_unless_equals(str.cut(1,7), 'ystrin')
            self.fail_unless_equals('mystring'.cut(1,7), 'ystrin')

            self.fail_unless_equals(str.cut(1,-1), 'ystrin')
            self.fail_unless_equals('mystring'.cut(1,-1), 'ystrin')

            self.fail_unless_equals(str.cut(2), 'my')
            self.fail_unless_equals('mystring'.cut(2), 'my')

            self.fail_unless_equals(str.cut(2, 0), 'string')
            self.fail_unless_equals('mystring'.cut(2, 0), 'string')

            self.fail_unless_equals(str.cut(-2), 'ng')
            self.fail_unless_equals('mystring'.cut(-2), 'ng')

            self.fail_unless_equals(str.zfill(10), '00mystring')
            self.fail_unless_equals('mystring'.zfill(10), '00mystring')


            self.fail_unless_equals("{0},{1},{2}".format("1", "2", "3"), '1,2,3')

            self.fail_unless_equals("{0},{1},{2}".format(["1", "2", "3"]), '1,2,3')
            self.fail_unless_equals("{0},{1},{2}".format(list(["1", "2", "3"])), '1,2,3')

            self.fail_unless_equals("{a},{b},{a}".format({a:"1", b:"2"}), '1,2,1')
            self.fail_unless_equals("{a},{b},{a}".format(dict({a:"1", b:"2"})), '1,2,1')


        },
        test_number: function(self) {
                nuage.create_class({
                    __name__: 'Integer',
                    __parent__: Number
                })
                var myint = Integer(10)
                this.fail_if(10 === myint, "Integer(10) !== 10")
                this.fail_unless(10 == myint, "Integer(10) == 10")
                myint++
                this.fail_unless(11 === myint , 
                    "Integer(10)++ shoud be Integer not Number" )
                this.fail_unless(11 == myint, " Integer(10)++ => 11")
        },
        test_datetime: function(self) {
                var d = datetime(2010,1,6,8,22,40, 0)
                self.fail_unless_equals(d.isoformat(), '2010-01-06T08:22:40.000')
                self.fail_unless_equals(str(d), '2010-01-06 08:22:40.000')
                
                nuage.create_class({
                    __name__: 'DTime',
                    __parent__: datetime
                })
                var md = DTime(2010,1,6,8,22,40, 0)
                self.fail_if(d === md, "DTime(d) === d")
                //self.fail_unless(d == md, "DTime(d) == d")
        },
        test_list: function(self) {
            l1 = list('a', 'b', 'c')
            self.fail_unless_equals(len(l1),3, "len of list ['a', 'b', 'c'] should be 3")
            self.fail_unless_equals(l1.get(0), 'a', "first element should be 'a'")
            self.fail_unless_equals(l1.get(1), 'b', "list l1.get(1) [0,1,2] should be 'b'")
            self.fail_unless_equals(l1.get(-1), 'c', "last element l1.get(-1) should be 'c'")
            self.fail_unless(l1.get(-1)===l1.get(2), "last element should be the third")
            l1.delete_(0)
            l1.delete_(0)
            l1.delete_(0)
            self.fail_unless_equals(len(l1), 0, "len of list [] should be 0")

            l1 = list(0, 1, 2)
            l1.insert(5, 5)
            self.fail_unless_equals(len(l1),4, "insert error, len of list [0,1,2,5] should be 4 ")
            l1.insert(1, 'a')
            self.fail_unless_equals(l1.get(1), 'a', "insert error, list.get(1) [0,a,1,2,5] should be a ")
            self.fail_unless_equals(l1.get(2),1, "insert error,list.get(2) [0,a,1,2,5] should be 1 ")
            
            l1.reverse()
            self.fail_unless_equals(l1.get(0),5, "reverse error, list.get(0) [5,2,1,a, 0] should be 5 " + l1)
            self.fail_unless_equals(l1.get(1),2, "reverse error, list.get(1) [5,2,1,a, 0] should be 2")
            self.fail_unless_equals(l1.get(4), 0, "reverse error, list.get(1) [5,2,1,a, 0] should be 0")
            
            self.fail_unless_equals(l1.index('a'),3, "index error, list.index(a) [5,2,1,a, 0] should be 3")
            l1.append('b')
            self.fail_unless_equals(l1.get(-1), 'b', "[5,2,1,a, 0,b].get(-1) should be b")
            
            var l2 = l1.copy()
            self.fail_if_equals(l1, l2, "l1.copy() should copy to a new reference")
            self.fail_unless_equals(l1.get(0), l1.get(0), "l1.copy() should copy to a new reference")
            
            var a = l2.get(-1)
            var b = l2.pop()
            self.fail_unless_equals(a, b, "l1.pop() should retrieve 'b'")
            self.fail_unless_equals(len(l1),len(l2)+1, "len(l1) should be equals to len(l2) + 1 'b' after pop")

            l1 = list([1,2,3,4,5])
            a = l1.pop(0)
            self.fail_unless_equals(a, 1, "l1.pop(0) should retrieve 1" )

            l1 = list([1,2,3,4,5])
            a = l1.pop(3)
            self.fail_unless_equals(a, 4, "l1.pop(3) should retrieve 4")

            l1 = list([1,2,3,4,5])
            a = l1.pop(-2)
            self.fail_unless_equals(a, 4, "l1.pop(-2) should retrieve 4")

            var raised = false
            try {
                a = l1.pop(10)
            }
            catch(e){
                raised = true
                self.fail_unless(isinstance(e,exc.IndexError), 'l1.pop(10) should throw IndexError')
            }
            self.fail_unless(raised, 'l1.pop(10) should throw IndexError but no exception thrown')

            var raised = false
            try {
                a = l1.pop(-10)
            }
            catch(e){
                raised = true
                self.fail_unless(isinstance(e,exc.IndexError), 'l1.pop(-10) should throw IndexError')
            }
            self.fail_unless(b, 'l1.pop(-10) should throw IndexError but no exception thrown')
            
            l1.clear()
            self.fail_unless_equals(len(l1), 0, "len(l1) should be 0 afert l1.clear()")
            l1.extend([1, '1',2,3])
            l2 = l1.copy()
            self.fail_unless_equals(l1.index(1), 0, "index should return 1 not " + l1.index(1))
            self.fail_unless_equals(l1.index('1'),1, "index should return 1 not " + l1.index('1'))
            self.fail_unless_equals(l1.index('z'),-1, "index should return -1 not " + l1.index('z'))
            
            l1.clear()
            l1.insert(-10, 'a')
            self.fail_unless_equals(l1.get(0), 'a', "first element should be 'a'" + l1)
            l1.insert(-10, 'b')
            self.fail_unless_equals(l1.get(0), 'b', "first element should be 'b' " + l1)
            l1.insert(-1, 'c')
            self.fail_unless_equals(l1.get(1), 'c', "second element should be 'c'")
            
            raised = false
            try {
                l1.get(-len(l1)-1)
            }
            catch(e) {
                raised = true
                self.fail_unless(isinstance(e, exc.IndexError), "get(-len()-1) should throw IndexError, but " + e + " thrown")
            }
            self.fail_unless("get(-len()-1) throw IndexError but no exception thrown ")
        },
        test_dict: function(self) {
            var o1 = dict({
                    a: 'a',
                    b: 'b',
                    c: 'c'
            })
            var kp = o1.items()

            for (var i = 0, length = len(kp); i < length; i++) {
                self.fail_unless_equals( kp[i].k, kp[i].v, "key/value should be equals")
            }

            var k = [{}, 'test']
            var o1 = dict()
            o1.set(k, 'test')
            o1.set(k, 'maj')
            o1.setdefault(k, 'default')
            self.fail_unless_equals( len(o1), 1 )
            self.fail_unless_equals( len(o1.keys()), 1 )
            self.fail_unless_equals( len(o1.values()), 1 )
            self.fail_unless_equals( o1.get(k), 'maj' )
            o1.setdefault('testdefault', 'testdefaultv')
            self.fail_unless_equals( o1.get('testdefault'), 'testdefaultv' )
            
            o1.set('testdefault', 'testv')
            self.fail_unless_equals( o1.get('testdefault'), 'testv' )
            
            //self.fail_unless(o1.has_key('a'), "{a: 'a'}.has_key('a') should return true")
            //self.fail_if(o1.has_key('z'), "{a: 'a'}.has_key('z') should return true" )
            
            // similar but javascript 1.6 only, forget IE
            // 
            //for each ( var kp in o1.items()) {
            //    assertEquals("key/value should be equals", kp.V, kp.K )
            //}
        },
        test_class: function(self) {
            nuage.create_class({
                __module__: 'module',
                __name__: 'obj1',
                __static__: {
                    x: 1,
                    y: function(a){
                        return a
                    }
                },
                __impl__: {
                    __init__: function(self){
                        self.prop = 'A'
                    },
                    inc: function(self,arg) {
                        return arg + 1
                    }
                }
            })
            nuage.create_class({
                __module__: 'module',
                __name__: 'obj2',
                __static__: {},
                __parent__: module.obj1,
                __impl__: {
                    __init__: function(self){
                        module.obj1.__init__(self)
                    }
                }
            })
            this.fail_unless_equals(module.obj1.x,1, "static property not set")
            this.fail_unless_equals(module.obj2.x,1, "ancestors static property not recopy")

            this.fail_unless_equals(module.obj1.y(2),2, "static function not set")
            this.fail_unless_equals(module.obj2.y(3),3, "ancestors static function not recopy")

            this.fail_unless_equals(module.obj1().prop, 'A', "property not recopy")
            this.fail_unless_equals(module.obj2().prop, 'A', "ancestor property not recopy")
            
            this.fail_unless_equals(module.obj1().inc(2),3, "function not set")
            this.fail_unless_equals(module.obj2().inc(3),4, "ancestor function not recopy")
            
        },
        test_isinstance: function(self) {
            this.fail_unless(isinstance(2,Number), "2 is a Number" )
            this.fail_unless(isinstance('str',String), "str is a String" )
            this.fail_unless(isinstance(true,Boolean), "true is a Boolean" )
            
            nuage.create_class({
                __name__: 'ClassA'
            })
            this.fail_unless("ClassA instance ", isinstance(ClassA(),ClassA) )
            nuage.create_class({
                __name__: 'ClassB',
                __parent__: ClassA
            })
            nuage.create_class({
                __name__: 'ClassC',
                __parent__: ClassB
            })
            this.fail_unless("ClassC has a ClassA ancestor", isinstance(ClassC(),ClassA) )
            nuage.create_class({
                __name__: 'ClassAA'
            })
            nuage.create_class({
                __name__: 'ClassAAA',
                __parent__: [ClassA,ClassAA],
                __module__: 'my'
            })
            this.fail_unless("ClassAAA has a ClassA ancestor", isinstance(my.ClassAAA(),ClassA) )
            this.fail_unless("ClassAAA has a ClassAA ancestor", isinstance(my.ClassAAA(),ClassAA) )

        },
        test_issubclass: function(self) {
            nuage.create_class({
                __name__: 'obj1'
            })
            nuage.create_class({
                __name__: 'obj1b'
            })
            nuage.create_class({
                __module__: 'module',
                __name__: 'obj2',
                __parent__: obj1
            })
            nuage.create_class({
                __module__: 'module',
                __name__: 'obj3',
                __parent__: [obj1,obj1b]
            })
            this.fail_unless(issubclass(obj1,obj1), "obj1 is issubclass of obj1")
            this.fail_unless(issubclass(module.obj2,obj1), "obj1 is issubclass of obj2")
            this.fail_if(issubclass(obj1,module.obj2), "obj2 is not issubclass of obj1")

            this.fail_unless(issubclass(module.obj3,obj1), "obj3 is issubclass of obj1")
            this.fail_unless(issubclass(module.obj3,obj1b), "obj3 is issubclass of obj1")
        },
        test_iterator: function() {
            
            //propertyIsEnumerable not usable
            // for ( var i in l ) should not be altered
            var o1 = {
                a: 1
            }
            var k = 0
            for (var i in o1){
                k++
            }
            this.fail_unless(k, 1, "Object.prototype should not be modified for correct use of in")
            var a1 = [0]
            k = 0
            for (var i in o1) {
                k++
            }
            this.fail_unless(k, 1, "Array.prototype should not be modified for correct use of in")
        },

        test_map: function(self) {
            var t = []
            var l =list('a', 'b', 'c')
            map(function(i) {
                t.push(i)
            }, l)
            this.fail_unless(t.length, 3, "map method does not iter all list elements")
            this.fail_unless(t[2], 'c', "map method does not iter list elements in right order")
        },

        test_json_dumps: function(self) {
            this.fail_unless(json.dumps(['a', 'b', 'c']), "['a', 'b', 'c']")
            this.fail_unless(json.dumps({'a': 'x', 'b': 'y', 'c': 'z'}), "{'a': 'x', 'b': 'y', 'c': 'z'}")
        },
        test_json_load: function(self) {
            var a = json.load("['a', 'b', 'c']")
            var b = json.load("{'a': 'x', 'b': 'y', 'c': 'z'}")
            this.fail_unless(isinstance(a,Array), "['a', 'b', 'c'] should be deserialize as array" )
            this.fail_unless_equals(len(a),3)
            this.fail_unless_equals(a[0], 'a')
            this.fail_unless_equals(a[1], 'b')
            this.fail_unless_equals(a[2], 'c')
            this.fail_unless(isinstance(b, Object),
                "{'a': 'x', 'b': 'y', 'c': 'z'} should be deserialize as object")
            this.fail_unless_equals(len(b),3)
            this.fail_unless_equals(b['a'], 'x')
            this.fail_unless_equals(b['b'], 'y')
            this.fail_unless_equals(b['c'], 'z')
        }
    }
})
