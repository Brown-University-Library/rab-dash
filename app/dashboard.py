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

label_finder = etree.XPath('rdf:Description[@rdf:about=$uri]/rdfs:label/text()',
				namespaces={'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
							'rdfs': 'http://www.w3.org/2000/01/rdf-schema#'})

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

@app.route('/explore/venues/')
def venues():
	query = '''
	CONSTRUCT { ?s <http://www.w3.org/2000/01/rdf-schema#label> ?label . }
	WHERE {
	?s <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://vivo.brown.edu/ontology/citation#Venue> .
	?s <http://www.w3.org/2000/01/rdf-schema#label> ?label .
	}
	'''
	headers = {'Accept': 'application/rdf+xml'}
	data = { 'email': email, 'password': passw, 'query': query }
	resp = requests.post(query_url, data=data, headers=headers)
	root = etree.fromstring(resp.text.encode('utf-8'))
	data = [ ( desc.get('{http://www.w3.org/1999/02/22-rdf-syntax-ns#}about'),
				desc[0].text ) for desc in root ]
	venue_data = pd.DataFrame(data, columns=['uri', 'label'])
	venue_data['rabid'] = venue_data['uri'].apply( lambda x: x[33:] )
	out = venue_data.sort_values('label').to_records('dict')
	return render_template('venues.html', data=out)

@app.route('/venues/details/<rabid>')
def venue_details(rabid):
	uri = 'http://vivo.brown.edu/individual/' + rabid
	query = '''
	CONSTRUCT {{ <{0}> ?p1 ?o . 
	             ?s ?p2 <{0}> . 
	             ?p1 <http://www.w3.org/2000/01/rdf-schema#label> ?label1 .
	             ?p2 <http://www.w3.org/2000/01/rdf-schema#label> ?label2 .}}
	WHERE {{
	<{0}> ?p1 ?o .
	?s ?p2 <{0}> .
	OPTIONAL {{ ?p1 <http://www.w3.org/2000/01/rdf-schema#label> ?label1 .}}
	OPTIONAL {{ ?p2 <http://www.w3.org/2000/01/rdf-schema#label> ?label2 .}}
	}}
	'''.format(uri)
	headers = {'Accept': 'application/rdf+xml'}
	data = { 'email': email, 'password': passw, 'query': query }
	resp = requests.post(query_url, data=data, headers=headers)
	tree = etree.fromstring(resp.text.encode('utf-8'))
	sbj = rdf_finder(tree, uri=uri)[0]
	out = defaultdict(list)
	for pred in sbj:
		obj = pred.get('{http://www.w3.org/1999/02/22-rdf-syntax-ns#}resource', pred.text)
		label = label_finder(tree, uri=pred.tag.translate(None, '{}'))
		if label:
			out[label[0]].append(obj)
		else:
			out[pred.tag].append(obj)
	return jsonify(out)