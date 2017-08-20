///////////// Knockout.js definitions //////////////

function Song(trackid, title, artist, coverart, previewURL) {
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

    
    // Operations
    self.addSong = function(trackid,title,artist,coverart,option,previewURL) {
      if (option == 'option1'){
        self.songs1.push(new Song(trackid,title,artist,coverart,previewURL));
      }
      else if (option == 'option2'){
        self.songs2.push(new Song(trackid,title,artist,coverart,previewURL));
      }
      else if (option == 'option3'){
        self.songs3.push(new Song(trackid,title,artist,coverart,previewURL));
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

ko.applyBindings(IVM);

////////////////////////////////////////////////////


$(document).ready(function() {


  function getSpotifyUserId(){
    $.ajax({
        url: 'https://api.spotify.com/v1/me/',
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
          userid = response.id
        }
    });
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

  function validateInfluencers(callback){

    // Send to backend for validation
    data = {'tracks':user_tracks,'category':playlist_type}
    // console.log(JSON.stringify(data, null, '\t'))
    $.ajax({
        type : "POST",
        url : "https://5sgoxzland.execute-api.us-east-1.amazonaws.com/prod/quickmix_validate/validate",
        data: JSON.stringify(data, null, '\t'),
        contentType: 'application/json;charset=UTF-8',
        success: function(result) {
          
          result = JSON.parse(result['body'])

          // Validation success
          validated_influencers = result['data'];

          $('.song-info-loading').hide();
          $('.influencers').removeClass("hidden");
          $('#loggedin').show();

          callback();

        }
    });    
  }

  function loadInfluencers(){

    options = ['option1','option2','option3']
    for (var option in options){ // loop through each of the 3 mood options
      for (k in validated_influencers[options[option]].tracks){ // loop through the validated songs for that mood
        trackid = validated_influencers[options[option]].tracks[k].id
        track = user_track_data[trackid] // get stored track info
        IVM.addSong(trackid,track.title,track.artist,track.coverart,options[option],track.previewURL); // add to knockout view
      }
    }
      
  }

  function sendToPlaylist(){
    window.location.href = '/playlist?access_token=' + access_token + "&refresh_token=" + refresh_token + "&pl=" + playlist_type + "&playlist_option=" + IVM.moodOption() + "&trackids=" + IVM.influencers().join() + "&length_option=" + IVM.lengthOption();
  }

  var user_tracks = [];
  var user_track_data = {};
  var validated_influencers;
  var userid;
  var access_token = getURLParam("access_token");
  var refresh_token = getURLParam("refresh_token");
  var playlist_type = getURLParam("pl");

    if (access_token && playlist_type) {

      /// Call Spotify api in parallel for top songs; reduce, validate, and load songs in view
      async.auto({
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
                callback(null);
              })
          }]
      }, function(err, results) {
          // console.log('err = ', err);
          loadInfluencers();
      });

      
      // getSpotifyUserId();


    } else {
        shOverlay('/');
    }

    $('#go-to-playlist').click(function(e){
        e.preventDefault();
        sendToPlaylist();
      });
    $('#makeplaylist').click(function(e){
        e.preventDefault();
        sendToPlaylist();
      });

});

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
