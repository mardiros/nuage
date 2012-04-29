nuage.create_class({
    __name__: 'View',
    __module__: 'nuage',
    __impl__: {

        __init__: function() {},

        dispatch: function(self, data) {
            var method = 'do_'+data.get('action')
            if (hasattr(self, method)) {
                f = getattr(self, method)
                f(data)
            }
            else {
                throw exc.Exception("View action's not implemented: " + method)
            }
        }
    }
})
