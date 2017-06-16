from flask import request, render_template, jsonify, make_response, url_for
from app import app

import os
import requests
import uuid
from collections import defaultdict
from lxml import etree
import pandas as pd

query_url = app.config['RAB_QUERY_API']
update_url = app.config['RAB_UPDATE_API']
email = app.config['ADMIN_EMAIL']
passw = app.config['ADMIN_PASS']

log_dir = app.config['LOG_DIR']
merge_dir = os.path.join(log_dir, 'merge')

rdf_finder = etree.XPath('rdf:Description[@rdf:about=$uri]',
				namespaces={'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'})

gatherer = etree

def create_uri():
	new_uri = 'http://vivo.brown.edu/individual/ctrl-{0}'.format(uuid.uuid4().hex)

	header = {'Accept': 'application/sparql-results+xml'}
	query = "ASK {{<{0}> ?p ?o}}"
	data = {'email': email, 'password': passw, 'query': query.format(new_uri)}
	resp = requests.post(query_url, data=data, headers=header)
	tree = etree.fromstring(resp.text.encode('utf-8'))
	existing = tree.find('{http://www.w3.org/2005/sparql-results#}boolean').text
	if existing == 'false':
		return new_uri
	else:
		return None

@app.route('/')
def index():
	query = '''
	CONSTRUCT { <http://vivo.brown.edu/individual/eshih1> ?p ?o }
	WHERE { <http://vivo.brown.edu/individual/eshih1> ?p ?o}
	'''
	headers = {'Accept': 'application/json'}
	data = { 'email': email, 'password': passw, 'query': query }
	resp = requests.post(query_url, data=data, headers=headers)
	return '<p>{0}</p>'.format(resp.text.encode('utf-8'))

@app.route('/entities/')
def entity_manager():
	return render_template('entity_manager.html')

@app.route('/explore/')
def explorer():
	return render_template('explore.html')

@app.route('/explorer/<rabid>')
def explore_details(rabid):
	uri = 'http://vivo.brown.edu/individual/' + rabid
	sbj_query = '''
	CONSTRUCT {{ <{0}> ?p1 ?o . }}
	WHERE {{<{0}> ?p1 ?o .}}
	'''.format(uri)
	obj_query = '''
	CONSTRUCT {{ ?s ?p2 <{0}> .}}
	WHERE{{	?s ?p2 <{0}> . }}
	'''.format(uri)
	headers = {'Accept': 'application/rdf+xml'}
	
	data = { 'email': email, 'password': passw, 'query': sbj_query }
	resp = requests.post(query_url, data=data, headers=headers)
	tree = etree.fromstring(resp.text.encode('utf-8'))
	sbj_data = rdf_finder(tree, uri=uri)
	if len(sbj_data) < 1:
		sbj_results = []
	else:
		sbj_results = sbj_data[0]
	pointers = defaultdict(list)
	simple_data = defaultdict(list)
	for pred in sbj_results:
		obj = pred.get('{http://www.w3.org/1999/02/22-rdf-syntax-ns#}resource')
		if obj:
			pointers[pred.tag.translate(None, '{}')].append(obj)
		else:
			simple_data[pred.tag.translate(None, '{}')].append(pred.text)

	data = { 'email': email, 'password': passw, 'query': obj_query }
	resp = requests.post(query_url, data=data, headers=headers)
	targets = defaultdict(list)
	tree = etree.fromstring(resp.text.encode('utf-8'))
	for desc in tree:
		other = desc.attrib['{http://www.w3.org/1999/02/22-rdf-syntax-ns#}about']
		pred = desc[0].tag
		targets[pred.translate(None, '{}')].append(other.translate(None, '{}'))

	data_targets = [ { 'predicate': key, 'subjects': val } for key, val in targets.items() ]
	data_pointers = [ { 'predicate': key, 'objects': val } for key, val in pointers.items() ]
	data_properties = [ { 'predicate': key, 'value': val } for key, val in simple_data.items() ]
	return jsonify({'targets': data_targets,
					'pointers': data_pointers,
					'properties': data_properties,
					'uri': uri,
					'rabid': rabid })

