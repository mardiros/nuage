nuage.create_module({
    __name__: 'route', __impl__: {
        _views: dict(), _maps: list(), register: function(name, view) {
            route._views.set(name, view)
        },

        connect: function(routepath, defaults_) {
            route._maps.append(route.Route(routepath, defaults_))
        },

        render: function(data) {
            try {
                var maps = route._maps
                for (var i = 0, l = len(maps); i<l; i++) {
                    var c = maps.get(i)
                    if (c.rev_match(data)) {
                        var hash = str(c.routepath)
                        hash = hash.replace(re.compile(':[^}]+}', 'g'), '}')
                        var k = data.keys().values()
                        for (var i = 0, l = len(k); i<l; i++) {
                            try {
                                hash = hash.replace(re.compile('{'+k[i]+'}',
                                    'g'), data.get(k[i]))
                            }
                            catch(exc) {
                                print('--- '+ json.dumps(exc))
                            }
                        }
                        //dispatch
                        return '#'+hash
                    }
                }
            }
            catch(e) {
                print("error building route:", e.message)
                return '#'
            }
        },

        redirect: function(data) {
            window.location=route.render(data)
        },

        parse_hash: function(hash) {
            hash = hash || window.location.hash
            var m
            var maps = route._maps
            for (var i = 0, l = len(maps); i<l; i++) {
                var croute = maps.get(i)
                m = croute.match(hash)
                if (m) {
                    return m
                }
            }
            return null
        },

        dispatch: function(hash) {
            var m = route.parse_hash(hash)
            print('dispaching route ' + hash)
            if (m) {
                //print(m)
                route._views.get(m.get('view'))['do_'+m.get('action')](m)
            }
            else {
                print('no route found')
            }
        }
    }
})


nuage.create_class({
    __module__:'route', __name__: 'Route', __impl__: {

        __init__: function(self, routepath, defaults_){
            self.routepath = routepath
            var path_re = '^#?'
            var routelist = dict()
            var r = routepath.split(/\{|\}/g)
            var intag = false
            var pos = 1
            //var reg
            for (var i in r) {
                if (intag) {
                    var s = r[i].split(':')
                    if (len(s) > 1) {
                        path_re += '('+s[1]+')'
                    }
                    else {
                        path_re += '([a-z0-9_\\-]*)'
                    }
                    //path_re += reg
                    routelist.set(s[0], pos)
                    pos++
                }
                else {
                    path_re += r[i]
                }
               intag = !intag
            }
            self.defaults_ = defaults_
            self.path_re = path_re + '$'
            self.routelist = routelist
        },

        match: function(self, hash) {
            var path_re = re.compile(self.path_re, 'gi')
            var r = path_re.search(hash)
            if (!r) {
                return false
            }
            var v = self.routelist.keys().values()
            var rv = dict()
            rv.update(self.defaults_)
            for (var i in v) {
                rv.set(v[i], r[self.routelist.get(v[i])])
            }
            return rv
        },

        rev_match: function(self, m) {
            /* match in reverse
            */
            var k1 = m.keys().copy().values()
            k1.sort()
            var k2 = self.routelist.keys().copy().values()
            k2.sort()
            return ','.join(k1) == ','.join(k2)
        }
    }
})
