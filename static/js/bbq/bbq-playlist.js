///////////// Knockout.js definitions //////////////

function Song(trackid, title, artist, coverart, previewURL, uri) {
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
      self.songs.push(new Song(trackid,title,artist,coverart,previewURL,uri));     
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

function removeOverlay(URL) {
  document.getElementById("spotifyOverlay").style.height = "0%";
}

function addExportOverlay(URL) {
  document.getElementById("exportOverlay").style.height = "100%";
}

function getURLParam(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
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
  i = 0;
  while (currentLength < playlistLength){
    selected_tracks.push(tracks[i])
    currentLength += tracks[i]['duration_ms'];
    i += 1;
    if (i == n_tracks) {
      break;
    }
  }

  return selected_tracks;
}



$(document).ready(function() {
  var user_tracks = getURLParam("trackids");
  var pl = getURLParam("pl");
  var playlist_option = getURLParam("playlist_option");
  var length_option = getURLParam("length_option");
  var access_token = getURLParam("access_token");
  var refresh_token = getURLParam("refresh_token");
  var userid;
  var category_map = {'chill':{'option1':'Sleep','option2':'Relax','option3':'Focus'},'party':{'option1':'Pre-Game','option2':'Dance Party','option3':'Late Night'},'workout':{'option1':'Warm Up','option2':'Gym','option3':'Cardio'},'hangout':{'option1':'Dinner','option2':'Feel Good','option3':'BBQ'}};

  document.getElementById("spotifyOverlayText").innerHTML = "Building your playlist…";
  if (access_token && pl && length_option && user_tracks && playlist_option) {

    $.ajax({
        url: 'https://api.spotify.com/v1/me/',
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
          userid = response.id
        }
    });

    data = {'tracks':user_tracks.split(','),'pl':pl,'playlist_option':playlist_option}
    $.ajax({
        type : "POST",
        url : "/api/songs",
        data: JSON.stringify(data, null, '\t'),
        contentType: 'application/json;charset=UTF-8',
        success: function(result) {
            buildPlaylist(result.data.songs);
            $('.song-info-loading').hide();
            $('.influencers').removeClass("hidden");
            removeOverlay();
        }
      });

  }

  else {
    shOverlay('/');
  }

  /////////// PLAYLIST
  // Export playlist
  $('.export-button').click(function() {
    exportToSpotify();
    ga('send', 'event', 'button', 'click', 'export', 'export-top');
  });

  $('#export-bottom').click(function() {
    exportToSpotify();
    ga('send', 'event', 'button', 'click', 'export', 'export-bottom');
  });

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

          $("#playlist-meta").text(tracks.length + " songs and is " + length_text);
        }
    });
  }

  function exportToSpotify(){
    addExportOverlay();

    ga('send', 'event', 'export-data', category_map[pl][playlist_option], length_option, user_tracks.length, {'nonInteraction': 1});

    data = {
      "name": category_map[pl][playlist_option] + ' QuickMix',
      "public": true
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
        var tracklist = [];
        for (i in PVM.songs()){
          tracklist.push(PVM.songs()[i].uri)
        }
        // Populate playlist with tracks
        $.ajax({
          type : "POST",
          url : "https://api.spotify.com/v1/users/"+userid+"/playlists/"+playlist_id+"/tracks?uri",
          data: JSON.stringify({'uris':tracklist}, null, '\t'),
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          contentType: 'application/json;charset=UTF-8',
          success: function(result) {
            $('#export-playlist-text').text('Success!');
            setTimeout( function() { window.location = '/' }, 1000 );
          }
        });
      }
    });
  }

  function shOverlay(URL) {
    document.getElementById("spotifyOverlayText").innerHTML = "Something just isn’t quite right…";
    setTimeout( function() { window.location =  URL}, 1200 );
  }

});
