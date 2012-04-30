nuage.create_class({
    __module__: 'todo',
    __name__: 'Todo',
    __parent__:db.Model,
    __static__: {
        __db__: 'ws',
        __table__: 'todo',
        __fields__: {
            label:db.Str({key:true}),
            description:db.Str()
        }
    }
})


nuage.create_class({
    __name__: 'Todo',
    __impl__: {

        do_list: function(self, data) {

            var todolist = db.list(todo.Todo)
            var tpl = nuage.tpl.get_template('list.html')

            return defer.DeferredList(list([todolist, tpl])).add_callback( 
                function(result) {
                    var tpl = result.pop()
                    var todo = result.pop()
                    var ctx = nuage.tpl.Context({'todo': todo})
                    tpl.render(ctx).add_callback(function(view) {
                        $('#body').innerHTML = view
                    })
                }).add_errback( function(failure) {
                    print('Failure:',failure,'\n',failure.get_error_message())
                })
        },

        do_new: function(self, data) {
            nuage.tpl.get_template('new.html').add_callback(
                function(tpl) {
                    data = nuage.tpl.Context({})
                    tpl.render(data).add_callback(function(view) {
                        $('#body').innerHTML = view
                    })
                }
            )
        },

        do_create: function(self, data) {
            var t = todo.Todo({'label': $('#label').value,
                               'description': $('#description').value})

            db.create(t).add_callback(function() {
                data.set('action','list')
                route.redirect(data)
            }).add_errback(function() {
                //self.printerr()
                data.set('action','new')
                route.redirect(data)
            })
        },

        do_edit: function(self, data) {

            var mdl = db.get(todo.Todo, data.get('id'))
            var tpl = nuage.tpl.get_template('edit.html')

            return defer.DeferredList(list([mdl, tpl])).add_callback(
                function(result) {
                    var tpl = result.pop()
                    var todo = result.pop()
                    var ctx = nuage.tpl.Context({'todo': todo})
                    tpl.render(ctx).add_callback(function(view) {
                        $('#body').innerHTML = view
                    })
                }
            )

        },

        do_update: function(self, data) {
            var t = todo.Todo({'label': $('#label').value,
                               'description': $('#description').value})

            db.update(t).add_callback(function() {
                data.set('action','list')
                route.redirect(data)
            }).add_errback(function() {
                //self.printerr()
                data.set('action','new')
                route.redirect(data)
            })
        }
    }
})

db.register_model(todo.Todo)

route.connect('',{'view':'todo','action':'list'})
route.connect('/{view}/{action}',{})
route.connect('/{view}/{action}/{id:[^\\n]+}',{})

route.register('todo',Todo())

reactor.run()
