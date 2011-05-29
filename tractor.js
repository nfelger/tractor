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
        city: event.get("location").city
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
    _.bindAll(this, "render");
    this.template = _.template($('#artist-template').html());
  },
  
  render: function(artist) {
    $(this.el).html(this.template(artist.toJSON()));
    
    var calendar = new Calendar;
    calendar.musicbrainzID = artist.attributes.mbid;
    
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
