
nuage.create_class({
    __name__: 'NuageTestCase',
    __module__: 'test_tpl',
    __parent__: unittest.TestCase,
    __impl__: {

        test_ok: function(self) {
            return nuage.tpl.get_template('test_ok'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_var_ok: function(self) {
            return nuage.tpl.get_template('test_var_ok'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({'ok':'ok'})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_nestedvar_ok: function(self) {
            return nuage.tpl.get_template('test_nestedvar_ok'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({
                        'ok': {
                            'ok': {
                                'ok': 'ok'
                            }
                        }
                    })
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_comment: function(self) {
            return nuage.tpl.get_template('test_comment'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_string_length:function(self) {
            return nuage.tpl.get_template('test_string_length'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({strvar:'abcde'})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 5 )
                        })
                })
        }, 

        test_list_length:function(self) {
            return nuage.tpl.get_template('test_list_length'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({
                        listvar: ['a', 'b', 'c', 'd', 'e']
                    })
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 5 )
                        })
                })
        }, 

        test_if_1: function(self) {
            return nuage.tpl.get_template('test_if_1').add_callback(
                function(tpl){
                    return tpl.render(nuage.tpl.Context({})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_if_0_else: function(self) {
            return nuage.tpl.get_template('test_if_0_else'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_if_var: function(self) {
            return nuage.tpl.get_template('test_if_var'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({istrue:true})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_if_not_var: function(self) {
            return nuage.tpl.get_template('test_if_not_var'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({isfalse:false})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_if_var_gt: function(self) {
            return nuage.tpl.get_template('test_if_var_gt'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({'var':15})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_if_var_lt: function(self) {
            return nuage.tpl.get_template('test_if_var_lt'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({'var':5})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_if_var_eq_int: function(self) {
            return nuage.tpl.get_template('test_if_var_eq_int'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({'var':10})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_if_var_eq_str: function(self) {
            return nuage.tpl.get_template('test_if_var_eq_str'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({'var':'abc'})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_if_var_undef: function(self) {
            return nuage.tpl.get_template('test_if_var_undef'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_if_varlen_gt: function(self) {
            return nuage.tpl.get_template('test_if_varlen_gt'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({'var':'abcd'})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_if_1_and_1: function(self) {
            return nuage.tpl.get_template('test_if_1_and_1'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_if_1_or_0: function(self) {
            return nuage.tpl.get_template('test_if_1_or_0'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_for: function(self) {
            return nuage.tpl.get_template('test_for'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({
                        x_list: [ {
                            'ok': 'o'
                        },{
                            'ok': 'k'
                        },
                        ]
                    })
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'ok')
                        })
                })
        },

        test_for2: function(self) {
            return nuage.tpl.get_template('test_for2'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({
                        x_list: [ {
                            y: 'o',
                            z: 'k'
                        },{
                            y: 'O',
                            z: 'K'
                        },
                        ]
                    })
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'okOK')
                        })
                })
        },

        test_for_counter: function(self) {
            return nuage.tpl.get_template('test_for_counter'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({
                        x_list: [ {
                            'ok': 'o'
                        },{
                            'ok': 'k'
                        },
                        ]
                    })
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, '12')
                        })
                })
        },

        test_for_counter0: function(self) {
            return nuage.tpl.get_template('test_for_counter0'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({
                        x_list: [ {
                            'ok': 'o'
                        },{
                            'ok': 'k'
                        },
                        ]
                    })
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, '01')
                        })
                })
        },

        test_for_revcounter: function(self) {
            return nuage.tpl.get_template('test_for_revcounter'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({
                        x_list: [ {
                            'ok': 'o'
                        },{
                            'ok': 'k'
                        },
                        ]
                    })
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, '21')
                        })
                })
        },

        test_for_revcounter0: function(self) {
            return nuage.tpl.get_template('test_for_revcounter0'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({
                        x_list: [ {
                            'ok': 'o'
                        },{
                            'ok': 'k'
                        },
                        ]
                    })
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, '10')
                        })
                })
        },

        test_for_first: function(self) {
            return nuage.tpl.get_template('test_for_first'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({
                        x_list: [ {
                            'ok': 'o'
                        },{
                            'ok': 'k'
                        },
                        ]
                    })
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 'FIRST12')
                        })
                })
        },

        test_for_last: function(self) {
            return nuage.tpl.get_template('test_for_last'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({
                        x_list: [ {
                            'ok': 'o'
                        },{
                            'ok': 'k'
                        },
                        ]
                    })
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, '12LAST')
                        })
                })
        },

        test_for_nested: function(self) {
            return nuage.tpl.get_template('test_for_nested'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({
                        x_list: [ {
                            a: 'O',
                            y_list:[{ 'a': 'X' },{ 'a': 'Y' },{ 'a': 'Z' }]
                        },{
                            a: '1',
                            y_list:[{},{}]
                        },{
                            a: '2'
                        }
                        ]
                    })
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result,
                                '-"O,X""O,Y""O,Z"--"1,""1,"--"2,"-')
                        })
                })
        },

        test_for_nested_counter: function(self) {
            return nuage.tpl.get_template('test_for_nested_counter'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({
                        x_list: [ {
                            y_list:[{},{},{}]
                        },{
                            y_list:[{},{}]
                        },{
                        }
                        ]
                    })
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 
                                '-"1,1""1,2""1,3"--"2,1""2,2"--"3,1"-')
                        })
                })
        },

        test_include: function(self) {
            return nuage.tpl.get_template('test_include'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, '[ok]')
                        })
                })
        },

        test_include_var: function(self) {
            return nuage.tpl.get_template('test_include'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({tpl: 'test_ok' })
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, '[ok]')
                        })
                })
        },

        test_extends: function(self) {
            return nuage.tpl.get_template('test_extends'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result,
                                '[head-override-foot]')
                        })
                })
        },

        test_extends_nested: function(self) {
            return nuage.tpl.get_template('test_extends_nested'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 
                                '[[header1]-override2-foot1]')
                        })
                })
        },

        test_async: function(self) {
            var t = window.location.pathname.split('/')
            t.pop()
            nuage.tpl.TEMPLATE_DIRS = '/'.join(t) + '/templates/'
            
            return nuage.tpl.get_template('test_async.html'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 
                                'ok')
                        })
                })
        },

        test_async_nested: function(self) {
            var t = window.location.pathname.split('/')
            t.pop()
            nuage.tpl.TEMPLATE_DIRS = '/'.join(t) + '/templates/'
            
            return nuage.tpl.get_template('test_async_nested.html'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 
                                'head,body,foot')
                        })
                })
        },

        test_route_url: function(self) {
            return nuage.tpl.get_template('test_route_url'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 
                                '#/ctrl/c')
                        })
                })
        },

        test_route_url_with_var: function(self) {
            return nuage.tpl.get_template('test_route_url_with_var'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({mid:'8888'})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 
                                '#/ctrl/c/8888')
                        })
                })
        },

        test_super: function(self) {
            return nuage.tpl.get_template('test_super'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 
                                '[before-super-after]')
                        })
                })
        },

        test_nested_super: function(self) {
            return nuage.tpl.get_template('test_super_nested2'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 
                                '[b0_0][b1_0_1_2][b2_0_2]')
                        })
                })
        },

        test_nested_super_async: function(self) {
            return nuage.tpl.get_template('test_super_nested_async2.html'
                ).add_callback(function(tpl){
                    return tpl.render(nuage.tpl.Context({})
                        ).add_callback(function (result) {
                            self.fail_unless_equals(result, 
                                '[b0_0][b1_0_1_2][b2_0_2]')
                        })
                })
        }

    }
})
