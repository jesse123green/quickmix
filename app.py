from flask import Flask, render_template, request, redirect, jsonify, make_response, session
from flask.ext.basicauth import BasicAuth
import numpy as np
import sys,urllib,json,time,re,random,string,math
import os,base64,requests
from datetime import date
from operator import itemgetter
import gensim
from models import Playlist,Track

stateKey = 'spotify_auth_state'

def generateRandomString(N):
	possible = string.ascii_uppercase + string.digits + string.ascii_lowercase
	return ''.join(random.SystemRandom().choice(possible) for _ in range(N))

track_model = gensim.models.Word2Vec.load('static/w2v/model_001bt.w2v')
category_map = {'chill':['sleep','relax','focus'],'party':['pregame','danceparty','late_night'],'workout':['warm_up','gym','cardio'],'hangout':['dinner','feel_good','bbq'],'laborday':['chill','feel_good','pool_party']}

def categorizeTracks(tracks,category,ntracks=5):
	category_results = {}
	for k,subcat in enumerate(category_map[category]):
		scores = []
		used_artists = {}
		track_num = 0
		for track in tracks:
			if category == 'laborday':
				track_score = track_model.n_similarity(['T_'+track['id']], ['bbq', subcat])
			else:
				track_score = track_model.similarity('T_'+track['id'],subcat)
			if track['artist'] not in used_artists:
				scores.append({'score':track_score,'id':track['id'],'artist':track['artist']})
				used_artists[track['artist']] = (track_score,track_num)
				track_num += 1
			else:
				if track_score > used_artists[track['artist']][0]:
					old_track_num = used_artists[track['artist']][1]
					used_artists[track['artist']] = (track_score,old_track_num)
					scores[old_track_num] = {'score':track_score,'id':track['id'],'artist':track['artist']}
		category_results['option'+str(k+1)] = {'name':subcat,'tracks':sorted(scores, key=itemgetter('score'), reverse=True)[:ntracks]}
	return category_results

def validateTracks(tracks):
	output = []
	for track in tracks:
		if 'T_'+track['id'] in track_model:
			output.append(track)
	return output


def sampleTracks(tracks,n):
	output = []
	spent_artists = {}

	random.shuffle(tracks)
	k = 0
	while k < n:
		try:
			t = tracks.pop()
			if t['artist'] in spent_artists:
				continue
			else:
				output.append(t['id'])
				spent_artists[t['artist']] = 0
				k += 1
		except:
			print 'not enough songs!'
			sys.stdout.flush()
			break
	return output

def buildPlaylist(tracks,activity='relax',n_songs=15,top_n_size=15,n_similar_tracks=80):
	plist = []
	n_influencers = len(tracks)
	tracks_per_track = int(math.ceil(1.*n_songs/n_influencers)) ## number of tracks to pull per influencer

	for track in tracks:

		### Choose top 100 songs closes to track
		results = [{'id':w[0][2:],'song_score':w[1],'influencer':track,'activity_score':track_model.similarity(activity, w[0])} for w in track_model.most_similar(positive=['T_'+track],topn=n_similar_tracks) if (re.match('T_',w[0]))]

		### Order songs by distance to activity and return top_n_size
		sorted_results = sorted(results, key=itemgetter('activity_score'), reverse=True)
		# print [x['activity_score'] for x in sorted_results]
		# print '*'*30
		### Add random selection of tracks_per_track songs to playlist
		plist.extend(random.sample(sorted_results[:max(tracks_per_track,top_n_size)],tracks_per_track))


	output = {'playlist':plist[:n_songs],'influencers':tracks}
	sys.stdout.flush()
	return output

def playlistSongs(tracks,activity='relax',pl='chill'):
	plist = []
	n_influencers = len(tracks)

	if n_influencers == 0:
		return 'Error, no influencers!'
	elif n_influencers == 1:
		n_similar_tracks = 240
		top_n_size = 50
	elif n_influencers == 2:
		n_similar_tracks = 160
		top_n_size = 25
	elif n_influencers == 3:
		n_similar_tracks = 80
		top_n_size = 15
	elif n_influencers == 4:
		n_similar_tracks = 80
		top_n_size = 12
	else:
		n_similar_tracks = 80
		top_n_size = 10


	for track in tracks:

		### Choose top songs closest to track
		if pl == 'laborday':
			results = [{'id':w[0][2:],'song_score':w[1],'influencer':track,'activity_score':track_model.n_similarity([w[0]], ['bbq', activity])} for w in track_model.most_similar(positive=['T_'+track],topn=n_similar_tracks) if (re.match('T_',w[0]))]
		else:
			results = [{'id':w[0][2:],'song_score':w[1],'influencer':track,'activity_score':track_model.similarity(activity, w[0])} for w in track_model.most_similar(positive=['T_'+track],topn=n_similar_tracks) if (re.match('T_',w[0]))]	

		### Order songs by distance to activity and return top_n_size
		sorted_results = sorted(results, key=itemgetter('activity_score'), reverse=True)
		# print [x['activity_score'] for x in sorted_results]
		# print '*'*30
		### Add random selection of tracks_per_track songs to playlist
		plist.extend(sorted_results[:top_n_size])


	output = {'songs':plist,'influencers':tracks}
	sys.stdout.flush()
	return output



