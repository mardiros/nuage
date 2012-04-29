nuage.create_class({
    __name__: 'ModelTestCase',
    __module__: 'testmodel',
    __parent__: unittest.TestCase,
    __impl__: {
        test_db_find: function(self) {
                
            nuage.create_class({
                __name__: 'TestDbFind',
                __module__: 'testdb',
                __parent__:db.Model,
                __static__: {
                    __db__: 'tmp',
                    __table__: 'TestDbFind',
                    __fields__: {
                        name: db.Str({key: true}),
                        description: db.Str()
                    }
                }
            })
            var a = testdb.TestDbFind({'name': 'a', 'description': 'letter'})
            var b = testdb.TestDbFind({'name': 'b', 'description': 'letter'})
            var c = testdb.TestDbFind({'name': 'c', 'description': 'letter'})
            var zero = testdb.TestDbFind({'name': '0', 'description': 'number'})
            var one = testdb.TestDbFind({'name': '1', 'description': 'number'})
            var l = db.find(testdb.TestDbFind,{'description': 'letter'})
            self.fail_unless_equals(len(l), 3)
            self.fail_unless(l.index(a) >= 0, ' model should be found')
            self.fail_unless(l.index(b) >= 0, ' model should be found')
            self.fail_unless(l.index(c) >= 0, ' model should be found')

            var l = db.find(testdb.TestDbFind,{'description': 'letter'},2)
            self.fail_unless_equals(len(l), 2)
            self.fail_if(l.index(zero) >= 0, ' model should not be found')
            self.fail_if(l.index(one) >= 0, ' model should not be found')

            var l = db.find(testdb.TestDbFind,{'description': 'letter'},0)
            self.fail_unless_equals(len(l), 0)

            var l = db.find(testdb.TestDbFind,{'description': 'LETTER'},0)
            self.fail_unless_equals(len(l), 0)

            var l = db.find(testdb.TestDbFind)
            self.fail_unless_equals(len(l), 5)

        },

        test_db_find_one: function(self) {
                
            nuage.create_class({
                __name__: 'TestDbFindOne',
                __module__: 'testdb',
                __parent__:db.Model,
                __static__: {
                    __db__: 'tmp',
                    __table__: 'TestDbFind',
                    __fields__: {
                        name: db.Str({key: true}),
                        description: db.Str(),
                    }
                }
            })
            var a = testdb.TestDbFindOne({'name': 'a', 'description': 'letter'})
            var b = testdb.TestDbFindOne({'name': 'b', 'description': 'letter'})
            var zero = testdb.TestDbFindOne({'name': '0', 'description': 'number'})
            var letters = list(a,b)
            var m = db.find_one(testdb.TestDbFindOne)
            
            self.fail_unless(isinstance(m,testdb.TestDbFindOne),
                "a testdb.TestDbFindOne model should be returned")

            var m = db.find_one(testdb.TestDbFindOne,
                {'description': 'letter'})
            self.fail_unless(isinstance(m,testdb.TestDbFindOne),
                "a testdb.TestDbFindOne model should be returned")
            self.fail_unless(letters.index(m) >= 0,
                ' model should be one of a,b')
        },

        test_db_get: function(self) {
            /*
            return db.get(schema.Schema, 'schema'
).add_callback(function(result) {
                    self.fail_unless(isinstance(result,schema.Schema))
                    self.fail_unless_equals(result.name, 'schema')
                })
            */
        }
    }
})
