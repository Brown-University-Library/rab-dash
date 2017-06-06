from flask import request, render_template, jsonify, make_response, url_for
from app import app

import requests
from collections import defaultdict
from lxml import etree
import pandas as pd

query_url = app.config['RAB_QUERY_API']
email = app.config['ADMIN_EMAIL']
passw = app.config['ADMIN_PASS']

rdf_finder = etree.XPath('rdf:Description[@rdf:about=$uri]',
				namespaces={'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'})

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

@app.route('/editor/<kls>/<frmt>')
def editor(kls, frmt):
	if frmt == 'json':
		accept = 'application/json'
	elif frmt == 'xml':
		accept = 'application/rdf+xml'
	else:
		raise
	if kls == 'organization':
		rdfType = 'http://xmlns.com/foaf/0.1/Organization'
	elif kls == 'venue':
		rdfType = 'http://vivo.brown.edu/ontology/citation#Venue'
	else:
		raise
	query = '''
		CONSTRUCT {{ ?s1 ?p ?o .}}
		WHERE {{
			?s1 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <{0}> .
			?s1 ?p ?o .
			?s2 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <{0}> .
			?s1 <http://www.w3.org/2000/01/rdf-schema#label> ?label .
			?s2 <http://www.w3.org/2000/01/rdf-schema#label> ?label .
			FILTER (?s1 != ?s2)
		}}
	'''.format(rdfType)
	headers = {'Accept': accept}
	data = { 'email': email, 'password': passw, 'query': query }
	resp = requests.post(query_url, data=data, headers=headers)
	return '<p>{0}</p>'.format(resp.text.encode('utf-8'))

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
	tree = etree.fromstring(resp.text.encode('utf-8'))
	obj_data = rdf_finder(tree, uri=uri)
	if len(obj_data) < 1:
		obj_results = []
	else:
		obj_results = obj_data[0]
	targets = defaultdict(list)
	for o in obj_results:
		o_sbj = o.get(
			'{http://www.w3.org/1999/02/22-rdf-syntax-ns#}about').translate(None, '{}')
		for pred in o:
			targets[pred.tag.translate(None, '{}')].append(o_sbj)

	data_targets = [ { 'predicate': key, 'subjects': val } for key, val in targets.items() ]
	data_pointers = [ { 'predicate': key, 'objects': val } for key, val in pointers.items() ]
	data_properties = [ { 'predicate': key, 'value': val } for key, val in simple_data.items() ]
	return jsonify({'targets': data_targets,
					'pointers': data_pointers,
					'properties': data_properties,
					'uri': uri })

@app.route('/selector/')
def selector_list():
	type_param = request.args.get('type')
	if  type_param == 'organizations':
		type_uri = 'http://xmlns.com/foaf/0.1/Organization'
	elif type_param == 'venues':
		type_uri = 'http://vivo.brown.edu/ontology/citation#Venue'
	elif type_param == 'concepts':
		type_uri = 'http://www.w3.org/2004/02/skos/core#Concept'
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