app = Flask(__name__)
app.config.from_object(os.environ['APP_SETTINGS'])

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

@app.route('/bbq/collaborate/<playlist_id>')
def bbq_collaborate(playlist_id):
	pl_type = request.args.get('pl')
	if pl_type == None:
		pl_type = 'bogus'
	return render_template('bbq/collaborate_index.html', type=pl_type)

@app.route('/bbq/playlist')
def bbq_playlist_owner():
	pl_type = request.args.get('pl')
	if pl_type == None:
		pl_type = 'bogus'
	return render_template('bbq/owner_playlist.html', type=pl_type)


@app.route('/login',methods=['GET','POST'])
def login():
	state = generateRandomString(16)
	pl = request.args.get('pl')
	pl_option = request.args.get('playlist_option')

	scope = 'user-top-read user-read-email playlist-modify-public playlist-modify-private'
	params ={'state':state,'scope':scope,'response_type':'code','client_id':app.config['SPOTIFY_CLIENT_ID'],'redirect_uri':app.config['REDIRECT_URI']}

	response = make_response(redirect('https://accounts.spotify.com/authorize?'+urllib.urlencode(params)))
	response.set_cookie(stateKey, state)
	response.set_cookie('pl', pl)

	if pl_option != None:
		response.set_cookie('pl_option', pl_option)

	return response


@app.route('/callback',methods=['GET','POST'])
def callback():
	code = request.args.get('code')
	state = request.args.get('state')
	storedState = request.cookies.get(stateKey)

	if state is None or state != storedState:
		return redirect('/#error=state_mismatch')
	else:
		url = 'https://accounts.spotify.com/api/token'

		values = {'grant_type' : 'authorization_code','redirect_uri':app.config['REDIRECT_URI'],'code':code}
		headers = {'Authorization': 'Basic ' + base64.b64encode(app.config['SPOTIFY_CLIENT_ID'] + ':' + app.config['SPOTIFY_CLIENT_SECRET'])}
		try:
			r = requests.post(url, data=values, headers=headers)
			D = json.loads(r.text)
			access_token = D['access_token']
			refresh_token = D['refresh_token']
			pl = request.cookies.get('pl')
			pl_option = request.cookies.get('pl_option')

			print 'options',pl,pl_option

			# TODO: check if pl == "laborday" once the model recognizes that term
			if pl == "laborday" and pl_option != None:
				response = make_response(redirect('/bbq/build?'+urllib.urlencode({'access_token':access_token,'refresh_token':refresh_token,'pl':pl,'playlist_option':pl_option})))
			else:
				response = make_response(redirect('/tune?'+urllib.urlencode({'access_token':access_token,'refresh_token':refresh_token,'pl':pl})))
			# session['access_token'] = access_token
			response.set_cookie(stateKey, '', expires=0)

			return response
		except requests.exceptions.RequestException as e:    # This is the correct syntax
			print e
			return redirect('/#error=invalid_token')



@app.route('/api/build',methods=['POST'])
def build():
	tracks = request.json['tracks']
	print tracks
	sys.stdout.flush()
	playlist_option = int(request.json['playlist_option'][-1])-1
	pl = request.json['pl']
	activity = category_map[pl][playlist_option]
	t = time.time()
	data = buildPlaylist(tracks,activity)
	print time.time()-t
	sys.stdout.flush()

	return jsonify({'status':'ok','data':data})

@app.route('/api/songs',methods=['POST'])
def playlist_songs():
	tracks = request.json['tracks']
	playlist_option = int(request.json['playlist_option'][-1])-1
	pl = request.json['pl']
	activity = category_map[pl][playlist_option]
	t = time.time()
	data = playlistSongs(tracks,activity,pl)
	# print time.time()-t
	sys.stdout.flush()

	return jsonify({'status':'ok','data':data})

@app.route('/api/validate',methods=['POST'])
def validate():
	tracks = request.json['tracks']
	category = request.json['category']

	validTracks = validateTracks(tracks)
	relevantTracks = categorizeTracks(validTracks,category)

	return jsonify({'status':'ok','data':relevantTracks})

if __name__ == '__main__':
	app.run()
