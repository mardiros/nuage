nuage.create_class({
    __name__: 'RouteTestCase',
    __module__: 'test_route',
    __parent__: unittest.TestCase,
    __impl__: {

        test_values: function(self) {
            var r = route.Route('/{action}/{id}',{'view':'default'})
            var v = r.match('/ping/pong')
            self.fail_unless_equals(v.get('view'),'default')
            self.fail_unless_equals(v.get('action'),'ping')
            self.fail_unless_equals(v.get('id'),'pong')
        },

        test_format: function(self) {
            var r = route.Route('/{action:[a-z]+}/{id:[0-9]+}',{'view':'default'})
            var v = r.match('/ping/pong')
            self.fail_if(v,'route should not match format')
            v = r.match('/p1ng/1')
            self.fail_if(v,'route should not match format')
            v = r.match('/ping/1')
            self.fail_unless(v,'route should match format')
        },

    }
})
