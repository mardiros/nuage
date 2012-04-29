nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'VariableDoesNotExist',
    __parent__:exc.Exception
});


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'Node',
    __impl__: {

        __init__: function(self, must_be_first) {
            self.must_be_first = must_be_first || false
        },

        __iter__: function(self) {
            return self
        },

        next: function(self){
            return self
        },

        render:function(self, context){
            return defer.succeed('')
        },

        get_nodes_by_type: function(self,  node_type ) {
            var nodes = list()
            if (isinstance(self, node_type)) {
                nodes.append(self)
            }
            if ( hasattr(self, 'nodelist')) {
                nodes.extend(self.nodelist.get_nodes_by_type(node_type))
            }
            return nodes
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'TextNode',
    __parent__:nuage.tpl.Node,
    __impl__: {

        __init__: function(self, s){
            //print('TextNode',s.cut(5)+'...')
            self.s = s
        },

        render:function(self, context){
            return defer.succeed(self.s)
        }
    }
})

nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'VariableNode',
    __parent__: nuage.tpl.Node,
    __impl__: {

        __init__: function(self, filter_expression) {
            self.filter_expression = filter_expression
        },

        render: function(self, context) {
            return self.filter_expression.resolve(context).add_callback( 
                        function(result) {
                            if ((context.autoescape && 
                                 !isinstance(result, nuage.tpl.SafeData)) ||
                                  isinstance(result, nuage.tpl.EscapeData)) {
                                return nuage.tpl.escape(result)
                            }
                            return result
                        })
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'CommentNode',
    __parent__:nuage.tpl.Node,
    __impl__: {

        render:function(self, context){
            return defer.succeed('')
        }
    }
})

nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'IfNode',
    __parent__:nuage.tpl.Node,
    __impl__: {

        __init__: function(self, var_, nodelist_true, nodelist_false){
            self.var_ = var_
            self.nodelist_true = nodelist_true
            self.nodelist_true.debug = true
            self.nodelist_false = nodelist_false
            self._next_pos = 0
            self._treat_true = true
        },

        __iter__: function(self) {
            return self
        },

        next: function(self) {
            if (self._treat_true) {
                if ( self._next_pos < len(self.nodelist_true)  ) {
                    return self.nodelist_true.get(self._next_pos)
                }
                else {
                    self._next_pos = [0]
                    self._treat_true = false
                }
            }
            if (!self._treat_true) {
                if (self._next_pos < len(self.nodelist_false)) {
                    return self.nodelist_false.get(self._next_pos)
                }
                else {
                    //
                }
            }
            self._next_pos++
        },

        get_nodes_by_type: function(self, node_type) {
            nodes = list()
            if (isinstance(self, node_type)) {
                nodes.append(self)
            }
            nodes.extend(self.nodelist_true.get_nodes_by_type(node_type))
            nodes.extend(self.nodelist_false.get_nodes_by_type(node_type))
            return nodes
        },

        render: function(self, context){
            return self.var_.eval(context).add_callback( function(result) {
                if ( result ) {
                    return self.nodelist_true.render(context)
                }
                else {
                    return self.nodelist_false.render(context)
                }
            })
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'ForNode',
    __parent__:nuage.tpl.Node,
    __impl__: {

        __init__: function(self, loopvars, sequence, is_reversed, 
                    nodelist_loop, nodelist_empty ) {
            nuage.tpl.Node.__init__(self,false)
            self.loopvars = loopvars
            self.sequence = sequence
            self.is_reversed = is_reversed            
            self.nodelist_loop = nodelist_loop
            self.nodelist_empty = nodelist_empty || nuage.tpl.NodeList()

            self._next_pos = 0
            self._treat_for = true
        },

        __iter__: function(self) {
            return self
        },

        next: function(self) {
            print('fornode.next')
            // todo: correct function return <=> yeld, 
            //        iterator on list,not array
            if (self._treat_true) {
                if ( self._next_pos < len(self.nodelist_loop)  ) {
                    return self.nodelist_loop.get(self._next_pos)
                }
                else {
                    self._next_pos = [0]
                    self._treat_true = false
                }
            }
            if (!self._treat_true) {
                if (self._next_pos < len(self.nodelist_empty)) {
                    return self.nodelist_empty.get(self._next_pos)
                }
                else {
                    //
                }
            }
            self._next_pos++
        },

        get_nodes_by_type: function(self, nodetype) {
            nodes = list()
            if (isinstance(self, nodetype)) {
                nodes.append(self)
            }
            nodes.extend(self.nodelist_loop.get_nodes_by_type(nodetype))
            nodes.extend(self.nodelist_empty.get_nodes_by_type(nodetype))
            return nodes
        },

        render: function(self, context){
            
            var values = null
            if (context.has_key('forloop')) {
                var parentloop = context.get('forloop')
            }
            else {
                var parentloop = dict() 
            }
            context.push()
            return self.sequence.resolve(context, true).add_callback( function( values ) {

                if (values == null) {
                    values = []
                }
                if (!isinstance(values, dict) && !isinstance(values, list)) {
                    values = list(values)
                }
                var len_values = len(values)
                if (len_values < 1) {
                    context.pop()
                    return self.nodelist_empty.render(context)
                }
                var nodelist = nuage.tpl.NodeList()
                if (self.is_reversed) {
                    print('todo: is_reversed ForNode')
                    //values = reversed(values)
                }
                var unpack = len(self.loopvars) > 1
                // Create a forloop value in the context.  We'll update counters on each
                // iteration just below.
                var loop_dict = {'parentloop': parentloop}
                for (var i = 0; i < len_values; i++) {
                    var item = values.get(i)
                    loop_dict['counter0'] = i
                    loop_dict['counter'] = i + 1
                    loop_dict['revcounter'] = len_values - i
                    loop_dict['revcounter0'] = len_values - i - 1
                    loop_dict['first'] = (i == 0)
                    loop_dict['last'] = (i == len_values - 1)
                    context.set('forloop', loop_dict) 
                    if (unpack) {
                        // If there are multiple loop variables, unpack the item into
                        // them.
                        context.push()
                        for ( var j = 0, l = len(self.loopvars); j < l; j++) {
                            context.set(self.loopvars[j], item[self.loopvars[j]])
                        }
                        //context.update(dict(zip(self.loopvars, item)))
                    }
                    else {
                        context.set(self.loopvars[0], item)
                    }
                    for (var j = 0, len_ = len(self.nodelist_loop); j < len_; j++) {
                        var node = self.nodelist_loop.get(j)
                        nodelist.append(node.render(context))
                    }
                    if (unpack) {
                        // The loop variables were pushed on to the context so pop them
                        // off again. This is necessary because the tag lets the length
                        // of loopvars differ to the length of each set of items and we
                        // don't want to leave any vars from the previous loop on the
                        // context.
                        context.pop()
                    }
                }
                context.pop()
                return nodelist.render(context)
            }).add_errback(function(err) {
                pprint(err)
                return ""
            })
            
        }
    }
})

nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'NodeList',
    __parent__: list,
    __impl__: {

        __init__: function(self) {
            list.__init__(self,[])
            self.contains_nontext = false
            self.debug = false
        },

        render: function(self, context) {
            function _cb(result) {
                return ''.join(result)
            }
            function _eb(fail) {
                print('NodeList.render: {0}'.format(fail.get_error_message()))
            }
            var length = len(self._values)
            if ( length ) {
                var bits = list()
                for ( var i = 0; i < length; i++ ) {
                    if ( isinstance(self._values[i], nuage.tpl.Node)) {
                        bits.append(self.render_node(self._values[i], context))
                    }
                    else {
                        bits.append(self._values[i])
                    }
                }
                return defer.DeferredList(bits).add_callback(_cb).add_errback(_eb)
            }
            else {
                return defer.succeed('')
            }
        },

        get_nodes_by_type: function(self, nodetype) {
            var nodes = list()
            for ( var i = 0, length = len(self._values); i < length; i++ ) {
                   nodes.extend(self._values[i].get_nodes_by_type(nodetype))
            }
            return nodes
        },

        render_node: function(self, node, context) {
            return node.render(context)
        }
    }
})
