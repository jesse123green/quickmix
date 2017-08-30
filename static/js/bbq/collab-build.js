///////////// Knockout.js definitions //////////////

function influencerSong(trackid, title, artist, coverart, previewURL, score, uri) {
    var self = this;
    self.trackid = trackid
    self.title = title;
    self.artist = artist;
    self.coverart = coverart
    self.includeInfluencer = ko.observable(true)
    self.isPlaying = ko.observable(false);
    self.preview = new Audio(previewURL);
    self.score = score;
    self.uri = uri;
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

    self.songs = function(option){
      // console.log(option,'OPTION')
      if (option == '1'){
        return self.songs1()
      }
      else if (option == '2'){
        return self.songs2()
      }
      else if (option == '3'){
        return self.songs3()
      }
    }

    // Operations
    self.addSong = function(trackid,title,artist,coverart,option,previewURL,score,uri) {
      // console.log(option,'adding song')
      if (option == 'option1'){
        self.songs1.push(new influencerSong(trackid,title,artist,coverart,previewURL,score,uri));
      }
      else if (option == 'option2'){
        self.songs2.push(new influencerSong(trackid,title,artist,coverart,previewURL,score,uri));
      }
      else if (option == 'option3'){
        self.songs3.push(new influencerSong(trackid,title,artist,coverart,previewURL,score,uri));
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
ko.applyBindings(IVM,document.getElementById('collaborate-tracks'));

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

ko.applyBindings(PVM,document.getElementById('current-tracks'));

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

  $('#collab-link-anchor-id').click(function(e)
    {
      // Cancel jump to top for collab link copy
      e.preventDefault();
    });

  function changeMessage(message,callback){
    if (!IS_LOAD_ERROR){
      $('#spotifyOverlayText').html(message);
    }
    else {
      // console.log('error is in change message')
    }
    callback()
  }

  function nextMessage(nm_callback) {
    build_messages = [
      "Checking your taste preferences",
      "Compiling the best BBQ tracks for you",
      "Adding them to the playlist"
    ]

    completeCount = 0
    total_wait = 0
    total_messages = build_messages.length

    for (loopCount = 0; loopCount < total_messages; loopCount++) {

      if (loopCount > 0) {
        wait = ((Math.random() * 2) + 1.25) * 1000
      }
      else {
        wait = 0
      }
      total_wait += wait

      this_message = build_messages[loopCount];


      (function(this_message) { // Wrapper function to preserve this_message
        setTimeout(function(){
            changeMessage(this_message,function(){
              completeCount++;
              if (completeCount == total_messages){
                wait = ((Math.random() * 2) + 1.25) * 1000
                // console.log('DONE FINALLY')
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
        },
        error: function(result){
          // console.log('SPOTIFY TOP TRACKS ERROR')
          changeMessage('Something went wrong.<br><a href="/bbq/collaborate/welcome/' + owner_id + '/' + playlist_id + '">Please Try Again</a>',function(){
            IS_LOAD_ERROR = true;
            callback()
          })
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
          // console.log(response)
          userid = response.id;
          display_name = response.display_name;
          if (display_name == null){
            username = userid;
          }
          else{
            username = display_name;
          }
          callback(response)
        },
        error: function(result){
          // console.log('SPOTIFY USER INFO ERROR')
          changeMessage('Something went wrong.<br><a href="/bbq/collaborate/welcome/' + owner_id + '/' + playlist_id + '">Please Try Again</a>',function(){
            IS_LOAD_ERROR = true;
            callback()
          })
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

        },
        error: function(result){
          // console.log('QM VALIDATE ERROR')
          changeMessage('Something went wrong.<br><a href="/bbq/collaborate/welcome/' + owner_id + '/' + playlist_id + '">Please Try Again</a>',function(){
            IS_LOAD_ERROR = true;
            callback()
          })
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

  function loadInfluencers(callback){

    n_songs = 3

    // console.log(validated_influencers)
    options = ['option1','option2','option3']

    for (var option in options){ // loop through each of the 3 mood options

      var track_count = 0;

      for (k in validated_influencers[options[option]].tracks){ // loop through the validated songs for that mood
        trackid = validated_influencers[options[option]].tracks[k].id
        score = validated_influencers[options[option]].tracks[k].score
        track = user_track_data[trackid] // get stored track info

        if (!(playlist_track_ids.includes(trackid)) && score > 0){ // Only add collaborator songs that meet criteria
          track_count += 1;
          // console.log(track.uri)
          IVM.addSong(trackid,track.title,track.artist,track.coverart,options[option],track.previewURL,score,track.uri); // add to knockout view
          if (track_count == n_songs){
            break
          }
        }

      }
    }

    callback();

  }

  function loadOwnerPlaylist(callback){
    $.ajax({
      type : "GET",
      url : "https://api.spotify.com/v1/users/"+owner_id+"/playlists/"+playlist_id,
      headers: {
        'Authorization': 'Bearer ' + access_token
      },
      contentType: 'application/json;charset=UTF-8',
      success: function(result) {
        // console.log(result)
        $('#playlist-title-text').text(result.name);
        tracks = result.tracks.items
        // console.log(tracks)
        for (i in tracks){
          playlist_track_ids.push(tracks[i].track.id)
          PVM.addSong(tracks[i].track.id,tracks[i].track.name,tracks[i].track.artists[0].name,tracks[i].track.album.images[1].url,tracks[i].track.preview_url,tracks[i].track.uri)
        }
        callback()
      },
      error: function(result){
        // console.log('SPOTIFY GET PLAYLIST ERROR')
        changeMessage('Something went wrong.<br><a href="/bbq/collaborate/welcome/' + owner_id + '/' + playlist_id + '">Please Try Again</a>',function(){
          IS_LOAD_ERROR = true;
          callback()
        })
      }
    });

  }

  function exportToSpotify(callback){

    ga('send', 'event', 'button', 'click', 'collab-export', 'bbq');
    // console.log('EXPORTING',playlist_option)

    var export_tracklist = [];
    songs  = IVM.songs(playlist_option)
    // console.log(songs)
    for (i in songs){
      export_tracklist.push(songs[i].uri)
    }

    // Populate playlist with tracks
    if (export_tracklist.length > 0) {
      data = {'tracks':export_tracklist,'playlist_id':playlist_id,'owner_id':owner_id,'user_id':userid}
      $.ajax({
        type : "POST",
        url : "https://5sgoxzland.execute-api.us-east-1.amazonaws.com/stage/playlist-update/collaborate",
        data: JSON.stringify(data, null, '\t'),
        contentType: 'application/json;charset=UTF-8',
        success: function(result) {
          // console.log(result)
          callback();
        },
        error: function(result){
          // console.log('SPOTIFY EXPORT ERROR')
          changeMessage('Something went wrong.<br><a href="/bbq/collaborate/welcome/' + owner_id + '/' + playlist_id + '">Please Try Again</a>',function(){
            IS_LOAD_ERROR = true;
            callback()
          })
        }
      });
    }
    else {
      $("#tracklist-title").text("YOUR BBQ TRACKS WERE ALREADY ADDED!")
      callback()
    }

  }

  var IS_LOAD_ERROR = false;

  var user_tracks = [];
  var user_track_data = {};
  var validated_influencers;
  var userid;
  var username;
  var access_token = getURLParam("access_token");
  var playlist_type = getURLParam("pl");
  var playlist_option = getURLParam("pl_option");
  var playlist_id = getURLParam("playlist_id");
  var owner_id = getURLParam("user_id");
  var playlist_url = 'https://open.spotify.com/user/' + owner_id + '/playlist/' + playlist_id;
  var artist_influencers = {};
  var playlist_track_ids = [];
  var collaborator_track_ids;

  IVM.moodOption('option'+playlist_option)// Set Knockout option to correct mood

  // console.log("Access Token:", access_token);
  // console.log("Playlist Type: ", playlist_type);
  // console.log("Playlist Option: ", playlist_option);
  // console.log("Playlist ID: ", playlist_id);
  // console.log("Owner ID: ", owner_id);

  $('#collab-next-steps').html("Your top barbecue tracks have been added to the playlist. <br/><a id='listenLink' class='listen-text-link' href='"+playlist_url+"'>Listen on Spotify</a>");

    if (access_token && playlist_type) {

      /// Call Spotify api in parallel for top songs; reduce, validate, and load songs in view
      async.auto({
          load_messages: function(callback){
              nextMessage(function(){
                // console.log('LOAD MESSAGES DONE')
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
          owner_playlist: function(callback){
              loadOwnerPlaylist(function(results){
                callback(null, results);
              })
          },
          reduce_songs: ['short_term', 'long_term', 'medium_term', function(callback, results){
              terms = ['short_term','long_term','medium_term']
              for (term in terms){
                for (i in results[terms[term]].items){
                  if (!(results[terms[term]].items[i].id in user_track_data)){
                    user_tracks.push({'id':results[terms[term]].items[i].id,'artist':results[terms[term]].items[i].artists[0].id})
                    // console.log(results[terms[term]].items[i].uri)
                    user_track_data[results[terms[term]].items[i].id] = {'uri':results[terms[term]].items[i].uri,'title':results[terms[term]].items[i].name,'artist':results[terms[term]].items[i].artists[0].name,'coverart':results[terms[term]].items[i].album.images[1].url,'previewURL':results[terms[term]].items[i].preview_url}
                  }
                }
              }
              callback(null);
          }],
          validate_songs: ['reduce_songs','owner_playlist', function(callback, results){
              validateInfluencers(function(){
                // console.log('validateInfluencers')
                  loadInfluencers(function() {
                    // console.log('hello ivm')
                    // console.log(IVM.influencers());

                    callback(null);
                  });
              })
          }],
          export_playlist: ['validate_songs', function(callback, results){
              // console.log('export_playlist')
              exportToSpotify(function(){
                callback(null);
              })
          }],
          remove_overlay: ['export_playlist','load_messages', function(callback, results){
              // console.log('remove_overlay')
              if (!IS_LOAD_ERROR) {
                removeOverlay(function(){
                  callback(null);
                })
              }
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
