import json
import bottle
from bottle import route, run, request, abort, static_file

bottle.debug(True)

db = {}

@route('/documents', method='PUT')
def put_document():
    data = request.body.readline()
    if not data:
        abort(400, 'No data received')
    entity = json.loads(data)
    if not entity.has_key('_id'):
        abort(400, 'No _id specified')
    try:
        db['documents'].save(entity)
    except ValidationError as ve:
        abort(400, str(ve))

@route('/documents/:id', method='GET')
def get_document(id):
    entity = db['documents'].find_one({'_id':id})
    if not entity:
        abort(404, 'No document with id %s' % id)
    return entity
'''

'''
@route('/ws/todo', method='GET')
def list():
    return json.dumps(db.values())

@route('/ws/todo/:label', method='GET')
def get(label):
    return json.dumps(db[label])


@route('/ws/todo/:label', method='POST')
def create(label):
    data = request.body.readline()
    data = json.loads(data)
    db[data['todo']['label']] = data
    return ''

@route('/ws/todo/:label', method='PUT')
def update(label):
    data = request.body.readline()
    data = json.loads(data)
    if label not in db:
        abert(404, 'Not found')
    data['label'] = label
    db[data['label']] = data
    return ''

@route('/script/<filepath:path>')
def script(filepath):
    return static_file(filepath, root='script', mimetype='text/javascript')

@route('/templates/<filepath:path>')
def template(filepath):
    return static_file(filepath, root='templates', mimetype='text/html')

@route('/', method='GET')
def index():
        return """\
<!DOCTYPE HTML>
<script src="/script/nuage.js"></script>
<script src="/script/webapp.js"></script>

<h1>My volatile TODO list</h1>
<div id="body"></div>
"""

run(host='localhost', port=8080, server='wsgiref', debug=True)