@app.route('/selector/')
def selector_list():
	type_param = request.args.get('type')
	if  type_param == 'organizations':
		type_uri = 'http://xmlns.com/foaf/0.1/Organization'
	elif type_param == 'venues':
		type_uri = 'http://vivo.brown.edu/ontology/citation#Venue'
	elif type_param == 'concepts':
		type_uri = 'http://www.w3.org/2004/02/skos/core#Concept'
	elif type_param == 'controls':
		type_uri = 'http://vivo.brown.edu/ontology/control#Control'
	else:
		raise
	query = '''
	CONSTRUCT {{ ?s <http://www.w3.org/2000/01/rdf-schema#label> ?label . }}
	WHERE {{
	?s <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <{0}> .
	?s <http://www.w3.org/2000/01/rdf-schema#label> ?label .
	}}
	'''.format(type_uri)
	headers = {'Accept': 'application/rdf+xml'}
	data = { 'email': email, 'password': passw, 'query': query }
	resp = requests.post(query_url, data=data, headers=headers)
	root = etree.fromstring(resp.text.encode('utf-8'))
	data = [ ( desc.get('{http://www.w3.org/1999/02/22-rdf-syntax-ns#}about'),
				desc[0].text ) for desc in root ]
	venue_data = pd.DataFrame(data, columns=['uri', 'label'])
	venue_data['rabid'] = venue_data['uri'].apply( lambda x: x[33:] )
	out = venue_data.sort_values('label').to_json(orient='records')
	return out

@app.route('/control/create/', methods=['POST'])
def create_control():
	control_label = request.form['label']
	new_uri = create_uri()
	graph = 'http://vivo.brown.edu/data/control'
	type_uri = "http://vivo.brown.edu/ontology/control#Control"
	insert_template = u"INSERTDATA{{GRAPH<{0}>{{{1}}}}}"
	type_line = "<{0}><http://www.w3.org/1999/02/22-rdf-syntax-ns#type><{1}> ."
	label_line = "<{0}><http://www.w3.org/2000/01/rdf-schema#label> \"{1}\" ."
	triples = type_line.format(new_uri,type_uri) + label_line.format(new_uri,control_label)
	update_body = insert_template.format(graph, triples)
	payload = {'email': email, 'password': passw, 'update': update_body}
	header = {	'Content-Type': 'application/x-www-form-urlencoded',
				'Connection': 'close' }
	resp = requests.post(update_url, data=payload, headers=header)
	if resp.status_code == 200:
		return jsonify({ 'uri': new_uri, 'label': control_label })
	else:
		return jsonify({})

@app.route('/controls/')
def manage_controls():
	return render_template('controls.html')

@app.route('/usefor/')
def use_for():
	data = request.get_json()

