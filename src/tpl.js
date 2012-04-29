nuage.create_module({
    __name__:'nuage.tpl',
    __impl__: {
        TEMPLATE_DIRS:'/templates/',
        BLOCK_TAG_START:'{%',
        BLOCK_TAG_END:'%}',
        VAR_TAG_START:'{{',
        VAR_TAG_END:'}}',
        VAR_ATTR_SEP: '.',
        COMMENT_TAG_START:'{#',
        COMMENT_TAG_END:'#}',
        tag_re: /(\{%[^%]*%\}|\{\{[^\}]*\}\}|\{#[^#]*#\})/gim,

        BLOCK_CONTEXT_KEY: 'block_context',

        TOKEN_TEXT: 0,
        TOKEN_VAR: 1,
        TOKEN_BLOCK: 2,
        TOKEN_COMMENT: 3,

        FILTER_SEP : '|',
        FILTER_ARG_SEP : ':',
        
        filter_re: /([a-z][^\|]*)+(\|(([a-z][^\|\:]*)?(:"?\s*"?)?)+)*/ig,
        smart_split_re:/[^\s"]*("[^"\\]*(\\.[^"\\]*)*")\S*|[^\s']*('[^'\\]*(\\.[^'\\]*)*')\S*|(\S+)/gim,
        
        compile_string: function(str) {
            lexer = nuage.tpl.Lexer(str)
            parser = nuage.tpl.Parser(lexer.tokenize())
            return parser.parse()
        },

        smart_split: function(str) {
            var rv = list()
            var m
            var splitting
            var str2
            str = str.strip()
            do {
                //print('smart_split_re', str)
                m = this.smart_split_re.search(str)
                splitting = m != null
                if (splitting) {
                    str2 = m[5] || m[1] || m[3]
                    rv.append(str2)
                }
            } while (splitting)
            return rv
        },

        mark_safe: function(str) {
            return nuage.tpl.SafeString(str)
        },

        escape: function(str_) {
            if (!isinstance(str_,String)) {
                str_ = str(str_)
            }
            return nuage.tpl.mark_safe(str_.replace('&', '&amp;'
                ).replace('<', '&lt;'
                ).replace('>', '&gt;'
                ).replace('"', '&quot;'
                ).replace("'", '&#39;'))
        },

        templates: dict(),
        get_template:function(name, headers) {
            /**
            * Args:
            *       name: the name ot the template
            *       headers: extra http headers
            * Returns: a nuage.tpl compiled template
            */
            var t = nuage.tpl.templates.get(name,null)
            if (t) {
                return defer.succeed(t)
            }
            var t = document.getElementById(name)
            if (t) {
                var tpl = nuage.tpl.Template(t.text, name)
                nuage.tpl.templates.set(name, tpl)
                // template compiled now, 
                // remove it source from the dom, not needed anymore
                t.parentNode.removeChild(t) 
                return defer.succeed(tpl)
            }
            function _parse(result) {
                var tpl = nuage.tpl.Template(result.responseText, name);
                nuage.tpl.templates.set(name, tpl)
                return tpl
            }
            function _err(err) {
                throw nuage.tpl.TemplateDoesNotExist(name)
            }
            var f = defer.HTTPClientFactory()
            var ctx = {
                url: nuage.tpl.TEMPLATE_DIRS + name,
                method: 'get'
            }
            if (headers) {
                ctx.headers = headers
            }
            reactor.connect_http(ctx,f);
            return f.defer.add_both(_parse, _err)
        },

        helpers: {
            'route_url': function(view, kw) {
                kw["view"] = view
                return route.render(dict(kw))
            },
            'super': function(context) {
                return context.get('block').super_()
            }
        },

        filters: {
            'capitalize': function(s) {return s.capitalize()},
            'length': function(o) { return len(o) },
            'safe': function(s) { return nuage.tpl.mark_safe(str(s)) },
            'escape': function(s) { return nuage.tpl.EscapeString(str(s)) }
        },

        tags: {
            'if': function(parser, token) {
                var bits = token.split_contents()
                bits.pop(0)
                var var_ = nuage.tpl.TemplateIfParser(parser, bits).parse()

                var nodelist_true = parser.parse(list('else','endif'))
                var token = parser.next_token()
                if (token.contents == 'else') {
                    var nodelist_false = parser.parse(list('endif'))
                    parser.delete_first_token()
                }
                else {
                    var nodelist_false = nuage.tpl.NodeList()
                }
                return nuage.tpl.IfNode(var_, nodelist_true, nodelist_false)
            },
            'for': function(parser, token) {
                var bits = list(token.contents.split())
                if (len(bits) < 4) {
                    throw nuage.tpl.TemplateSyntaxError(
                "'for' statements should have at least four words: {0}".format(token.contents))
                }
                var is_reversed = bits.get(-1) == 'reversed'
                var in_index = is_reversed && -3 || -2
                if (bits.get(in_index) != 'in') {
                    throw nuage.tpl.TemplateSyntaxError(
                        "'for' statements should use the format 'for x in y': {0}".format(token.contents))
                }
                var loopvars = bits.get(1,in_index).split(',')
                for (var i = 0, len_ = len(loopvars); i < len_; i++) {
                    loopvars[i] = loopvars[i].strip() 
                    var  var_ = loopvars[i]
                    if (!var_ || (var_.index(' ') >= 0)) {
                        throw nuage.tpl.TemplateSyntaxError(
                            "'for' tag received an invalid argument: {0}".format(
                                                   token.contents))
                    }
                }
                var sequence = parser.compile_filter(bits.get(in_index+1))
                var nodelist_loop = parser.parse(list('empty', 'endfor'))
                var token = parser.next_token()
                if (token.contents == 'empty') {
                    var nodelist_empty = parser.parse(list('endfor'))
                    parser.delete_first_token()
                }
                else {
                    var nodelist_empty = null
                }
                return nuage.tpl.ForNode(loopvars, sequence, is_reversed, 
                    nodelist_loop, nodelist_empty)
            },
            'block': function(parser, token) {
                var bits = token.contents.split()
                if (len(bits) != 2) {
                    throw nuage.tpl.TemplateSyntaxError(
                        "'{0}' tag takes only one argument".format(bits[0]))
                }
                var block_name = bits[1]
                // Keep track of the names of BlockNodes found in this template, so we can
                // check for duplication.
                try {
                    if (parser.loaded_tags.index(block_name) >= 0) {
                        throw nuage.tpl.TemplateSyntaxError(
                            "'{0}' tag with name '{1}' appears "+
                            "more than once".format(bits[0], block_name))
                    }
                    parser.loaded_tags.append(block_name)
                }
                catch(e) { 
                    throw e
                }
                var nodelist = parser.parse(list('endblock', 'endblock ' + block_name))
                parser.delete_first_token()
                return nuage.tpl.BlockNode(block_name, nodelist)
            },
            'extends': function(parser, token) {
                var bits = token.split_contents()
                if (len(bits) != 2) {
                    throw nuage.tpl.TemplateSyntaxError(
                        "'{0}' takes one argument".format(bits[0]))
                }
                var parent_name = null
                var parent_name_expr = null
                var path = bits.get(1)
                if ((list('"', "'")).index(path.cut(0,1) >= 0) && 
                        (path.cut(-1) == path.cut(0,1))) {
                    parent_name = path.cut(1,-1)
                }
                else {
                    parent_name_expr = parser.compile_filter(bits[1])
                }
                var nodelist = parser.parse()
                if (len(nodelist.get_nodes_by_type(nuage.tpl.ExtendsNode)) > 0) {
                    throw nuage.tpl.TemplateSyntaxError(
                        "'{0}' cannot appear more than once in the same template".format(bits[0]))
                }
                return nuage.tpl.ExtendsNode(nodelist, parent_name, parent_name_expr)
            },
            'include': function(parser, token) {
                var bits = token.split_contents()
                if (len(bits) != 2) {
                    throw nuage.tpl.TemplateSyntaxError(
                        "{0} tag takes one argument: the name of the template to be included".format(bits[0]))
                }
                var path = bits.get(1)
                if ((list('"', "'")).index(path.cut(0,1) >= 0) && 
                        (path.cut(-1) == path.cut(0,1))) {
                    return nuage.tpl.ConstantIncludeNode(path.cut(1,-1))
                }
                return nuage.tpl.IncludeNode(bits.get(1))
            }
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'TemplateDoesNotExist',
    __parent__:exc.Exception
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'TemplateNotFound',
    __parent__:exc.Exception
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'TemplateSyntaxError',
    __parent__:exc.Exception
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'SafeData'
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'SafeString',
    __parent__:[nuage.tpl.SafeData,String],
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'EscapeData'
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'EscapeString',
    __parent__:[nuage.tpl.EscapeData,String]
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'Lexer',
    __impl__: {

        __init__: function(self, template_string){
            self.template_string = template_string || ''
            //print('create template ', self.template_string.cut(20))
        },

        tokenize: function(self){
            var rv = list()
            var in_tag = false
            var bits = nuage.tpl.tag_re.split(self.template_string)
            for (var i = 0, length = len(bits); i < length; i++) {
                if (bits[i]) {
                    rv.append(self.create_token(bits[i], in_tag))
                }
                in_tag = !in_tag
            }
            return rv
        },

        create_token: function(self, token, in_tag) {
            if (in_tag) {    
                if (token.startswith(nuage.tpl.VAR_TAG_START)) {
                    //print('token var' + token)
                    return nuage.tpl.Token(nuage.tpl.TOKEN_VAR,
                        token.cut(len(nuage.tpl.VAR_TAG_START), 
                            -len(nuage.tpl.VAR_TAG_END)).strip()
)
                }
                if (token.startswith(nuage.tpl.BLOCK_TAG_START)) {
                    return nuage.tpl.Token(nuage.tpl.TOKEN_BLOCK, 
                        token.cut(len(nuage.tpl.BLOCK_TAG_START),
                            - len(nuage.tpl.BLOCK_TAG_END)).strip()
)
                }
                if (token.startswith(nuage.tpl.COMMENT_TAG_START)) {
                    return nuage.tpl.Token(nuage.tpl.TOKEN_COMMENT, '')
                }
            }
            //print('token text',token)
            return  nuage.tpl.Token(nuage.tpl.TOKEN_TEXT, token)
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'Parser',
    __impl__:{

        __init__: function(self, tokens){
            self.tokens = tokens || list()
            self.tags = dict(nuage.tpl.tags)
            self.filters = dict(nuage.tpl.filters)
            self.loaded_tags = list()
        },

        parse: function(self, parse_until){
            parse_until = parse_until || list()
            var nodelist = nuage.tpl.NodeList()
            while (len(self.tokens)>0) {
                var token = self.next_token()
                switch(token.token_type) {
                    case nuage.tpl.TOKEN_TEXT:
                        self.extend_nodelist(nodelist, 
                            nuage.tpl.TextNode(token.contents), 
                            token)
                    break
                    case nuage.tpl.TOKEN_VAR:
                        if (!token.contents) {
                            self.empty_variable(token)
                        }
                        var filter_expression = self.compile_filter(token.contents)
                        var var_node = self.create_variable_node(filter_expression)
                        self.extend_nodelist(nodelist, var_node,token)
                    
                    break
                    case nuage.tpl.TOKEN_BLOCK:
                        if (parse_until.index(token.contents) >= 0) {
                            self.prepend_token(token)
                            return nodelist
                        }

                        try {
                            var command = token.contents.split()[0]
                            //print('command ' + command)
                        }
                        catch(e) {
                            // todo: vérifier le type de l'exception
                            self.empty_block_tag(token)
                        }
                        // execute callback function for self tag and append resulting node
                        self.enter_command(command, token)
                        try {
                            compile_func = self.tags.get(command)
                        }
                        catch(e) {
                            pprint(e)
                            // todo: vérifier le type de l'exception
                            self.invalid_block_tag(token, command)
                        }
                        try {
                            compiled_result = compile_func(self, token)
                        }
                        catch(e) {
                            pprint(e)
                            // todo: vérifier le type de l'exception
                            if (!self.compile_function_error(token, e)) {
                                throw e
                            }
                        }
                        self.extend_nodelist(nodelist, compiled_result, token)
                        self.exit_command()
                    break
                }
            }
            return nodelist
        },

        skip_past: function(self, endtag) {
            while (len(self.tokens)>0){
                token = self.next_token()
                if ((token.token_type == TOKEN_BLOCK) && (token.contents == endtag)) {
                    return
                }
            }
            self.unclosed_block_tag(list({values:[endtag]}))
        },

        create_variable_node: function(self, filter_expr) {
            return nuage.tpl.VariableNode(filter_expr)
        },

        extend_nodelist: function(self, nodelist, node, token) {
            if (node.must_be_first && (len(nodelist)>0)) {
                throw nuage.tpl.TemplateSyntaxError(
                    "{0} must be the first tag in the template.".format(node))
            }
            if (isinstance(nodelist, nuage.tpl.NodeList) && !isinstance(node, nuage.tpl.TextNode)) {
                nodelist.contains_nontext = true
            }
            nodelist.append(node)
        },

        enter_command: function(self, command,token) {},

        exit_command: function(self, command,token) {},

        error: function(self, token,msg) {
            return nuage.tpl.TemplateSyntaxError(msg)
        },

        empty_variable: function(self, token) {
            throw self.error(token, "Empty variable tag")
        },

        empty_block_tag: function(self, token) {
            throw self.error(token, "Empty block tag")
        },

        invalid_block_tag: function(self, token,command) {
            throw self.error(token, "Invalid block tag '{0}'".format(command))
        },

        unclosed_block_tag: function(self, parse_until) {
            throw self.error(null, "Unclosed tags: {0}".format(', '.join(parse_until)))
        },

        compile_function_error: function(self, token,e) {},

        next_token: function(self) {
            return self.tokens.pop(0)
        },

        prepend_token: function(self, token) {
            self.tokens.insert(0,token)
        },

        delete_first_token: function(self) {
            self.tokens.delete_(0,1)
        },

        add_library: function(self,lib) {
            self.tags.update(lib.tags)
            self.filters.update(lib.filters)
        },

        compile_filter:function(self, token) {
            return nuage.tpl.FilterExpression(token, self)
        },

        find_filter: function(self, filter_name) {
            if (self.filters.keys().index(filter_name) >= 0) {
                return self.filters.get(filter_name)
            }
            throw self.error(null,"Invalid filter: '{0}'".format(filter_name))
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'Template',
    __impl__:  {

        __init__: function(self, template_str, name){
            self.template_str = template_str
            self.name = name || '<Unknown template>'
            self.nodelist = nuage.tpl.compile_string(template_str)
        },

        get_block: function(self,name) {
            var nl = self.nodelist.get_nodes_by_type(nuage.tpl.BlockNode)
            for (var i = 0, l = len(nl); i < l; i++) {
                if (nl.get(i).name == name) {
                    return nl.get(i)
                }
            }
            return null // throw ??
        },

        render: function(self, context) {
            context.render_context.push()
            try {
                return self.nodelist.render(context)
            }
            catch(e) {
                pprint('template.render exception', e)
            }
            finally {
                context.render_context.pop()
            }
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'Token',
    __impl__: {

        __init__: function(self,token_type, contents) {
            self.token_type = token_type
            self.contents = contents
        },

        split_contents: function(self) {
            //print('split_contents', self.contents)
            return nuage.tpl.smart_split(self.contents)
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'Variable',
    __impl__: {

        __init__: function(self, var_) {
            //print('create var ',var_)
            self.literal = null
            self.lookups = null
            self.translate = false
            try {
                self.literal = float_(var_)
            }
            catch(e) {
                self.var_ = var_
                /*
                if (self.var_.startswith('_(') && self.var_.endswith(')')) {
                    self.translate = true
                    self.var_ = self.var_.cut(2,-1)
                }
                */
                //print(self.var_,self.var_.cut(0,1),self.var_.cut(-1,1))

                if ((self.var_.startswith('"') || self.var_.startswith("'")) && 
                    (self.var_.cut(1) == self.var_.cut(-1))) {
                    self.literal = nuage.tpl.mark_safe(self.var_.cut(1,-1))
                }
                else {
                    self.lookups = self.var_.split(nuage.tpl.VAR_ATTR_SEP)
                }
            }
        },

        resolve: function(self, context) {
            var value
            if (self.lookups != null) {
                value = self._resolve_lookup(context)
            }
            else {
                value = self.literal
            }
            if (self.translate) {
                // todo
            }
            return defer.succeed(value)
        },

        _resolve_lookup: function(self, context) {
            var current = null
            try {
                current = context
                for (var i = 0, length = len(self.lookups); i < length; i++) {
                    if (isinstance(current,dict) || isinstance(current,nuage.tpl.Context)) {
                        current = current.get(self.lookups[i])
                    }
                    else {
                        current = current[self.lookups[i]]
                    }
                }
            }
            catch(e) {
                pprint(e)
                current=''
            }
            if (current == null) {
                current = ''
            }
            return current
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'Helper',
    __impl__: {

        __init__: function(self,helper) {
            // helper is an array (a regex search result)
            helper = list(helper)
            self.helper = helper.get(1)
            self.helper_args = helper.get(2,null)
            if (self.helper_args) {
                self.helper_args =  self.helper_args.split(',')
            }
            else {
                self.helper_args = []
            } 
        },

        resolve: function(self, context) {
            if (nuage.tpl.helpers[self.helper]) {
                var asynclist = list()
                var args = []
                var kw = {}
                for (var i = 0, l = len(self.helper_args); i<l; i++) {
                    var arg = self.helper_args[i].strip()
                    if ((list('"', "'")).index(arg.cut(0,1) >= 0) && 
                            (arg.cut(-1) == arg.cut(0,1))) {
                        asynclist.append(defer.succeed(arg.cut(1,-1)
                        ).add_callback(function(result) {
                                    args[i] = result
                                }))
                    }
                    else {
                        if (arg.index('=') > 0) {
                            var d = arg.split('=')
                            d[0] = d[0].strip()
                            d[1] = d[1].strip()
                            if ((list('"', "'")).index(d[1].cut(0,1) >= 0) && 
                                    (d[1].cut(-1) == d[1].cut(0,1))) {
                                asynclist.append(defer.succeed(d[1].cut(1,-1)
                                    ).add_callback(function(result) {
                                            kw[d[0]] = result;
                                        }))
                            }
                            else {
                                var v = nuage.tpl.Variable(d[1])
                                asynclist.append(v.resolve(context
                                    ).add_callback(function(result) {
                                            kw[d[0]] = result;
                                        }))
                            }
                        }
                        else {
                            var v = nuage.tpl.Variable(arg)
                            asynclist.append(v.resolve(context
                                ).add_callback(function(result) {
                                    args[i] = result
                                }))
                        }
                    }
                }
                if (len(asynclist) == 0) {
                    asynclist.append(defer.succeed(1))
                }
                return defer.DeferredList(asynclist).add_callback(function(result) {
                    if (len(kw)) {
                        args.push(kw)
                    }
                    args.push(context)
                    return nuage.tpl.helpers[self.helper].apply(window,args)
                    })
            }
            return defer.succeed("")
        }
    }
})


nuage.create_class({
    __module__:'nuage.tpl',
    __name__: 'FilterExpression',
    __impl__: {

        __init__:function(self, token, parser) {
            //print('create filter expression',token)
            self.token = token
            self.parser = parser
            var helper_re = /([^\(]+)\(([^\)]*)?\)/gim
            var g = self.token.split(nuage.tpl.FILTER_SEP)
            var helper = helper_re.search(g[0])
            if (helper) {
                self.var_ = nuage.tpl.Helper(helper)
            }
            else {
                self.var_ = nuage.tpl.Variable(g[0])
            }
            self.filters = list()
            for (var i = 1, length = g.length; i < length;i++) {
                var filter = g[i].split(nuage.tpl.FILTER_ARG_SEP)
                var filter_func = self.parser.find_filter(filter[0])
                var filter_args = list()
                for (var j = 1, len2 = filter.length; j < len2 ;j++) {
                    if (filter[j].startswith('"') && filter[j].endswith('"')) {
                        //constant
                        filter_args.append([false,filter[j].cut(1,-1)])
                    }
                    else {
                        //var
                        filter_args.append(true,filter[j])
                    }
                }
                var f = [filter[0], filter_func, filter_args]
                self.filters.append(f)
            }
        },

        resolve: function(self, context, ignore_failures){
            return self.var_.resolve(context).add_callback(function(result) {
                for (var i = 0,l = len(self.filters); i < l; i++) {
                    var f = self.filters.get(i)
                    f[2].insert(0,result)
                    result = f[1].apply(window,f[2].values())
                }
                return result
            }).add_errback(function(err) {
                pprint(err)
                return ""
            })
        }
    }
})

