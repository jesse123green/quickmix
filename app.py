from flask import Flask, render_template, request, redirect, jsonify, make_response, session
from flask.ext.basicauth import BasicAuth
import numpy as np
import sys,urllib,json,time,re,random,string,math
import os,base64,requests
from datetime import date
from operator import itemgetter
from models import Playlist,Track

stateKey = 'spotify_auth_state'

def generateRandomString(N):
	possible = string.ascii_uppercase + string.digits + string.ascii_lowercase
	return ''.join(random.SystemRandom().choice(possible) for _ in range(N))

def set_cookie(response,cookie_name,cookie_value):
	if cookie_value != None:
		response.set_cookie(cookie_name, cookie_value)
	else:
		response.set_cookie(cookie_name, expires=0) # Expire cookies to avoid future setting conflicts
	return


category_map = {'chill':['sleep','relax','focus'],'party':['pregame','danceparty','late_night'],'workout':['warm_up','gym','cardio'],'hangout':['dinner','feel_good','bbq'],'laborday':['chill','feel_good','pool_party']}




app = Flask(__name__)
app.config.from_object(os.environ['APP_SETTINGS'])
app.url_map.strict_slashes = False

basic_auth = BasicAuth(app)

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/bbq')
def bbq_index():
	return render_template('bbq/index.html')

@app.route('/tune')
def tune():
	pl_type = request.args.get('pl');

	if pl_type == 'chill':
	    tuners = ["Sleep","Relax","Focus"];
	elif pl_type == 'party':
		tuners = ["Pre-game","Dance","Late Night"];
	elif pl_type == 'workout':
		tuners = ["Warm Up","Gym","Cardio"];
	elif pl_type == 'hangout':
		tuners = ["Dinner","Feel Good","BBQ"];
	elif pl_type == 'laborday':
		tuners = ["Chill","Feel Good","Party"];
	else:
		tuners = ["","",""];
		pl_type = "bogus"

	return render_template('tune.html', type=pl_type, tuners=tuners);

@app.route('/playlist')
def pl():
	pl_type = request.args.get('pl')
	if pl_type == None:
		pl_type = 'bogus'
	return render_template('playlist.html', type=pl_type)

@app.route('/bbq/build')
def bbq_build_owner():
	pl_type = request.args.get('pl')
	playlist_option = request.args.get('playlist_option')
	if pl_type == None:
		pl_type = 'bogus'
	return render_template('bbq/owner_build.html', type=pl_type, pl_option=playlist_option)


@app.route('/bbq/collaborate/welcome/<userid>/<playlist_id>')
def bbq_collaborate_clean(userid, playlist_id):
	print userid, playlist_id
	pl_option = request.args.get('pl_option')
	if pl_option == None:
		pl_option = '2'
	pl_type = 'laborday'
	return render_template('bbq/collaborate_index.html', type=pl_type, uid=userid, pid=playlist_id, pl_option=pl_option)


@app.route('/bbq/collaborate/playlist')
def bbq_collaborate_playlist():
	# print 'collaborate plyalist!!!!! '
	# pl_type = request.args.get('pl')
	pl_option = request.args.get('pl_option')
	if pl_option == None:
		pl_option = '2'

	pl_type = 'laborday'

	return render_template('bbq/collaborate_playlist.html', type=pl_type, pl_option=pl_option)


@app.route('/bbq/playlist')
def bbq_playlist_owner():
	pl_type = request.args.get('pl')
	if pl_type == None:
		pl_type = 'bogus'
	return render_template('bbq/owner_playlist.html', type=pl_type)


@app.route('/login/<user_source>',methods=['GET','POST'])
def login(user_source):
	print user_source
	state = generateRandomString(16)
	pl = request.args.get('pl')
	pl_option = request.args.get('pl_option')
	user_id = request.args.get('uid')
	playlist_id = request.args.get('pid')


	redirect_uri = app.config['REDIRECT_URI']+'/'+user_source
	print redirect_uri
	scope = 'user-top-read user-read-email playlist-modify-public playlist-modify-private'
	params ={'state':state,'scope':scope,'response_type':'code','client_id':app.config['SPOTIFY_CLIENT_ID'],'redirect_uri':redirect_uri}

	response = make_response(redirect('https://accounts.spotify.com/authorize?'+urllib.urlencode(params)))



	response.set_cookie(stateKey, state)
	
	set_cookie(response,'pl',pl)
	set_cookie(response,'user_id',user_id)
	set_cookie(response,'playlist_id',playlist_id)
	set_cookie(response,'pl_option',pl_option)

	print 'LOGIN',pl_option
	return response


@app.route('/callback/<user_source>',methods=['GET','POST'])
def callback(user_source):

	code = request.args.get('code')
	state = request.args.get('state')
	storedState = request.cookies.get(stateKey)

	if state is None or state != storedState:
		return redirect('/#error=state_mismatch')
	else:
		url = 'https://accounts.spotify.com/api/token'

		redirect_uri = app.config['REDIRECT_URI']+'/'+user_source
		print redirect_uri
		values = {'grant_type' : 'authorization_code','redirect_uri':redirect_uri,'code':code}
		headers = {'Authorization': 'Basic ' + base64.b64encode(app.config['SPOTIFY_CLIENT_ID'] + ':' + app.config['SPOTIFY_CLIENT_SECRET'])}
		try:
			r = requests.post(url, data=values, headers=headers)
			D = json.loads(r.text)
			access_token = D['access_token']
			refresh_token = D['refresh_token']

			pl = request.cookies.get('pl')
			pl_option = request.cookies.get('pl_option')
			playlist_id = request.cookies.get('playlist_id')
			user_id = request.cookies.get('user_id')
			print "CALLBACK",pl_option
			
			print 'options',pl,pl_option
			print 'user_source',user_source

			if user_source == 'qm':
				print 'QM'
				response = make_response(redirect('/tune?'+urllib.urlencode({'access_token':access_token,'refresh_token':refresh_token,'pl':pl})))
			elif user_source == 'collab':
				print 'COLLAB'
				response = make_response(redirect('/bbq/collaborate/playlist?'+urllib.urlencode({'access_token':access_token,'refresh_token':refresh_token,'pl':pl,'pl_option':pl_option,'playlist_id':playlist_id,'user_id':user_id})))
			elif user_source == 'owner':
				print 'OWNER'
				response = make_response(redirect('/bbq/playlist?'+urllib.urlencode({'access_token':access_token,'refresh_token':refresh_token,'pl':pl,'playlist_option':pl_option})))
			# session['access_token'] = access_token
			response.set_cookie(stateKey, '', expires=0)

			return response
		except requests.exceptions.RequestException as e:    # This is the correct syntax
			print e
			return redirect('/#error=invalid_token')



if __name__ == '__main__':
	app.run()