@app.route('/merge/', methods=['POST'])
def merge():
	sbj_query = '''
	CONSTRUCT {{ <{0}> ?p1 ?o . }}
	WHERE {{
		GRAPH <http://vitro.mannlib.cornell.edu/default/vitro-kb-2>
		{{ <{0}> ?p1 ?o .}}
	}}
	'''
	obj_query = '''
	CONSTRUCT {{ ?s ?p2 <{0}> .}}
	WHERE {{
		GRAPH <http://vitro.mannlib.cornell.edu/default/vitro-kb-2>
		{{	?s ?p2 <{0}> . }}
	}}
	'''
	headers = {'Accept': 'application/rdf+xml'}
	q_data = { 'email': email, 'password': passw }

	data = request.get_json()
	merge_into = data['merge_into']
	merge_uri = 'http://vivo.brown.edu/individual/' + merge_into

	to_merge = data['to_merge']
	for rabid in to_merge:
		uri = 'http://vivo.brown.edu/individual/' + rabid
		q_data['query'] = sbj_query.format(uri)
		resp = requests.post(query_url, data=q_data, headers=headers)
		tree = etree.fromstring(resp.text.encode('utf-8'))
		sbj_data = rdf_finder(tree, uri=uri)
		if len(sbj_data) < 1:
			sbj_results = []
		else:
			sbj_results = sbj_data[0]
		to_insert = set()
		to_delete = set()
		for pred in sbj_results:
			obj = pred.get('{http://www.w3.org/1999/02/22-rdf-syntax-ns#}resource')
			if obj:
				to_insert.add(
					(	'<{0}>'.format(merge_uri),
						'<{0}>'.format(pred.tag.translate(None, '{}')),
						'<{0}>'.format(obj) )
				)
				to_delete.add(
					(	'<{0}>'.format(uri),
						'<{0}>'.format(pred.tag.translate(None, '{}')),
						'<{0}>'.format(obj) )
				)
			else:
				dt = pred.get('{http://www.w3.org/1999/02/22-rdf-syntax-ns#}datatype')
				if pred.tag == '{http://www.w3.org/2000/01/rdf-schema#}label':
					if dt:
						text = '"{0}"^^<{1}>'.format(pred.text, dt)
					else:
						text = '"{0}"'.format(pred.text)
					to_delete.add(
							('<{0}>'.format(uri),
							'<{0}>'.format(pred.tag.translate(None, '{}')),
							text)
						)
				else:
					if dt:
						del_text = '"{0}"^^<{1}>'.format(pred.text, dt)
						add_text = del_text
					else:
						add_text = '"{0}"^^<http://www.w3.org/2001/XMLSchema#string>'.format(pred.text)
						del_text = '"{0}"'.format(pred.text)
					to_insert.add(
							( '<{0}>'.format(merge_uri),
							'<{0}>'.format(pred.tag.translate(None, '{}')),
							add_text )
						)
					to_delete.add(
							('<{0}>'.format(uri),
							'<{0}>'.format(pred.tag.translate(None, '{}')),
							del_text )
						)
		q_data['query'] = obj_query.format(uri)
		resp = requests.post(query_url, data=q_data, headers=headers)
		tree = etree.fromstring(resp.text.encode('utf-8'))
		for desc in tree:
			other = desc.attrib['{http://www.w3.org/1999/02/22-rdf-syntax-ns#}about']
			pred = desc[0].tag
			to_insert.add(
				(	'<{0}>'.format(other.translate(None, '{}')),
					'<{0}>'.format(pred.translate(None, '{}')),
					'<{0}>'.format(merge_uri))
				)
			to_delete.add(
				(	'<{0}>'.format(other.translate(None, '{}')),
					'<{0}>'.format(pred.translate(None, '{}')),
					'<{0}>'.format(uri))
				)

		insert_data = ""
		delete_data = ""
		graph = "http://vitro.mannlib.cornell.edu/default/vitro-kb-2"
		for i in to_insert:
			insert_data += "{0} {1} {2} .\n".format(i[0],i[1],i[2])
		for d in to_delete:
			delete_data += "{0} {1} {2} .\n".format(d[0],d[1],d[2])
		insert_template = u"INSERTDATA{{GRAPH<{0}>{{{1}}}}}"
		delete_template = u"DELETEDATA{{GRAPH<{0}>{{{1}}}}}"

		update_body = ""
		update_body += delete_template.format(graph, delete_data)
		update_body += ";"
		update_body += insert_template.format(graph, insert_data)

		with open(os.path.join(merge_dir, rabid + '.txt'), 'w') as f:
			f.write(update_body)

		payload = {'email': email, 'password': passw, 'update': update_body}
		header = {	'Content-Type': 'application/x-www-form-urlencoded',
				'Connection': 'close' }
		resp = requests.post(update_url, data=payload, headers=header)
		print resp.status_code
		print resp.content

	return jsonify({'we_will_merge': to_merge, 'into_this_uri': merge_into})