///////////// Knockout.js definitions //////////////

function influencerSong(trackid, title, artist, coverart, previewURL) {
    var self = this;
    self.trackid = trackid
    self.title = title;
    self.artist = artist;
    self.coverart = coverart
    self.includeInfluencer = ko.observable(true)
    self.isPlaying = ko.observable(false);
    self.preview = new Audio(previewURL);
}

// Overall viewmodel for this screen, along with initial state
function InfluencersViewModel() {
    var self = this;

    // Editable data
    self.songs1 = ko.observableArray(); // array of songs for option 1
    self.songs2 = ko.observableArray();
    self.songs3 = ko.observableArray();

    self.moodSpectrum = ko.observable(true)
    self.moodOption = ko.observable("option2")
    self.lengthOption = ko.observable("length60")

    self.influencersLoaded = false;

    // Operations
    self.addSong = function(trackid,title,artist,coverart,option,previewURL) {
      if (option == 'option1'){
        self.songs1.push(new influencerSong(trackid,title,artist,coverart,previewURL));
      }
      else if (option == 'option2'){
        self.songs2.push(new influencerSong(trackid,title,artist,coverart,previewURL));
      }
      else if (option == 'option3'){
        self.songs3.push(new influencerSong(trackid,title,artist,coverart,previewURL));
      }
    }

    self.influencers = ko.computed(function() {
       var trackids = [];
       if (self.moodOption() == 'option1') {
         for (var i = 0; i < self.songs1().length; i++){
            if (self.songs1()[i].includeInfluencer()) {
             trackids.push(self.songs1()[i].trackid);

            }
          }
         return trackids;
       }
       else if (self.moodOption() == 'option2') {
         for (var i = 0; i < self.songs2().length; i++){
            if (self.songs2()[i].includeInfluencer()) {
             trackids.push(self.songs2()[i].trackid);

            }
          }
         return trackids;
       }
       else if (self.moodOption() == 'option3') {
         for (var i = 0; i < self.songs3().length; i++){
            if (self.songs3()[i].includeInfluencer()) {
             trackids.push(self.songs3()[i].trackid);

            }
          }
         return trackids;
       }
    });

    self.pauseAll = function(){
      for (i in self.songs1()){
        self.songs1()[i].preview.pause();
        self.songs1()[i].isPlaying(false);
      }
      for (i in self.songs2()){
        self.songs2()[i].preview.pause();
        self.songs2()[i].isPlaying(false);
      }
      for (i in self.songs3()){
        self.songs3()[i].preview.pause();
        self.songs3()[i].isPlaying(false);
      }
    }

    self.playSong = function(song) {
      if (song.preview.paused) {
        self.pauseAll();
        song.preview.play();
        song.isPlaying(true);
      }
      else{
        self.pauseAll();
      }
    }

    self.checkboxClicked = function(song) {
      if (song.includeInfluencer()) {
        song.includeInfluencer(false);
      }
      else{
        song.includeInfluencer(true);
      }
    }

}

IVM = new InfluencersViewModel();


function playlistSong(trackid, title, artist, coverart, previewURL, uri) {
    var self = this;
    self.trackid = trackid
    self.title = title;
    self.artist = artist;
    self.coverart = coverart;
    self.preview = new Audio(previewURL);
    self.isPlaying = ko.observable(false);
    self.uri = uri;
}

// Overall viewmodel for this screen, along with initial state
function PlaylistViewModel() {
    var self = this;

    // Editable data
    self.songs = ko.observableArray();


    // Operations
    self.addSong = function(trackid,title,artist,coverart,previewURL,uri) {
      self.songs.push(new playlistSong(trackid,title,artist,coverart,previewURL,uri));
    }

    self.pauseAll = function(){
      for (i in self.songs()){
        self.songs()[i].preview.pause();
        self.songs()[i].isPlaying(false);
      }
    }

    self.playSong = function(song) {
      if (song.preview.paused) {
        self.pauseAll();
        song.preview.play();
        song.isPlaying(true);
      }
      else{
        self.pauseAll();
      }
    }
}

