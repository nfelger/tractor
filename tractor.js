window.daysOfTheWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
window.months = ['Jan','Feb','Mar','Apr','May','Jun', 'Jul','Aug','Sep','Oct','Nov','Dec'];

window.Artist = Backbone.Model.extend({});

window.ArtistCollection = Backbone.Collection.extend({
  model: Artist,
  
  initialize: function() {
    _.bindAll(this, "url");
  },
	
  url: function() {
    return "http://localhost:3000/textract?url=" + escape(this.currentTabUrl);
  }
});

window.Event = Backbone.Model.extend({});

window.Calendar = Backbone.Collection.extend({
  model: Event,

  initialize: function() {
    _.bindAll(this, "url");
  },

  url: function() {
    return "http://api.songkick.com/api/3.0/artists/mbid:" + escape(this.musicbrainzID) + "/calendar.json?apikey=musichackday";
  },

  parse: function(response) {
    return response.resultsPage.results.event;
  }
});

window.SoundCloudUser = Backbone.Model.extend({
  initialize: function() {
    _.bindAll(this, "url");
  },
  
  url: function() {
    return "http://api.soundcloud.com/users.json?client_id=fad9326e3e746152a6d761a8f333f42c&q=" + escape(this.artistName);
  },
  
  parse: function(response) {
    return response[0];
  }
});

window.Timeseries = Backbone.Model.extend({
   initialize: function() {
    _.bindAll(this, "url");
  },

  url: function() {
    return "http://apib2.semetric.com/artist/musicbrainz:" + escape(this.musicbrainzID) + "/" + escape(this.dataset) + "?token=bbc004e8891211e0ba8f00163e499d92";
  },

  parse: function(response) {
    return response.response;
  }
});

window.ArtistImage = Backbone.Model.extend({
  initialize: function() {
    _.bindAll(this, "url");
  },

  url: function() {
    return "http://ws.audioscrobbler.com/2.0/?format=json&method=artist.getinfo&artist=" + escape(this.artistName) + "&api_key=55452202851c1c703bb26c4f42045b16";
  },

  parse: function(response) {
    return response.artist.image[1];
  }
});

window.SongkickCalendarView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, "setCalendar", "render");
    this.template = _.template($('#songkick-listing-item-template').html());
  },

  render: function() {
    var template = this.template;
    var html = "";
    this.calendar.each(function(event) {
      var venueOrFestivalName = (event.get("type") === "Festival" ? event.get("displayName") : event.get("venue").displayName)
      var date = new Date(event.get("start").date);
      html = html + template({
        dayOfWeek: window.daysOfTheWeek[date.getDay()],
        dayOfMonth: date.getDate(),
        month: window.months[date.getMonth()],
        venueOrFestivalName: venueOrFestivalName,
        city: event.get("location").city,
        songkickUrl: event.get("uri")
      });
    });
    this.el.append($(html));
  },

  setCalendar: function(calendar) {
    this.calendar = calendar;
    this.calendar.bind("refresh", this.render);
    this.calendar.fetch();
  }
});

window.ArtistView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, "render", "renderSoundCloudPlayer");
    this.template = _.template($('#artist-template').html());
    this.soundCloudPlayerTemplate = _.template($('#soundCloudPlayerTemplate').html());
  },
  
  renderSoundCloudPlayer: function(element) {
    var template = this.soundCloudPlayerTemplate;
    return function(soundCloudUser) {
      if (soundCloudUser.get("track_count") === 0) {
        element.html($("<span>No tracks available on SoundCloud.</span>"));
        return;
      }
      var elementId = "soundCloudPlayer" + soundCloudUser.get("id");
      var soundCloudUrl = soundCloudUser.get("permalink_url");
      var playerSrc = "http://player.soundcloud.com/player.swf?url=" +
        escape(soundCloudUrl) +
        "&enable_api=true&buying=false&sharing=false&show_bpm=false&show_playcount=false" +
        "&show_user=false&show_artwork=false&show_playcount=false&show_bpm=false&show_comments=false";
      element.html(template({
        elementId: elementId,
        playerSrc: playerSrc
      }));
    };
  },
  
  renderTimeseries: function(element) {
    return function(timeseries) {element.sparkline(timeseries.get("data"));};
  },

  renderArtistImage: function(element) {
      return function(artistImage) {element.html("<img src=\"" + artistImage.get("#text") + "\"></img>");};
  },

  render: function(artist) {
    $(this.el).html(this.template(artist.toJSON()));
    
    var soundCloudUser = new SoundCloudUser;
    soundCloudUser.artistName = artist.get("name");
    soundCloudUser.bind("change", this.renderSoundCloudPlayer(this.$(".soundCloudPlayer")));
    soundCloudUser.fetch();
    
    var timeseries = new Timeseries;
    timeseries.musicbrainzID = artist.get("mbid");
    timeseries.dataset = "plays/youtube";
    timeseries.bind("change", this.renderTimeseries(this.$(".sparkline-youtube")));
    timeseries.fetch();

    timeseries = new Timeseries;
    timeseries.musicbrainzID = artist.get("mbid");
    timeseries.dataset = "fans/twitter";
    timeseries.bind("change", this.renderTimeseries(this.$(".sparkline-twitter")));
    timeseries.fetch();

    timeseries = new Timeseries;
    timeseries.musicbrainzID = artist.get("mbid");
    timeseries.dataset = "comments/myspace";
    timeseries.bind("change", this.renderTimeseries(this.$(".sparkline-myspace")));
    timeseries.fetch();

    var artistImage = new ArtistImage;
    artistImage.artistName = artist.get("name");
    artistImage.bind("change", this.renderArtistImage(this.$(".artist-image")));
    artistImage.fetch();    

    var calendar = new Calendar;
    calendar.musicbrainzID = artist.get("mbid");
    
    var songkickCalendarView = new SongkickCalendarView;
    songkickCalendarView.el = this.$('.songkick-listing');
    songkickCalendarView.setCalendar(calendar);
  }
});
  
window.AppView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, "setArtists", "render");
    this.el = $('#artists');
  },
  
  setArtists: function(artists) {
    this.artists = artists;
    this.artists.bind("refresh", this.render);
    this.artists.fetch();
  },
  
  render: function() {
    var el = this.el;
    this.artists.each(function(artist) {
      var artistListItem = $("<li></li>")
      var artistView = new ArtistView;
      artistView.el = artistListItem;
      artistView.render(artist);
      el.append(artistListItem);
    });
  }
});
