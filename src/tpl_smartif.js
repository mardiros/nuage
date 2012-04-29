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