PVM = new PlaylistViewModel();

ko.applyBindings(PVM);

////////////////////////////////////////////////////


$(document).ready(function() {

  var clipboard = new Clipboard('.collab-link-anchor');

  clipboard.on('success', function(e) {
      e.clearSelection();
      $('.copy-success').show()
      $('.collab-copy-link').hide()
      setTimeout(reset, 3000);
      function reset() {
        $('.copy-success').hide()
        $('.collab-copy-link').show()
      }
  });
  

  function nextMessages(callback) {
    if (loopCount < 4) {
      console.log(build_messages[loopCount]);
      wait = ((Math.random() * 2) + 1.25) * 1000

      setTimeout(nextMessage, wait);
      $('#spotifyOverlayText').html(build_messages[loopCount]);
      loopCount++
      callback()

    }
    else{
      callback()
    }
  }

  function changeMessage(message,callback){
    $('#spotifyOverlayText').html(message);
    callback()
  }

  function nextMessage(nm_callback) {
    build_messages = [
      "Checking your taste preferences",
      "Compiling the best BBQ tracks for you",
      "Building the playlist",
      "Adding it to your Spotify account"
    ]

    completeCount = 0
    total_wait = 0
    for (loopCount = 0; loopCount < 4; loopCount++) {
      
      wait = ((Math.random() * 2) + 1.25) * 1000
      total_wait += wait
      
      this_message = build_messages[loopCount];
      

      (function(this_message) { // Wrapper function to preserve this_message
        setTimeout(function(){
            changeMessage(this_message,function(){
              completeCount++;
              if (completeCount == 4){
                wait = ((Math.random() * 2) + 1.25) * 1000
                console.log('DONE FINALLY')
                setTimeout(nm_callback, wait);
              }
            })
          },
        total_wait);
      })(this_message);

    }
    
  }

  function getInfluencers(time_range,callback){
    _url = 'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range='+time_range
    $.ajax({
        url: _url,
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
          // Top tracks from spotify success
          callback(response)
        }
    });
  }

  function getUserInfo(callback){

    $.ajax({
        url: 'https://api.spotify.com/v1/me/',
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
          userid = response.id;
          display_name = response.display_name;
          if (display_name == null){
            username = userid;
          }
          else{
            username = display_name;
          }
          callback(response)
        }
    });
  }

  function validateInfluencers(callback){

    // Send to backend for validation
    data = {'tracks':user_tracks,'category':playlist_type}
    $.ajax({
        type : "POST",
        url : "https://5sgoxzland.execute-api.us-east-1.amazonaws.com/prod/quickmix_validate/validate",
        data: JSON.stringify(data, null, '\t'),
        contentType: 'application/json;charset=UTF-8',
        success: function(result) {
          // Validation success
          result = JSON.parse(result['body'])
          validated_influencers = result['data'];

          $('.song-info-loading').hide();
          $('.influencers').removeClass("hidden");
          $('#loggedin').show();

          callback();

        }
    });
  }

  function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  function secondsToTime(secs)
  {
      var hours = Math.floor(secs / (60 * 60));

      var divisor_for_minutes = secs % (60 * 60);
      var minutes = Math.floor(divisor_for_minutes / 60);

      var divisor_for_seconds = divisor_for_minutes % 60;
      var seconds = Math.ceil(divisor_for_seconds);

      var obj = {
          "h": hours,
          "m": minutes,
          "s": seconds
      };
      return obj;
  }

  function selectPlaylistTracks(tracks,length_option){
    var playlistLength ;
    var currentLength = 0;
    var n_tracks = tracks.length;

    if (length_option == 'length30'){
      playlistLength = 1800000;
    }
    else if (length_option == 'length60'){
      playlistLength = 3600000;
    }
    else {
     playlistLength = 5400000;
    }
    shuffle(tracks);
    selected_tracks = [];
    selected_tracks_ids = [];
    i = 0;
    while (currentLength < playlistLength){
      if (selected_tracks_ids.includes(tracks[i].id)){
        console.log('TRACK SKIPPED DUP')
        continue
      }
      selected_tracks_ids.push(tracks[i].id)
      selected_tracks.push(tracks[i])
      currentLength += tracks[i]['duration_ms'];
      i += 1;
      if (i >= n_tracks) {
        break;
      }
    }

    return selected_tracks;
  }


  function buildPlaylist(tracks) {
    tracklist = [];
    for (i in tracks) {
      tracklist.push(tracks[i].id)
    }
    $.ajax({
        url: 'https://api.spotify.com/v1/tracks',
        data: {'ids':tracklist.join()},
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
          tracks = selectPlaylistTracks(response.tracks,length_option);
          playlist_length_ms = 0;
          for (i in tracks) {
            playlist_length_ms += tracks[i]['duration_ms'];
            PVM.addSong(tracks[i].id,tracks[i].name,tracks[i].artists[0].name,tracks[i].album.images[1].url,tracks[i].preview_url,tracks[i].uri);
          }
          playlist_length = secondsToTime(playlist_length_ms/1000);
          if (playlist_length.h == 0){
            length_text = playlist_length.m + " minutes"
          }
          else {
            length_text = "1 hour and " + playlist_length.m + " minutes"
          }
          console.log('TRACKS')
          console.log(tracks)
          // $("#playlist-meta").text(tracks.length + " songs and is " + length_text);
        }
    });
  }


  function generateQuickmixPlaylist(callback){

    console.log('influencers')
    data = {'tracks':IVM.influencers(),'pl':playlist_type,'playlist_option':playlist_option}
    $.ajax({
        type : "POST",
        url : "https://5sgoxzland.execute-api.us-east-1.amazonaws.com/prod/quickmix_validate/songs",
        data: JSON.stringify(data, null, '\t'),
        contentType: 'application/json;charset=UTF-8',
        success: function(result) {
          console.log(result);
            result = JSON.parse(result['body'])
            buildPlaylist(result.data.songs);
            callback();
            // $('.song-info-loading').hide();
            // $('.influencers').removeClass("hidden");
        }
      });


  }

  function loadInfluencers(callback){

    options = ['option1','option2','option3']
    for (var option in options){ // loop through each of the 3 mood options
      for (k in validated_influencers[options[option]].tracks){ // loop through the validated songs for that mood
        trackid = validated_influencers[options[option]].tracks[k].id
        track = user_track_data[trackid] // get stored track info
        IVM.addSong(trackid,track.title,track.artist,track.coverart,options[option],track.previewURL); // add to knockout view
      }
    }

    callback();

  }

  function exportToSpotify(callback){

    ga('send', 'event', 'button', 'click', 'owner-export', 'bbq');
    console.log('EXPORTING')
    playlist_title = userid + '’s Labor Day BBQ'
    $('#playlist-title-text').text(playlist_title);
    data = {
      "name": playlist_title,
      "public": false,
      "collaborative": true
    }
    $.ajax({
      type : "POST",
      url : "https://api.spotify.com/v1/users/"+userid+"/playlists",
      data: JSON.stringify(data, null, '\t'),
      headers: {
        'Authorization': 'Bearer ' + access_token
      },
      contentType: 'application/json;charset=UTF-8',
      success: function(result) {
        playlist_id = result.id;


        console.log('SET COLLAB')
        //Set Collab URL
        $('#collabLink').val("http://www.quickmix.io/bbq/collaborate/" + userid + "/" + playlist_id);
        playlist_url = 'https://open.spotify.com/user/' + userid + '/playlist/' + playlist_id


        var tracklist = [];
        for (i in PVM.songs()){
          tracklist.push(PVM.songs()[i].uri)
        }
        // Populate playlist with tracks
        console.log(tracklist)
        $.ajax({
          type : "POST",
          url : "https://api.spotify.com/v1/users/"+userid+"/playlists/"+playlist_id+"/tracks?uri",
          data: JSON.stringify({'uris':tracklist}, null, '\t'),
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          contentType: 'application/json;charset=UTF-8',
          success: function(result) {
            callback();
          }
        });
      }
    });
  }


  var user_tracks = [];
  var user_track_data = {};
  var validated_influencers;
  var userid;
  var username;
  var access_token = getURLParam("access_token");
  var refresh_token = getURLParam("refresh_token");
  var playlist_type = getURLParam("pl");
  var playlist_option = getURLParam("playlist_option");
  var length_option = 'length30';
  var playlist_url = '';

  console.log("Access Token:", access_token);
  console.log("Refresh Token: ", refresh_token);
  console.log("Playlist Type: ", playlist_type);
  console.log("Playlist Option: ", playlist_option);

    if (access_token && playlist_type) {

      /// Call Spotify api in parallel for top songs; reduce, validate, and load songs in view
      async.auto({
          load_messages: function(callback){
              nextMessage(function(){
                console.log('LOAD MESSAGES DONE')
                callback()
              });
          },
          short_term: function(callback){
              getInfluencers('short_term',function(results){
                callback(null, results);
              })
          },
          long_term: function(callback){
              getInfluencers('long_term',function(results){
                callback(null, results);
              })
          },
          medium_term: function(callback){
              getInfluencers('medium_term',function(results){
                callback(null, results);
              })
          },
          user_info: function(callback){
              getUserInfo(function(results){
                callback(null, results);
              })
          },
          reduce_songs: ['short_term', 'long_term', 'medium_term', function(callback, results){
              terms = ['short_term','long_term','medium_term']
              for (term in terms){
                for (i in results[terms[term]].items){
                  if (!(results[terms[term]].items[i].id in user_track_data)){
                    user_tracks.push({'id':results[terms[term]].items[i].id,'artist':results[terms[term]].items[i].artists[0].id})
                    user_track_data[results[terms[term]].items[i].id] = {'title':results[terms[term]].items[i].name,'artist':results[terms[term]].items[i].artists[0].name,'coverart':results[terms[term]].items[i].album.images[1].url,'previewURL':results[terms[term]].items[i].preview_url}
                  }
                }
              }
              callback(null);
          }],
          validate_songs: ['reduce_songs', function(callback, results){
              validateInfluencers(function(){
                console.log('validateInfluencers')
                  loadInfluencers(function() {
                    // console.log('hello ivm')
                    // console.log(IVM.influencers());

                    callback(null);
                  });
              })
          }],
          quickmix_playlist: ['validate_songs', function(callback, results){
              console.log('quickmix_playlist')
              generateQuickmixPlaylist(function(){
                callback(null);
              })
          }],
          export_playlist: ['quickmix_playlist','user_info', function(callback, results){
              console.log('export_playlist')
              exportToSpotify(function(){
                callback(null);
              })
          }],
          remove_overlay: ['export_playlist','load_messages', function(callback, results){
              console.log('remove_overlay')
              removeOverlay(function(){
                callback(null);
              })
          }],
      }, function(err, results) {
        
          // console.log('err = ', err);
      });



    } else {
        shOverlay('/');
    }


    $('#export-bottom').click(function() {
      window.location =  playlist_url;
    });

});

////////////////////////////////////////////////////

function removeOverlay(callback) {
  document.getElementById("spotifyOverlay").style.height = "0%";
  callback()
}

function shOverlay(URL) {
  document.getElementById("errorOverlay").style.height = "100%";
  setTimeout( function() { window.location =  URL}, 1200 );
}

/*
Parses params from URLS - uses location.search (requires ?var=a&var=b syntax - No hashes)
http://stackoverflow.com/a/11582513
*/
function getURLParam(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}
