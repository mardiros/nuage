nuage.create_class( {
    __module__:'nuage.tpl',
    __name__: 'ExtendsError',
    __parent__:exc.Exception
})


nuage.create_class( {
    __module__:'nuage.tpl',
    __name__: 'BlockContext',
    __impl__: {

        __init__: function(self) {
            // dictionary of FIFO queues.
            self.blocks = dict()
        },

        add_blocks: function(self, blocks) {
            var k = blocks.keys()
            for (var i=0, l=len(k); i < l; i++ ) {
                var name = k.get(i)
                var block = blocks.get(name)
                if (self.blocks.keys().index(name)>=0) {
                    self.blocks.get(name).insert(0, block)
                    self.blocks.set(name,self.blocks.get(name))
                }
                else {
                    self.blocks.set(name,list([block])) 
                }
            }
        },

        pop: function(self, name) {
            try {
                return self.blocks.get(name).pop()
            }
            catch(e) {
                if ( isinstance(e,exc.IndexError) || 
                    isinstance(e,exc.KeyError)) {
                        return null
                }
                throw e    
            }
        },

        push:function(self, name, block) {
            var l = self.blocks.get(name)
            if ( l == null ) {
                l = list()
            }
            self.blocks.set(name, l.append(block))
        },

        get_block: function(self, name) {
            try {
                return self.blocks.get(name).get(-1)
            } 
            catch (e) {
                if (isinstance(e, exc.IndexError) ||
                isinstance(e, exc.KeyError)) {
                    return null
                }
                throw e
            }
        }
    }
})


nuage.create_class( {
    __module__:'nuage.tpl',
    __name__: 'BlockNode',
    __parent__: nuage.tpl.Node,
    __impl__: {

        __init__: function(self, name, nodelist, parent) {
            self.name = name
            self.nodelist = nodelist 
            self.parent = parent || null
        },

        __repr__: function(self) {
            return "<BlockNode {0}>".format(self.name)
        },

        render: function(self, context) {
            var result = ""
            var block_context = context.render_context.get(nuage.tpl.BLOCK_CONTEXT_KEY)
            context.push()
            if (block_context == null ) {
                //root template block
                context.set('block',self)
                result = self.nodelist.render(context)
            }
            else {
                var push = block_context.pop(self.name)
                var block = push
                if (block == null ) {
                    block = self
                }
                //clone
                block = nuage.tpl.BlockNode(block.name, push.nodelist)
                block.context = context
                context.set('block',block)
                result = block.nodelist.render(context).add_callback(
                    function(result) {
                        if (push != null ) {
                            block_context.push(self.name, push)
                        }
                        return result
                    })
            }
            
            return result.add_callback(function(result) {
                    context.pop()
                    return result
                })
        },

        super_: function(self) {
            var render_context = self.context.render_context
            if ( render_context.has_key(nuage.tpl.BLOCK_CONTEXT_KEY)  &&
                render_context.get(nuage.tpl.BLOCK_CONTEXT_KEY).get_block(self.name) != null ) {
                return self.render(self.context).add_callback( function(result) {
                        return nuage.tpl.mark_safe(result)
                    })
            }
            return defer.suceed('')
        }
    }
})


nuage.create_class( {
    __module__:'nuage.tpl',
    __name__: 'ExtendsNode',
    __parent__:nuage.tpl.Node,
    __static__: {
        must_be_first: true
    },
    __impl__: {

        __init__: function(self, nodelist, parent_name, parent_name_expr) {
            self.nodelist = nodelist
            self.parent_name = parent_name
            self.parent_name_expr = parent_name_expr
            self.blocks = dict()
            var nl = nodelist.get_nodes_by_type(nuage.tpl.BlockNode)
            for ( var i = 0, l = len(nl); i < l; i++  ) {
                self.blocks.set(nl.get(i).name, nl.get(i))
            }
        },

        __repr__: function(self) {
            if (self.parent_name_expr) {
                return "<ExtendsNode {0}>".format(self.parent_name_expr.token)
            }
            return "<ExtendsNode {0}>".format(self.parent_name)
        },

        get_parent: function(self, context) {
            if (self.parent_name_expr) {
                var d = self.parent_name_expr.resolve(context)
            }
            else {
                var d = defer.succeed(self.parent_name)
            }
            return d.add_callback( function(parent) {
                if (!parent) {
                    var error_msg = "Invalid template name in 'extends' tag {0} ".format( parent  )
                    if (self.parent_name_expr) {
                        error_msg += " Got this from the '{0}' variable.".format(self.parent_name_expr.token)
                    }
                    throw TemplateSyntaxError(error_msg)
                }
                if (hasattr(parent, 'render')) {
                    return defer.succeed(parent) // parent is a Template object
                }
                return nuage.tpl.get_template(parent)
            })
        },

        render: function(self, context) {
            var r = self.get_parent(context).add_callback( 
                function(compiled_parent) {
                    if ( !context.render_context.has_key(nuage.tpl.BLOCK_CONTEXT_KEY)  ) {
                        context.render_context.set(nuage.tpl.BLOCK_CONTEXT_KEY,nuage.tpl.BlockContext())
                    }
                    var block_context = context.render_context.get(nuage.tpl.BLOCK_CONTEXT_KEY)
                    // Add the block nodes from this node to the block context
                    block_context.add_blocks(self.blocks)
                    // if this block's parent doesn't have an extends node it is the root,
                    // and its block nodes also need to be added to the block context.
                    for ( var i = 0, l = len(compiled_parent.nodelist); i < l; i++ ) {
                        var node = compiled_parent.nodelist.get(i)
                        // The ExtendsNode has to be the first non-text node.
                        if ( !isinstance(node, nuage.tpl.TextNode) ) {
                            if (!isinstance(node, nuage.tpl.ExtendsNode) ) {
                                var blocks = dict()
                                var nl = compiled_parent.nodelist.get_nodes_by_type(nuage.tpl.BlockNode)
                                for ( var j = 0, l2 = len(nl); j < l2; j++ ) {
                                    blocks.set(nl.get(j).name,nl.get(j))
                                }
                                block_context.add_blocks(blocks)
                            }
                            break
                        }
                    }
                    return compiled_parent.nodelist.render(context)
                }).add_errback(function(failure) {
                                        pprint('eb get_parent.render', failure)
                                    })
            return r
        }
    }
})


nuage.create_class( {
    __module__:'nuage.tpl',
    __name__: 'ConstantIncludeNode',
    __parent__:nuage.tpl.Node,
    __impl__: {

        __init__: function(self, name) {
            try {
                self.template_name = name
            }
            catch(e) {
                self.template_name = null
            }
        },

        render: function(self, context) {
            if (self.template_name) {
                return nuage.tpl.get_template(self.template_name
                        ).add_callback( function(result) {
                            return result.render(context) 
                        })
            }
            else {
                return defer.succeed('')
            }
        }
    }
})

nuage.create_class( {
    __module__:'nuage.tpl',
    __name__: 'IncludeNode',
    __parent__:nuage.tpl.Node,
    __impl__: {

        __init__: function(self, template_name) {
            self.template_name = nuage.tpl.Variable(template_name)
        },

        render: function(self, context) {
            return self.template_name.resolve(context
                        ).add_callback(nuage.tpl.get_template
                        ).add_callback( function(result) {
                    return result.render(context)
                }).add_errback( function(err) {
                    pprint(err)
                    return ''
                })
        }
    }
})